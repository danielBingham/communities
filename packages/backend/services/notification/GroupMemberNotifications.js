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

const path = require('path')

const { lib } = require('@communities/shared')

const GroupDAO = require('../../daos/GroupDAO')
const GroupMemberDAO = require('../../daos/GroupMemberDAO')
const PostCommentDAO = require('../../daos/PostCommentDAO')
const PostSubscriptionDAO = require('../../daos/PostSubscriptionDAO')
const UserDAO = require('../../daos/UserDAO')

const PermissionService = require('../PermissionService')

module.exports = class GroupMemberNotifications {

    static notifications = [
            'GroupMember:create:status:pending-invited:member',
            'GroupMember:create:status:pending-requested:moderator',
            'GroupMember:update:status:pending-requested-member:member',
            'GroupMember:update:role:moderator:member',
            'GroupMember:update:role:admin:member'
    ]

    constructor(core, notificationService) {
        this.core = core
        this.notificationService = notificationService

        this.groupDAO = new GroupDAO(core)
        this.groupMemberDAO = new GroupMemberDAO(core)
        this.postCommentDAO = new PostCommentDAO(core)
        this.postSubscriptionDAO = new PostSubscriptionDAO(core)
        this.userDAO = new UserDAO(core)

        this.permissionService = new PermissionService(core)
    }

    async ensureContext(currentUser, type, context) {
        context.user = await this.userDAO.getUserById(context.member.userId, ['status'])
    }

    async create(currentUser, type, context, options) {
        await this.ensureContext(currentUser, type, context)

        if ( context.member.status == 'pending-invited' ) {
            context.inviter = currentUser
            await this.notificationService.createNotification(context.user.id, 'GroupMember:create:status:pending-invited:member', context, options)
        } else if ( context.member.status == 'pending-requested' ) {
            const moderatorResults = await this.groupMemberDAO.selectGroupMembers({
                where: `(group_members.role = 'admin' OR group_members.role = 'moderator') AND group_members.group_id = $1`,
                params: [ context.group.id ]
            })

            for(const id of moderatorResults.list ) {
                const moderatorMember = moderatorResults.dictionary[id]

                await this.notificationService.createNotification(
                    moderatorMember.userId, 
                    'GroupMember:create:status:pending-requested:moderator', 
                    { ...context, moderator: moderatorMember },
                    options
                )
            }
        }
    }

    async update(currentUser, type, context, options) {
        await this.ensureContext(currentUser, type, context)

        if ( context.previousStatus == 'pending-requested' && context.member.status == 'member' ) {
            await this.notificationService.createNotification(
                context.user.id,
                'GroupMember:update:status:pending-requested-member:member',
                context,
                options
            )
        } else if ( context.previousRole == 'member' && context.member.role == 'moderator' ) {
            await this.notificationService.createNotification(
                context.user.id,
                'GroupMember:update:role:moderator:member',
                { ...context, promoter: currentUser },
                options
            )
        } else if ( context.previousRole == 'moderator' && context.member.role == 'admin' ) {
            await this.notificationService.createNotification(
                context.user.id,
                'GroupMember:update:role:admin:member',
                { ...context, promoter: currentUser },
                options
            )

        }
    }
}
