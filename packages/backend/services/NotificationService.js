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

const Handlebars = require('handlebars')

const NotificationDAO = require('../daos/NotificationDAO')

const EmailService = require('./EmailService')

const ServiceError = require('../errors/ServiceError')


module.exports = class NotificationService {


    constructor(core) {
        this.core = core

        this.notificationDAO = new NotificationDAO(core)
        this.paperEventDAO = new PaperEventDAO(core)
        this.paperDAO = new PaperDAO(core)

        this.emailService = new EmailService(core)
        this.submissionService = new SubmissionService(core)
        this.paperEventService = new PaperEventService(core)

        this.notificationDefinitions = { }

        this.notificationMap = { }
    }

    async sendNotifications(currentUser, type, context) {
        return await this.notificationMap[type](currentUser, context)
    }

    /**
     * Create a notification and send notification emails.  Different notifications
     * require different context.  See definitions above for the contexts requried
     * by each notification type.
     *
     * @param   {int}   userId  The `user.id` of the User we want to send the
     * notification to.
     * @param   {string}    type    The type of notification we want to send.
     * @see `notificationDefinitions`
     * @param   {Object}    context The contextual information necessary to
     * generate the notification content.  Differs per notification.type.  @see
     * `notificationDefinitions` for definition.
     * 
     */
    async createNotification(userId, type, context) {
        const definition = this.notificationDefinitions[type]
        if ( ! definition ) {
            throw new ServiceError('missing-definition',
                `Failed to find notification definitions for type '${type}'.`)
        }
        
        context.host = this.core.config.host

        const notification = {
            userId: userId,
            type: type,
            description: definition.text(context),
            path: definition.path(context) 
        }
        await this.notificationDAO.insertNotification(notification)

        
        const results = await this.core.database.query(`
            SELECT email FROM users WHERE id = $1
        `, [ userId ])

        const email = results.rows[0].email

        await this.emailService.sendNotificationEmail(
            email, 
            definition.email.subject(context), 
            definition.email.body(context)
        )
    }
}
