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

const { GroupDAO, GroupMemberDAO, UserRelationshipDAO } = require('@communities/backend')

const ServiceError = require('../errors/ServiceError')

module.exports = class PermissionService {
    constructor(core) {
        this.core = core

        this.groupDAO = new GroupDAO(core)
        this.groupMemberDAO = new GroupMemberDAO(core)
        this.userRelationshipDAO = new UserRelationshipDAO(core)
    }

    /**
     * Can `user` perform `action` on `entity` identified by `context.
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
            }
        } else if ( entity === 'Group:content' ) {
            if ( action === 'view' ) {
                return await this.canViewGroupContent(user, context)
            }
        } else if ( entity === 'User' ) {
            if ( action === 'view' ) {
                return true
            } else if ( action === 'update' ) {
                return user.id === context.user.id
            } else if ( action === 'delete' ) {
                return user.id === context.user.id
            }
        }

        throw new ServiceError('unsupported', `Unsupported Entity(${entity}) or Action(${action}).`)
    }

    async canViewPost(user, context) {
        const post = context.post

        // Users can always view their own posts.
        if ( post.userId === user.id ) {
            return true
        }

        // If the post is a Group post, then it depends on type of group:
        // - Posts in Open groups are publicly visible.
        // - Posts in Hidden or Private groups are visible to members of the group.
        if ( post.groupId ) {
            return await this.canViewGroupContent(user, context)
        }

        // Otherwise, they can only view the posts if they are friends with the poster.
        let relationship = context.userRelationship
        if ( ! relationship ) {
            relationship = await this.userRelationshipDAO.getRelationshipByUserAndRelation(user.id, post.userId)
        }
        if ( relationship !== null && relationship.status === 'confirmed') {
            return true
        }

        return false 
    }

    async canUpdatePost(user, context) {
        if ( context.post.userId === user.id ) {
            return true
        }

        return false
    }

    async canDeletePost(user, context) {
        // Users can always delete their own posts.
        if ( context.post.userId === user.id ) {
            return true
        }

        // If the post is in a group, then moderators and admins of the group
        // can also delete posts.
        if ( context.post.groupId ) {
            return await this.canModerateGroup(user, { groupId: post.groupId })
        }
    }

    async canViewGroup(user, context) {
        let group = context.group
        if ( ! group ) {
            group = await this.groupDAO.getGroupById(post.groupId)
        }

        if ( group.type === 'open' || group.type == 'private') {
            return true
        }

        if ( ! ('member' in context) ) {
            member = await this.groupMemberDAO.getGroupMemberByGroupAndUser(group.id, user.id, true)
        }

        if ( member !== null && member.status === 'member') {
            return true 
        }
        return false 
    }

    async canUpdateGroup(user, groupId) {
        const member = await this.groupMemberDAO.getGroupMemberByGroupAndUser(groupId, user.id, true)
        if ( member !== null && member.status === 'member' && member.role === 'admin') {
            return true 
        }
        return false 

    }

    async canDeleteGroup(user, groupId) {
        const member = await this.groupMemberDAO.getGroupMemberByGroupAndUser(groupId, user.id, true)
        if ( member !== null && member.status === 'member' && member.role === 'admin') {
            return true 
        }
        return false 
    }

    async canModerateGroup(user, groupId) {
        const member = await this.groupMemberDAO.getGroupMemberByGroupAndUser(groupId, user.id, true)
        if ( member !== null && member.status === 'member' && (member.role === 'moderator' || member.role === 'admin')) {
            return true 
        }
        return false 
    }

    async canViewGroupContent(user, group) {
        if ( group.type === 'open' ) {
            return true
        }

        const member = await this.groupMemberDAO.getGroupMemberByGroupAndUser(post.groupId, user.id, true)
        if ( member !== null && member.status === 'member') {
            return true 
        }
        return false 
    }

}
