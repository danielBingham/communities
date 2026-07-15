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
const { NotificationDAO, PermissionService, ValidationService } = require('@communities/backend')

const ControllerError = require('../errors/ControllerError')

module.exports = class NotificationController {

    constructor(core) {
        this.core = core

        this.notificationDAO = new NotificationDAO(core)

        this.permissionService = new PermissionService(core)
        this.validationService = new ValidationService(core)
    }

    /**
     * Get notifications for the current user.
     */
    async getNotifications(request, response) {
        const currentUser = request.session.user
        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                'Must be authenticated to retrieve notifications!',
                `Unauthenticated users may not query notifications.`)
        }

        const canQueryNotifications = await this.permissionService.can(currentUser, 'query', 'Notification')
        if ( canQueryNotifications !== true ) {
            throw new ControllerError(403, 'not-authorized',
                `Unauthorized User(${currentUser.id}) attempting to query notifications.`,
                `You are not authorized to query notifications.`)
        }

        // Users may only ever query their own notifications.
        const results = await this.notificationDAO.selectNotifications({
            where: 'notifications.user_id = $1',
            params: [ currentUser.id ]
        })

        results.meta = await this.notificationDAO.getNotificationPageMeta({
            where: 'notifications.user_id = $1',
            params: [ currentUser.id ]
        })

        results.relations = {}

        return response.status(200).json(results)
    }

    /**
     * Update a batch of notifications.
     */
    async patchNotifications(request, response) {
        const currentUser = request.session.user
        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                'Must be authenticated to retrieve notifications.',
                `You must be authenticated to retrieve notifications.`)
        }

        let notifications = []
        if ( ! Array.isArray(request.body) ) {
            notifications.push(request.body)
        } else {
            notifications = request.body
        }

        const notificationIds = notifications.map((n) => n.id)
        const existing = await this.notificationDAO.selectNotifications({
            where: `notifications.id = ANY($1::uuid[])`,
            params: [ notificationIds ]
        })

        for(const notification of notifications) {
            const canUpdateNotification = await this.permissionService.can(currentUser, 'update', 'Notification', { notification: existing.dictionary[notification.id] })
            if ( canUpdateNotification !== true ) {
                throw new ControllerError(403, 'not-authorized',
                    `User(${currentUser.id}) attempted to update notification without authorization.`,
                    `You are not authorized to update that notification.`)
            }

            const validationErrors = await this.validationService.validateNotification(currentUser, notification, existing.dictionary[notification.id])
            if ( validationErrors.length > 0 ) {
                const errorString = validationErrors.reduce((string, error) => `${string}\n${error.message}`, '')
                const logString = validationErrors.reduce((string, error) => `${string}\n${error.log}`, '')
                throw new ControllerError(400, 'invalid',
                    `User submitted an invalid notification: ${logString}`,
                    errorString)
            }
        }

        for(const notification of notifications) {
             await this.notificationDAO.updateNotification(notification)
        }

        const results = await this.notificationDAO.selectNotifications({
            where: 'notifications.id = ANY($1::uuid[])',
            params: [ notificationIds ]
        })

        if ( results.list.length !== notifications.length ) {
            throw new ControllerError(500, 'server-error',
                `Failed to retrieve all updated notifications.`)
        }

        results.meta = await this.notificationDAO.getNotificationPageMeta({
            where: 'notifications.id = ANY($1::uuid[])',
            params: [ notificationIds ]
        })

        results.relations = {}

        return response.status(200).json(results)
    }

    /**
     * Update a notification.
     */
    async patchNotification(request, response) {
        const currentUser = request.session.user
        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                'Must be authenticated to update notifications.',
                `You must be authenticated to update notifications.`)
        }

        const id = request.params.id
        const notification = request.body

        if ( notification.id !== id ) {
            throw new ControllerError(400, 'invalid',
                `Attempt to update Notification(${notification.id}) on route for Notification(${id}).`,
                `Notification.id must match the id in the route.`)
        }

        const existing = await this.notificationDAO.getNotificationById(id)
        if ( existing === null || existing === undefined ) {
            throw new ControllerError(404, 'not-found',
                `Attempt to update Notification(${id}) failed because notification was not found.`,
                `Either that notification doesn't exist or you don't have permissions to update it.`)
        }

        const canUpdateNotification = await this.permissionService.can(currentUser, 'update', 'Notification', { notification: existing })
        if ( canUpdateNotification !== true ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempted to update notification without authorization.`,
                `Either that notification doesn't exist or you don't have permission to update it.`)
        }

        const validationErrors = await this.validationService.validateNotification(currentUser, notification, existing)
        if ( validationErrors.length > 0 ) {
            const errorString = validationErrors.reduce((string, error) => `${string}\n${error.message}`, '')
            const logString = validationErrors.reduce((string, error) => `${string}\n${error.log}`, '')
            throw new ControllerError(400, 'invalid',
                `User submitted an invalid notification: ${logString}`,
                errorString)
        }

        await this.notificationDAO.updateNotification(notification)

        const results = await this.notificationDAO.selectNotifications({
            where: 'notifications.id = $1',
            params: [ id ]
        })

        const entity = results.dictionary[id]
        if ( ! entity ) {
            throw new ControllerError(500, 'server-error', `Notification(${id}) doesn't exist after update.`)
        }

        return response.status(200).json({
            entity: entity,
            relations: {}
        })
    }

}
