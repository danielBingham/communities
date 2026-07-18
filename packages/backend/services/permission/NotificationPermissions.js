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

const { util, permissions } = require('@communities/shared')

const NotificationDAO = require('../../daos/NotificationDAO')

const ServiceError = require('../../errors/ServiceError')

module.exports = class NotificationPermissions {

    constructor(core, permissionService) {
        this.core = core

        this.notificationDAO = new NotificationDAO(core)

        this.permissionService = permissionService
    }

    async ensureContext(user, context, required, optional) {
        if ( ( required?.includes('notification') || optional?.includes('notification') )
            && ( ! util.objectHas(context, 'notification') || context.notification === null )
        ) {

            // If it's already set to null, then we don't want to load it.
            // It's absent.
            if ( context.notification !== null ) {
                if ( util.objectHas(context, 'notificationId') ) {
                    context.notification = await this.notificationDAO.getNotificationById(context.notificationId)
                } else {
                    context.notification = null
                }
            }

            if ( required?.includes('notification')
                && ( ! util.objectHas(context, 'notification') || context.notification === null )
            ) {
                throw new ServiceError('missing-context', `'notification' missing from context.`)
            }
        }
    }

    // Users can always query their own notifications.
    async canQueryNotification(user, context) {
        return true
    }

    // Notifications are not created client side, only server side.
    async canCreateNotification(user, context) {
        return false
    }

    // Users can view their own notifications.
    async canViewNotification(user, context) {
        await this.ensureContext(user, context, [ 'notification' ])

        if ( context.notification.userId === user.id ) {
            return true
        }

        return false
    }

    // Users can update their own notifications (in order to make them read).
    async canUpdateNotification(user, context) {
        await this.ensureContext(user, context, [ 'notification' ])

        if ( context.notification.userId === user.id ) {
            return true
        }

        return false
    }

    // Notifications are never deleted.
    async canDeleteNotification(user, context) {
        return false
    }
}
