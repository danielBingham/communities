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
        // ======== Context Validation and Retrieval ==========================
        //
        if ( contextHas(context, 'groupId') && contextHas(context, 'group')
            && context.groupId !== context.group.id ) 
        {
            throw new ServiceError('invalid-context:group',
                `Group.id does not equal groupId.`)
        }

        if ( contextHas(context, 'groupId') && contextHas(context, 'userMember')
            && context.groupId !== context.userMember.groupId )
        {
            throw new ServiceError('invalid-context:userMember',
                `GroupMember.groupId does not equal groupId.`)
        }

        if ( contextHas(context, 'group') && contextHas(context, 'userMember')
            && context.group.id !== context.userMember.groupId )
        {
            throw new ServiceError('invalid-context:userMember',
                `Group.id does not equal GroupMember.groupId.`)
        }

        // If we don't have the group, then attempt to load it.
        if ( ! contextHas(context, 'group') ) {
            if ( contextHas(context, 'groupId') ) {
                context.group = await this.groupDAO.getGroupById(context.groupId)
            }  else if ( contextHas(context, 'userMember') && context.userMember.groupId !== undefined && context.userMember.groupId !== null ) {
                context.group = await this.groupDAO.getGroupById(context.userMember.groupId)
            }
        } 

        if ( ! contextHas(context, 'group') ) { 
            throw new ServiceError('missing-context', `'group' missing from context.`)
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
        } else {
            if ( context.groupMember.groupId !== context.group.id ) {
                throw new ServiceError('invalid-context:groupMember',
                    `GroupMember.groupId does not equal Group.id.`)
            }
        }

        if ( required.includes('existingMember') && ! contextHas(context, 'existingMember') ) {
            if ( contextHas(context, 'groupMember') ) {
                if ( context.groupMember.id ) {
                    context.existingMember = await this.groupMemberDAO.getGroupMemberById(context.groupMember.id)
                } else {
                    context.existingMember = await this.groupMemberDAO.getGroupMemberByGroupAndUser(context.groupMember.groupId, context.groupMember.userId)
                }
            } 

            if ( ! contextHas(context, 'existingMember') ) {
                throw new ServiceError('missing-context',
                    `'existingMember' missing from context.`)
            }
        }
    }

    async canViewGroupMember(user, context) {
        return await this.permissionService.can(user, 'view', 'Group:content', context)
    }

    async canCreateGroupMember(user, context) {
        await this.ensureContext(user, context)
        
        const canModerateGroup = await this.permissionService.can(user, 'moderate', 'Group', context)

        // For open groups
        if ( context.group.type === 'open' ) {
            // Non members can add themselves
            if ( ! context.userMember ) {
                if ( context.groupMember.role === 'member' && context.groupMember.status === 'member' ) {
                    return true
                }
            }
            // Moderators can invite 
            if ( canModerateGroup ) {
                if ( context.groupMember.role === 'member' && context.groupMember.status === 'pending-invited' ) {
                    return true
                }
            }
        }
        // For private groups
        if ( context.group.type === 'private' ) {
            // Non members can request access
            if ( ! context.userMember ) {
                if ( context.groupMember.role === 'member' && context.groupMember.status === 'pending-requested' ) {
                    return true
                }
            }
            // Moderators can invite
            if ( canModerateGroup ) {
                if ( context.groupMember.role === 'member' && context.groupMember.status === 'pending-invited' ) {
                    return true
                }
            }
        }
        // For Hidden groups
        if ( context.group.type === 'hidden' ) {
            // Moderators can invite
            if ( canModerateGroup ) {
                if ( context.groupMember.role === 'member' && context.groupMember.status === 'pending-invited' ) {
                    return true
                }
            }
        }

        return false
    }

    async canUpdateGroupMember(user, context) {
        await this.ensureContext(user, context)
        
        const canAdminGroup = await this.permissionService.can(user, 'admin', 'Group', context)

        // Admins can promote members to moderator or admin
        if ( canAdminGroup ) {
            if ( context.existingMember.role === 'member' 
                && (context.groupMember.role === 'moderator' || context.groupMember.role === 'admin')) 
            {
                return true
            }

            if ( context.existingMember.role === 'moderator'
                && (context.groupMember.role === 'member' || context.groupMember.role === 'admin')) 
            {
                return true
            }
        }

        return false
    }

    async canDeleteGroupMember(user, context) {}


}
