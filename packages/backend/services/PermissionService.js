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
        if ( ! ( 'post' in context) && 'postId' in context ) {
            context.post = await this.postDAO.getPostById(context.postId)
        }

        if ( ! ('post' in context) || context.post === null || context.post === undefined ) {
            throw new ServiceError('missing-context', `'post' missing from context.`) 
        }

        // Users can always view their own posts.
        if ( context.post.userId === user.id ) {
            return true
        }

        // If the post is a Group post, then it depends on type of group:
        // - Posts in Open groups are publicly visible.
        // - Posts in Hidden or Private groups are visible to members of the group.
        if ( context.post.groupId ) {
            return await this.canViewGroupContent(user, context)
        }

        // Otherwise, they can only view the posts if they are friends with the poster.
        if ( ! ( 'relationship' in context) ) {
            context.relationship = await this.userRelationshipDAO.getUserRelationshipByUserAndRelation(user.id, context.post.userId)
        }
        if ( context.relationship !== null && context.relationship.status === 'confirmed') {
            return true
        }

        return false 
    }

    async canUpdatePost(user, context) {
        if ( ! ( 'post' in context) && 'postId' in context ) {
            context.post = await this.postDAO.getPostById(context.postId)
        } 

        if ( ! ('post' in context) || context.post === null || context.post === undefined ) {
            throw new ServiceError('missing-context', `'post' missing from context.`) 
        }

        if ( context.post.userId === user.id ) {
            return true
        }

        return false
    }

    async canDeletePost(user, context) {
        if ( ! ( 'post' in context) && 'postId' in context ) {
            context.post = await this.postDAO.getPostById(context.postId)
        }

        if ( ! ('post' in context) || context.post === null || context.post === undefined ) {
            throw new ServiceError('missing-context', `'post' missing from context.`) 
        }

        // Users can always delete their own posts.
        if ( context.post.userId === user.id ) {
            return true
        }

        // If the post is in a group, then moderators and admins of the group
        // can also delete posts.
        if ( context.post.groupId ) {
            return await this.canModerateGroup(user, { groupId: context.post.groupId })
        }
    }

    async canViewGroup(user, context) {
        if ( ! ('group' in context) ) {
            if ( 'groupId' in context ) {
                context.group = await this.groupDAO.getGroupById(context.groupId)
            } else if ( 'post' in context ) {
                if ( 'groupId' in context.post && context.post.groupId !== null && context.post.groupId !== undefined ) {
                    context.group = await this.groupDAO.getGroupById(context.post.groupId)
                }
            }
        }

        if ( ! ('group' in context) || context.group === null || context.group ===  undefined ) {
            throw new ServiceError('missing-context', `'group' missing from context.`)
        }

        if ( context.group.type === 'open' || context.group.type == 'private') {
            return true
        }

        if ( ! ('groupMember' in context) || context.groupMember === undefined ) {
            context.groupMember = await this.groupMemberDAO.getGroupMemberByGroupAndUser(context.group.id, user.id, true)
        }

        if ( context.groupMember !== null ) {
            return true 
        }

        return false 
    }

    async canUpdateGroup(user, context) {
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

        if ( ! ('groupMember' in context || context.groupMember === undefined) ) {
            context.groupMember = await this.groupMemberDAO.getGroupMemberByGroupAndUser(context.groupId, user.id, true)
        }

        if ( context.member !== null && context.member.status === 'member' && context.member.role === 'admin') {
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

        if ( context.groupMember !== null && context.groupMember.status === 'member' && (context.groupMember.role === 'moderator' || context.groupMember.role === 'admin')) {
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
        if ( ! ('group' in context) ) {
            if ( 'groupId' in context ) {
                context.group = await this.groupDAO.getGroupById(context.groupId)
            } else if ( 'post' in context ) {
                context.group = await this.groupDAO.getGroupById(context.post.groupId)
            }
        }

        if ( ! ('group' in context) || context.group === null || context.group ===  undefined ) {
            throw new ServiceError('missing-context', `'group' missing from context.`)
        }

        if ( context.group.type === 'open' ) {
            return true
        }

        if ( ! ('groupMember' in context) || context.groupMember === undefined ) {
            context.groupMember = await this.groupMemberDAO.getGroupMemberByGroupAndUser(context.group.id, user.id, true)
        }

        if ( context.groupMember !== null && context.groupMember.status === 'member') {
            return true 
        }
        return false 
    }

}
