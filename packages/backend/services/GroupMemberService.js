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

const NotificationService = require('./NotificationService')
const PermissionService = require('./PermissionService')
const ValidationService = require('./ValidationService')

const UserErrors = require('../errors/UserErrors')
const ServiceError = require('../errors/ServiceError')

module.exports = class GroupMemberService {
    constructor(core) {
        this.core = core

        this.groupDAO = new GroupDAO(core)
        this.groupMemberDAO = new GroupMemberDAO(core)

        this.notificationService = new NotificationService(core)
        this.permissionService = new PermissionService(core)
        this.validationService = new ValidationService(core)
    }

    async inviteGroupMember(currentUser, groupId, member) {
        const errors = new UserErrors(this.core) 

        // GroupIds must be consistent.
        if ( member.groupId !== groupId ) {
            errors.addErrors(499, { 
                type: 'invalid',
                log: `User(${currentUser.id}) attempting to add member to Group(${member.groupId}) on Group(${groupId})'s endpoint.`,
                message: `The groupId in the member and the route must match.`
            })
            return [ null, errors ]
        }

        const group = await this.groupDAO.getGroupById(groupId)
        if ( ! group ) {
            errors.addErrors(404, {
				type: 'not-found',
                log: `User(${currentUser.id}) attempting to add a member to a Group that doesn't exist.`,
                message:`Either that Group doesn't exist or you don't have permission to see it.`
            })
            return [ null, errors ]
        }

        const currentMember = await this.groupMemberDAO.getGroupMemberByGroupAndUser(groupId, currentUser.id) 

        const canViewGroup = await this.permissionService.can(currentUser, 'view', 'Group', { group: group, userMember: currentMember })
        if ( canViewGroup !== true ) {
            errors.addErrors(404, {
				type: 'not-found',
                log: `User(${currentUser.id}) attempting to add a member to a group without permission to view it.`,
                message: `Either that group doesn't exist or you don't have permission to see it.`
            })
            return [ null, errors ]
        }

        const canCreateGroupMember = await this.permissionService.can(currentUser, 'create', 'GroupMember', 
            { group: group, userMember: currentMember, groupMember: member })

        if ( canCreateGroupMember !== true ) {
            errors.addErrors(403, {
				type: 'not-authorized',
                log: `User attempting to create a new member in Group(${groupId}) without authorization.`,
                message: `You are not authorized to add members to that Group.`
            })
            return [ null, errors ]
        }

        const existing = await this.groupMemberDAO.getGroupMemberByGroupAndUser(groupId, member.userId)

        // If a member already exists, then bail out.
        if ( existing && existing.userId == member.userId ) {
            errors.addErrors(409, {
				type: 'conflict',
                log: `User attempting to add a member to a Group that has already been added.`,
                message: `That member has already been added to that Group.`
            })
            return [ null, errors ]
        }

        const validationErrors = await this.validationService.validateGroupMember(currentUser, member)
        if ( validationErrors.length > 0 ) {
            errors.addErrors(499, ...validationErrors)
            return [ null, errors ]
        }

        await this.groupMemberDAO.insertGroupMembers(member)

        const results = await this.groupMemberDAO.selectGroupMembers({
            where: `group_members.user_id = $1 AND group_members.group_id = $2`,
            params: [member.userId, member.groupId]
        })

        if ( results.list.length <= 0 ) {
            throw new ServiceError('server-error', 
                `Failed to find GroupMember(${member.groupId},${member.userId}) after insertion.`)
        }

        const entity = results.dictionary[results.list[0]]

        await this.notificationService.sendNotifications(
            currentUser, 
            'GroupMember:create', 
            {
                group: group,
                member: entity
            }
        )

        return [ entity, errors ]
    }


}
