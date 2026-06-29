/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media 
 *
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

const UserDAO = require('../../../daos/UserDAO')

const PermissionService = require('../../PermissionService')

module.exports = class UserNotifications {
    static notifications = [
        'User:update:mfa',
        'User:update:password'
    ]

    constructor(core, notificationWorker) {
        this.core = core
        this.notificationWorker = notificationWorker

        this.userDAO = new UserDAO(core)

        this.permissionService = new PermissionService(core)
    }

    async ensureContext(currentUser, type, context, options) {
        context.user = await this.userDAO.getUserById(context.userId)
    }

    async update(currentUser, type, context, options) {
        await this.ensureContext(currentUser, type, context, options)

        if ( type === 'User:update:mfa' ) {
            if ( currentUser.id !== context.userId ) {
                this.core.logger.error(`'currentUser', User(${currentUser.id}), doesn't match 'userId', User(${context.userId}), when sending 'User:update:mfa'.  This should never happen.`)
                return
            }

            await this.notificationWorker.createNotification(context.userId, 'User:update:mfa', context, options)
        }
    }
}
