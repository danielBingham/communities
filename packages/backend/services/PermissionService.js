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

const GroupMemberPermissions = require('./permission/GroupMemberPermissions')
const GroupPermissions = require('./permission/GroupPermissions')
const PostCommentPermissions = require('./permission/PostCommentPermissions')
const PostReactionPermissions = require('./permission/PostReactionPermissions')
const PostSubscriptionPermissions = require('./permission/PostSubscriptionPermissions')
const UserRelationshipPermissions = require('./permission/UserRelationshipPermissions')
const { contextHas } = require('./permission/permissionUtils')

const ServiceError = require('../errors/ServiceError')


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

        this.groupMember = new GroupMemberPermissions(core, this)
        this.group = new GroupPermissions(core, this)
        this.postComment = new PostCommentPermissions(core, this)
        this.postReaction = new PostReactionPermissions(core, this)
        this.postSubscription = new PostSubscriptionPermissions(core, this)
        this.userRelationship = new UserRelationshipPermissions(core, this)
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
                console.log(`Getting visible group ids.`)
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
                        LEFT OUTER JOIN group_members ON groups.id = group_members.group_id AND group_members.user_id = $1
                    WHERE (groups.type = 'open' AND (group_members.user_id IS NULL OR group_members.status != 'banned'))
                            OR (groups.type = 'private' AND (group_members.user_id IS NULL OR group_members.status != 'banned'))
                            OR (groups.type = 'hidden' AND group_members.user_id = $1 AND group_members.status != 'banned')
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
            if ( action === 'create' ) {
                return await this.group.canCreateGroup(user, context)
            } else if ( action === 'view' ) {
                return await this.group.canViewGroup(user, context)
            } else if ( action === 'update' ) {
                return await this.group.canUpdateGroup(user, context)
            } else if ( action === 'delete' ) {
                return await this.group.canDeleteGroup(user, context)
            } else if ( action === 'moderate' ) {
                return await this.group.canModerateGroup(user, context)
            } else if ( action === 'admin' ) {
                return await this.group.canAdminGroup(user, context)
            }
        } else if ( entity === 'Group:content' ) {
            if ( action === 'view' ) {
                return await this.group.canViewGroupContent(user, context)
            }
        } else if ( entity === 'GroupMember' ) {
            if ( action === 'view' ) {
                return await this.groupMember.canViewGroupMember(user, context)
            } else if ( action === 'create' ) {
                return await this.groupMember.canCreateGroupMember(user, context)
            } else if ( action === 'update' ) {
                return await this.groupMember.canUpdateGroupMember(user, context)
            } else if ( action === 'delete' ) {
                return await this.groupMember.canDeleteGroupMember(user, context)
            }
        } else if ( entity === 'PostComment' ) {
            if ( action === 'view' ) {
                return await this.postComment.canViewPostComment(user, context)
            } else if ( action === 'create' ) {
                return await this.postComment.canCreatePostComment(user, context)
            } else if ( action === 'update' ) {
                return await this.postComment.canUpdatePostComment(user, context)
            } else if ( action === 'delete' ) {
                return await this.postComment.canDeletePostComment(user, context)
            }
        } else if ( entity === 'PostReaction' ) {
            if ( action === 'view' ) {
                return await this.postReaction.canViewPostReaction(user, context)
            } else if ( action === 'create' ) {
                return await this.postReaction.canCreatePostReaction(user, context)
            } else if ( action === 'update' ) {
                return await this.postReaction.canUpdatePostReaction(user, context)
            } else if ( action === 'delete' ) {
                return await this.postReaction.canDeletePostReaction(user, context)
            }
        } else if ( entity === 'PostSubscription' ) {
            if ( action === 'view' ) {
                return await this.postSubscription.canViewPostSubscription(user, context)
            } else if ( action === 'create' ) {
                return await this.postSubscription.canCreatePostSubscription(user, context)
            } else if ( action === 'update' ) {
                return await this.postSubscription.canUpdatePostSubscription(user, context)
            } else if ( action === 'delete' ) {
                return await this.postSubscription.canDeletePostSubscription(user, context)
            }
        } else if ( entity === 'UserRelationship' ) {
            if ( action === 'view' ) {
                return await this.userRelationship.canViewUserRelationship(user, context)
            } else if ( action === 'create' ) {
                return await this.userRelationship.canCreateUserRelationship(user, context)
            } else if ( action === 'update' ) {
                return await this.userRelationship.canUpdateUserRelationship(user, context)
            } else if ( action === 'delete' ) {
                return await this.userRelationship.canDeleteUserRelationship(user, context)
            }
        } else if ( entity === 'Site' ) {
            if ( action === 'moderate' ) {
                return await this.canModerateSite(user, context)
            } else if ( action === 'admin' ) {
                return await this.canAdminSite(user, context)
            } else if ( action === 'sudo' ) {
                return this.canSudoSite(user, context)
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

        // Site moderators can always view posts.
        const canModerateSite = await this.canModerateSite(user)
        if ( canModerateSite ) {
            return true
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

            return await this.can(user, 'view', 'Group:content', context)
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
            return await this.can(user, 'moderate', 'Group', context)
        }

        return false
    }

    async canModerateSite(user, context) {
        if ( this.core.features.has('62-admin-moderation-controls') ) {
            return user.siteRole === 'moderator' || user.siteRole === 'admin' || user.siteRole === 'superadmin'
        } else {
            return user.permissions === 'moderator' || user.permissions === 'admin' || user.permissions === 'superadmin'
        }
    }

    async canAdminSite(user, context) {
        if ( this.core.features.has('62-admin-moderation-controls') ) {
            return user.siteRole === 'admin' || user.siteRole === 'superadmin'
        } else {
            return user.permissions === 'admin' || user.permissions === 'superadmin'
        }
    }

    async canSudoSite(user, context) {
        if ( this.core.features.has('62-admin-moderation-controls') ) {
            return user.siteRole === 'superadmin'
        } else {
            return user.permissions === 'superadmin'
        }
    }

}
