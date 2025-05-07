/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/

const GroupDAO = require('../daos/GroupDAO')
const GroupMemberDAO = require('../daos/GroupMemberDAO')
const PostDAO = require('../daos/PostDAO')
const UserRelationshipDAO = require('../daos/UserRelationshipDAO')

const ServiceError = require('../errors/ServiceError')

const contextHas = function(context, field) {
    return field in context && context[field] !== undefined && context[field] !== null
}

/**
 * 
 */
module.exports = class PermissionService {
    constructor(core) {
        this.core = core

        this.postDAO = new PostDAO(core)
        this.groupDAO = new GroupDAO(core)
        this.groupMemberDAO = new GroupMemberDAO(core)
        this.userRelationshipDAO = new UserRelationshipDAO(core)
    }

    /**
     * Get a list of `id` for `entity` that `user` can `action`.
     */
    async get(user, action, entity, context) {
        if ( entity === 'Post' ) {
            if ( action === 'view' ) {
                // TODO This is not going to scale beyond a few tens of
                // thousands of posts. So we'll need to come up with a better
                // way  to handle this.
                const relationships = await this.userRelationshipDAO.getUserRelationshipsForUser(user.id)  
                const friendIds = relationships.map((r) => r.userId === user.id ? r.relationId : r.userId)
                const groupIds = await this.get(user, 'view', 'Group:content')

                const results = await this.core.database.query(`
                    SELECT posts.id FROM posts 
                        WHERE posts.user_id = ANY($1::uuid[]) OR posts.group_id = ANY($2::uuid[[]) OR posts.visibility = 'public'
                `, [ friendIds, groupIds ]) 

                return results.rows.map((r) => r.id)
            }
        } else if ( entity === 'Group' ) {
            if ( action === 'view' ) {
                /**
                 * Group permissions vary by type:
                 *
                 * Open -- Anyone can view the group and its details. (And its
                 *      content, controlled by Group:content)
                 * Private -- Anyone can view the group and its details.  (But
                 *      not its content, controlled by Group:content)
                 * Hidden -- Only those with a membership (accepted or invite)
                 *      may view the group and its details. (Only those with an
                 *      accepted membership can view its content, controlled by
                 *      Group:content)
                 */
                const results = await this.core.database.query(`
                    SELECT groups.id FROM groups
                        LEFT OUTER JOIN group_members ON groups.id = group_members.group_id
                    WHERE groups.type = 'open' 
                        OR groups.type = 'private' 
                        OR (groups.type = 'hidden' AND group_members.user_id = $1)
                `, [ user.id ])

                return results.rows.map((r) => r.id)
            } 
        } else if ( entity === 'Group:content' ) {
            if ( action === 'view' ) {
                const results = await this.core.database.query(`
                    SELECT groups.id FROM groups
                        LEFT OUTER JOIN group_members ON groups.id = group_members.group_id
                    WHERE groups.type = 'open' 
                        OR (groups.type = 'private' AND group_members.user_id = $1 AND group_members.status = 'member')
                        OR (groups.type = 'hidden' AND group_members.user_id = $1 AND group_members.status = 'member')
                `, [ user.id ])

                return results.rows.map((r) => r.id)
            }
        }

        throw new ServiceError('unimplemented', 
            `Attempt to get entity '${entity}' or action '${action}' that hasn't been implemented yet.`)
    }

    /**
     * Can `user` perform `action` on `entity` identified by `context`.
     *
     * Will lazy load any missing context it needs, provided it has the minimal
     * amount of information to load it.  If it is provided the context, it
     * won't load it.  For example, when checking group permissions, if context
     * has a 'group' set on it, it will use that.  Otherwise, it will look for
     * a 'groupId' on the context and use that to load the group. If it can't
     * find one, it will look for a 'post' and use the post's groupId.
     *
     * @returns {Promise<boolean>} True if the `user` can perform `action` on `entity`
     * identified by `context`, false otherwise.
     */
    async can(user, action, entity, context) {
        if ( entity === 'Post' ) {
            if ( action === 'view' ) {
                return await this.canViewPost(user, context)
            } else if ( action === 'update') {
                return await this.canUpdatePost(user, context)
            } else if ( action === 'delete') {
                return await this.canDeletePost(user, context)
            }
        } else if ( entity === 'Group' ) {
            if ( action === 'view' ) {
                return await this.canViewGroup(user, context)
            } else if ( action === 'update' ) {
                return await this.canUpdateGroup(user, context)
            } else if ( action === 'delete' ) {
                return await this.canDeleteGroup(user, context)
            } else if ( action === 'moderate' ) {
                return await this.canModerateGroup(user, context)
            } else if ( action === 'admin' ) {
                return await this.canAdminGroup(user, context)
            }
        } else if ( entity === 'Group:content' ) {
            if ( action === 'view' ) {
                return await this.canViewGroupContent(user, context)
            }
        }

        throw new ServiceError('unsupported', `Unsupported Entity(${entity}) or Action(${action}).`)
    }

    async canViewPost(user, context) {
        if ( ! contextHas(context, 'post') && contextHas(context, 'postId')) {
            context.post = await this.postDAO.getPostById(context.postId)
        } else if ( contextHas(context, 'post') && contextHas(context, 'postId') ) { 
            if ( context.post.id !== context.postId ) {
                throw new ServiceError('invalid-context:post',
                    `Post.id is not the same as postId.`)
            }
        }

        if ( ! contextHas(context, 'post') ) {
            throw new ServiceError('missing-context', `'post' missing from context.`) 
        }

        // If the post is a Group post, then group permissions override post
        // permissions. It depends on type of group:
        //
        // - Posts in Open groups are publicly visible.
        // - Posts in Hidden or Private groups are visible to members of the group.
        //
        if ( context.post.groupId ) {
            if ( contextHas(context, 'group') && context.group.id !== context.post.groupId ) {
                throw new ServiceError('invalid-context:group', 
                    `Group in context does not match Post.groupId.`)
            } else if ( contextHas(context, 'groupId') && context.groupId !== context.post.groupId ) {
                throw new ServiceError('invalid-context:groupId', 
                    `GroupId in context does not match Post.groupId.`)
            }

            return await this.canViewGroupContent(user, context)
        }

        // If the post isn't in a group, then users can view their own
        // posts.
        if ( context.post.userId === user.id ) {
            return true
        } else if ( context.post.visibility === 'public' ) {
            return true
        }

        // Otherwise, they can only view the posts if they are friends with the poster.
        if ( ! contextHas(context, 'userRelationship') ) {
            context.userRelationship = await this.userRelationshipDAO.getUserRelationshipByUserAndRelation(user.id, context.post.userId)
        }

        if ( contextHas(context, 'userRelationship') && context.userRelationship.status === 'confirmed') {
            if ((context.userRelationship.userId !== context.post.userId && context.userRelationship.relationId !== context.post.userId)
                || (context.userRelationship.userId !== user.id && context.userRelationship.relationId !== user.id) )
            {
                throw new ServiceError('invalid-context:userRelationship',
                    `UserRelationship is not a relationship between Post author and user.`)
            }
            return true
        }

        return false 
    }

    async canUpdatePost(user, context) {
        // If we don't have the post in context, attempt to load it.
        if ( ! contextHas(context, 'post') && contextHas(context, 'postId')) {
            context.post = await this.postDAO.getPostById(context.postId)
        } 
        // Context must match up.
        else if ( contextHas(context, 'post') && contextHas(context, 'postId') ) {
            if ( context.post.id !== context.postId ) {
                throw new ServiceError('invalid-context:post',
                    `Post.id does not match postId.`)
            }
        }

        if ( ! contextHas(context, 'post')) {
            throw new ServiceError('missing-context', `'post' missing from context.`) 
        }

        if ( context.post.userId === user.id ) {
            return true
        }

        return false
    }

    async canDeletePost(user, context) {
        if ( ! contextHas(context, 'post') && contextHas(context, 'postId')) {
            context.post = await this.postDAO.getPostById(context.postId)
        }
        // Context must match up.
        else if ( contextHas(context, 'post') && contextHas(context, 'postId') ) {
            if ( context.post.id !== context.postId ) {
                throw new ServiceError('invalid-context:post',
                    `Post.id does not match postId.`)
            }
        }

        if ( ! contextHas(context, 'post') ) {
            throw new ServiceError('missing-context', `'post' missing from context.`) 
        }

        // Users can always delete their own posts.
        if ( context.post.userId === user.id ) {
            return true
        }

        // If the post is in a group, then moderators and admins of the group
        // can also delete posts.
        if ( 'groupId' in context.post && context.post.groupId !== undefined && context.post.groupId !== null) {
            return await this.canModerateGroup(user, context)
        }

        return false
    }

    async canViewGroup(user, context) {
        // Validate our context.
        if ( contextHas(context, 'group') && contextHas(context, 'groupId') 
            && context.group.id !== context.groupId ) 
        {
            throw new ServiceError('invalid-context:group',
                `Group.id and groupId do not match.`)
        }
        if ( contextHas(context, 'group') && contextHas(context, 'post')
            && context.group.id !== context.post.groupId ) 
        {
            throw new ServiceError('invalid-context:post',
                `Group.id and Post.groupId do not match.`)

        }
        if ( contextHas(context, 'groupId') && contextHas(context, 'post')
            && context.groupId !== context.post.groupId )
        {
            throw new ServiceError('invalid-context:post',
                `Post.groupId and groupId do not match.`)
        }

        // Look up primary missing context.
        if ( ! contextHas(context, 'group') ) {
            if ( contextHas(context, 'groupId') ) {
                context.group = await this.groupDAO.getGroupById(context.groupId)
            } else if ( contextHas(context, 'post') ) {
                if ( 'groupId' in context.post && context.post.groupId !== null && context.post.groupId !== undefined ) {
                    context.group = await this.groupDAO.getGroupById(context.post.groupId)
                }
            }
        }

        if ( ! contextHas(context, 'group') ) { 
            throw new ServiceError('missing-context:group', `'group' missing from context.`)
        }

        if ( context.group.type === 'open' || context.group.type == 'private') {
            return true
        }

        if ( ! contextHas(context, 'groupMember')) {
            context.groupMember = await this.groupMemberDAO.getGroupMemberByGroupAndUser(context.group.id, user.id, true)
        } 

        if ( contextHas(context, 'groupMember') && context.groupMember.groupId !== context.group.id ) {
            throw new ServiceError('invalid-context:groupMember',
                `GroupMember.groupId and Group.id do not match.`)
        }

        if ( context.groupMember !== null ) {
            return true 
        }

        return false 
    }

    async canUpdateGroup(user, context) {
        // Validate our context.
        //
        if ( contextHas(context, 'groupId') && contextHas(context, 'group')
            && context.groupId !== context.group.id ) 
        {
            throw new ServiceError('invalid-context:group',
                `Group.id does not equal groupId.`)
        }

        if ( contextHas(context, 'groupId') && contextHas(context, 'post')
            && context.groupId !== context.post.groupId )
        {
            throw new ServiceError('invalid-context:post',
                `Post.groupId does not equal groupId.`)
        }

        if ( contextHas(context, 'group') && contextHas(context, 'post')
            && context.group.id !== context.post.groupId )
        {
            throw new ServiceError('invalid-context:post',
                `Group.id does not equal post.groupId.`)
        }

        // Fill in any missing context.
        if ( ! contextHas(context, 'groupId') ) {
            if ( contextHas(context, 'group')) {
                context.groupId = context.group.id
            } else if ( contextHas(context, 'post')) {
                context.groupId = context.post.groupId
            }
        }

        if ( ! contextHas(context, 'groupId')) {
            throw new ServiceError('missing-context:groupId', `'groupId' missing from context.`)
        }

        if ( ! contextHas(context, 'groupMember')) {
            context.groupMember = await this.groupMemberDAO.getGroupMemberByGroupAndUser(context.groupId, user.id, true)
        }

        if ( contextHas(context, 'groupMember') && context.groupMember.groupId !== context.groupId ) {
            throw new ServiceError('invalid-context:groupMember',
                `GroupMember.groupId does not equal groupId.`)
        }

        if ( context.groupMember !== null && context.groupMember.status === 'member' && context.groupMember.role === 'admin') {
            return true 
        }
        return false 

    }

    async canDeleteGroup(user, context) {
        if ( ! ('groupId' in context) ) {
            if ( 'group' in context ) {
                context.groupId = context.group.id
            } else if ( 'post' in context ) {
                context.groupId = context.post.groupId
            }
        }

        if ( ! ('groupId' in context) || context.groupId === null || context.groupId ===  undefined ) {
            throw new ServiceError('missing-context', `'group' missing from context.`)
        }

        if ( ! ('groupMember' in context) || context.groupMember === undefined ) {
            context.groupMember = await this.groupMemberDAO.getGroupMemberByGroupAndUser(context.groupId, user.id, true)
        }

        if ( context.groupMember !== null && context.groupMember.status === 'member' && context.groupMember.role === 'admin') {
            return true 
        }
        return false 
    }

    async canModerateGroup(user, context) {
        // Validate the context.
        if ( contextHas(context, 'groupId') && contextHas(context, 'post') ) {
            if ( context.groupId !== context.post.groupId ) {
                throw new ServiceError(`invalid-context:post`,
                    `Post.groupId does not match groupId.`)
            }
        }

        if ( contextHas(context, 'groupId') && contextHas(context, 'group') ) {
            if ( context.groupId !== context.group.id) {
                throw new ServiceError('invalid-context:group',
                    `Group.id does not match groupId.`)
            }
        }
        if ( contextHas(context, 'group') && contextHas(context, 'post') ) {
            if ( context.group.id !== context.post.groupId ) {
                throw new ServiceError('invalid-context:group',
                    `Post.groupId does not match Group.id.`)
            }
        }


        // Retrieve the needed context.
        //
        // `groupId` overrides `group` overrides `post`
        //
        // But we should already have confirmed that these are all equivalent
        // above.
        if ( ! contextHas(context, 'groupId') ) {
            if ( contextHas(context, 'group')) {
                context.groupId = context.group.id
            } else if ( contextHas(context, 'post')) {
                context.groupId = context.post.groupId
            }
        }

        if ( ! contextHas(context, 'groupId')) {
            throw new ServiceError('missing-context', `'groupId' missing from context.`)
        }

        if ( ! contextHas(context, 'groupMember')) {
            context.groupMember = await this.groupMemberDAO.getGroupMemberByGroupAndUser(context.groupId, user.id, true)
        } else {
            if ( context.groupMember.groupId !== context.groupId ) {
                throw new ServiceError('invalid-context:groupMember',
                    `GroupMember.groupId does not match groupId.`)
            }
        }

        if ( contextHas(context, 'groupMember') 
            && context.groupMember.status === 'member' 
            && (context.groupMember.role === 'moderator' || context.groupMember.role === 'admin')) 
        {
            return true 
        }

        return false 
    }

    async canAdminGroup(user, context) {
        if ( ! ('groupId' in context) ) {
            if ( 'group' in context ) {
                context.groupId = context.group.id
            } else if ( 'post' in context ) {
                context.groupId = context.post.groupId
            }
        }

        if ( ! ('groupId' in context) || context.groupId === null || context.groupId ===  undefined ) {
            throw new ServiceError('missing-context', `'group' missing from context.`)
        }

        if ( ! ('groupMember' in context) || context.groupMember === undefined ) {
            context.groupMember = await this.groupMemberDAO.getGroupMemberByGroupAndUser(context.groupId, user.id, true)
        }

        if ( context.groupMember !== null && context.groupMember.status === 'member' && context.groupMember.role === 'admin') {
            return true 
        }
        return false 
    }

    async canViewGroupContent(user, context) {
        // If we don't have the group, then attempt to load it.
        if ( ! contextHas(context, 'group') ) {
            if ( contextHas(context, 'groupId') ) {
                context.group = await this.groupDAO.getGroupById(context.groupId)
            }  else if ( contextHas(context, 'post') && context.post.groupId !== undefined && context.post.groupId !== null ) {
                context.group = await this.groupDAO.getGroupById(context.post.groupId)
            }
        } 

        // Context must match up.
        else {
            if ( contextHas(context, 'groupId') && context.group.id !== context.groupId ) {
                throw new ServiceError('invalid-context:group', 
                    `Group.id does not match groupId.`)
            }
            if ( contextHas(context, 'post') && context.group.id !== context.post.groupId ) {
                throw new ServiceError('invalid-context:group',
                    `Group.id does not match Post.groupId.`)
            }
        }

        if ( ! contextHas(context, 'group') ) { 
            throw new ServiceError('missing-context', `'group' missing from context.`)
        }

        // Anyone can view content of open group.
        if ( context.group.type === 'open' ) {
            return true
        }

        if ( ! contextHas(context, 'groupMember') ) {
            context.groupMember = await this.groupMemberDAO.getGroupMemberByGroupAndUser(context.group.id, user.id, true)
        } 
        // Context must match up.
        else {
            if ( context.groupMember.groupId !== context.group.id ) {
                throw new ServiceError('invalid-context:groupMember',
                    `GroupMember provided is for the wrong Group.`)
            }
            if ( context.groupMember.userId !== user.id ) {
                throw new ServiceError('invalid-context:groupMember',
                    `GroupMember provided is for the wrong user.`)
            }
        }

        // Otherwise they must be a confirmed member of the group.
        if ( context.groupMember !== null && context.groupMember.status === 'member') {
            return true 
        }

        return false 
    }

}
