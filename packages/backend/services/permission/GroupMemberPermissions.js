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

const GroupDAO = require('../../daos/GroupDAO')
const GroupMemberDAO = require('../../daos/GroupMemberDAO')
const PostDAO = require('../../daos/PostDAO')
const UserRelationshipDAO = require('../../daos/UserRelationshipDAO')

const { contextHas } = require('./permissionUtils')

const ServiceError = require('../../errors/ServiceError')

module.exports = class GroupMemberPermissions {

    constructor(core, permissionService) {
        this.core 

        this.permissionService = permissionService 

        this.postDAO = new PostDAO(core)
        this.groupDAO = new GroupDAO(core)
        this.groupMemberDAO = new GroupMemberDAO(core)
        this.userRelationshipDAO = new UserRelationshipDAO(core)
    }

    async ensureContext(user, context, required) {
        // If we don't have the group, then attempt to load it.
        if ( required.includes('group') && ! contextHas(context, 'group') ) {
            // Load it from the groupId first.
            if ( contextHas(context, 'groupId') ) {
                context.group = await this.groupDAO.getGroupById(context.groupId)
            }  
            // Otherwise attempt to use the userMember.
            else if ( contextHas(context, 'userMember') && context.userMember.groupId !== undefined && context.userMember.groupId !== null ) {
                context.group = await this.groupDAO.getGroupById(context.userMember.groupId)
            }

            if ( ! contextHas(context, 'group') ) { 
                throw new ServiceError('missing-context', `'group' missing from context.`)
            }
        } 

        // If we don't have the user's groupMember then load it.
        if ( required.includes('userMember') && ! contextHas(context, 'userMember') ) {
            context.userMember = await this.groupMemberDAO.getGroupMemberByGroupAndUser(context.group.id, user.id, true)

            if ( ! contextHas(context, userMember) ) {
                throw new ServiceError('missing-context', `'userMember' missing from context.`)
            }
        } 

        if ( required.includes('groupMember') && ! contextHas(context, 'groupMember' ) ) {
            throw new ServiceError('missing-context', `'groupMember' missing from context.`)
        } 

        // ===== Ensure all elements of Group context match. ======
        
        let groupId = null
        if ( contextHas(context, 'groupId') ) {
            groupId = context.groupId
        }

        if ( contextHas(context, 'group') ) {
            if ( groupId === null ) {
                groupId = context.group.id
            } else if ( context.group.id !== groupId ) {
                throw new ServiceError('context-mismatch', `Context includes elements from different Groups.`)
            }
        }

        if ( contextHas(context, 'userMember') ) {
            if ( groupId === null ) {
                groupId = context.userMember.groupId
            } else if ( context.userMember.groupId !== groupId ) {
                throw new ServiceError('context-mismatch', `Context includes elements from different Groups.`)
            }
        }

        if ( contextHas(context, 'groupMember') ) {
            if ( groupId === null ) {
                groupId = context.groupMember.groupId
            } else if ( context.groupMember.groupId !== groupId )  {
                throw new ServiceError('context-mismatch', `Context includes elements from different Groups.`)
            }
        }
    }

    async canViewGroupMember(user, context) {
        return await this.permissionService.can(user, 'view', 'Group:content', context)
    }

    async canCreateGroupMember(user, context) {
        await this.ensureContext(user, context, [ 'group', 'groupMember', 'userMember' ])
        
        const canModerateGroup = await this.permissionService.can(user, 'moderate', 'Group', context)

        // For open groups
        if ( context.group.type === 'open' ) {
            return canModerateGroup || (context.userMember === null && context.groupMember.userId === user.id)
        }
        // For private groups
        if ( context.group.type === 'private' ) {
            return canModerateGroup || (context.userMember === null && context.groupMember.userId === user.id)
        }
        // For Hidden groups
        if ( context.group.type === 'hidden' ) {
            return canModerateGroup
        }

        return false
    }

    async canUpdateGroupMember(user, context) {
        await this.ensureContext(user, context, [ 'groupMember' ])
        
        const canAdminGroup = await this.permissionService.can(user, 'admin', 'Group', context)

        // Admins can promote members to moderator or admin
        if ( canAdminGroup ) {
            return true
        }

        // Users can update their own GroupMember in certain circumstances.
        if ( user.id === context.groupMember.userId ) {
            return true
        }

        return false
    }

    async canDeleteGroupMember(user, context) {
        await this.ensureContext(user, context, [ 'groupMember' ])

        const canModerateGroup = await this.permissionService.can(user, 'moderate', 'Group', context)

        // Moderators can remove users from a group.
        if ( canModerateGroup ) {
            return true
        }

        // Users can update their own GroupMember in certain circumstances.
        if ( user.id === context.groupMember.userId ) {
            return true
        }

        return false
    }


}
