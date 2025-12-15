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

const GroupDAO = require('../../../daos/GroupDAO')
const GroupMemberDAO = require('../../../daos/GroupMemberDAO')
const PostCommentDAO = require('../../../daos/PostCommentDAO')
const PostSubscriptionDAO = require('../../../daos/PostSubscriptionDAO')
const UserDAO = require('../../../daos/UserDAO')

const PermissionService = require('../../PermissionService')

module.exports = class GroupNotifications {

    static notifications = [
            'Group:update:title:changed:member',
    ]

    constructor(core, notificationWorker) {
        this.core = core
        this.notificationWorker = notificationWorker

        this.groupDAO = new GroupDAO(core)
        this.groupMemberDAO = new GroupMemberDAO(core)
        this.postCommentDAO = new PostCommentDAO(core)
        this.postSubscriptionDAO = new PostSubscriptionDAO(core)
        this.userDAO = new UserDAO(core)

        this.permissionService = new PermissionService(core)
    }

    async ensureContext(currentUser, type, context) {
        context.path = `/group/${context.group.slug}`
        context.link = new URL(context.path, this.core.config.host)
    }

    async update(currentUser, type, context, options) {
        await this.ensureContext(currentUser, type, context)

        if ( context.previousGroup.title !== context.group.title ) {
            const memberQuery = await this.core.database.query(`SELECT user_id FROM group_members WHERE group_id = $1`, [ context.group.id])
            for(const row of memberQuery.rows) {
                // Don't notify the user who performed the update.
                if ( row.user_id === currentUser.id ) {
                    continue
                }
                const user = await this.userDAO.getUserById(row.user_id)
                const newContext = {
                    ...context,
                    user: user
                }
                await this.notificationWorker.createNotification(
                    user.id,
                    'Group:update:title:changed:member',
                    newContext,
                    options
                )
            }
        }
    }
}
