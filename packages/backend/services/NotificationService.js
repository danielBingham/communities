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
const fs = require('fs')

const Handlebars = require('handlebars')

const { lib } = require('@communities/shared')

const GroupDAO = require('../daos/GroupDAO')
const GroupMemberDAO = require('../daos/GroupMemberDAO')
const NotificationDAO = require('../daos/NotificationDAO')
const PostDAO = require('../daos/PostDAO')
const PostCommentDAO = require('../daos/PostCommentDAO')
const PostSubscriptionDAO = require('../daos/PostSubscriptionDAO')
const UserDAO = require('../daos/UserDAO')
const UserRelationshipDAO = require('../daos/UserRelationshipDAO')

const EmailService = require('./EmailService')
const PermissionService = require('./PermissionService')

const ServiceError = require('../errors/ServiceError')

const GroupMemberNotifications = require('./notification/GroupMemberNotifications')
const GroupModerationNotifications = require('./notification/GroupModerationNotifications')
const PostNotifications = require('./notification/PostNotifications')
const PostCommentNotifications = require('./notification/PostCommentNotifications')
const SiteModerationNotifications = require('./notification/SiteModerationNotifications')
const UserRelationshipNotifications = require('./notification/UserRelationshipNotifications')

const IOSNotifications = require('./notification/IOSNotifications')

// ================== Load Notification Definitions =================================
const notifications = [
    ...GroupMemberNotifications.notifications,
    ...GroupModerationNotifications.notifications,
    ...PostNotifications.notifications,
    ...PostCommentNotifications.notifications,
    ...SiteModerationNotifications.notifications,
    ...UserRelationshipNotifications.notifications
]

const definitions = {}
for(const notification of notifications) {
    const definitionPath = './' + path.join(`notification/definitions`, notification.replaceAll(':', '/'))
    definitions[notification] = require(definitionPath)
}

module.exports = class NotificationService {

    constructor(core) {
        this.core = core

        this.groupDAO = new GroupDAO(core)
        this.groupMemberDAO = new GroupMemberDAO(core)
        this.notificationDAO = new NotificationDAO(core)
        this.postDAO = new PostDAO(core)
        this.postCommentDAO = new PostCommentDAO(core)
        this.postSubscriptionDAO = new PostSubscriptionDAO(core)
        this.userDAO = new UserDAO(core)
        this.userRelationshipDAO = new UserRelationshipDAO(core)

        this.emailService = new EmailService(core)
        this.permissionService = new PermissionService(core)

        this.groupMemberNotifications = new GroupMemberNotifications(core, this)
        this.groupModerationNotifications = new GroupModerationNotifications(core, this)
        this.postNotifications = new PostNotifications(core, this)
        this.postCommentNotifications = new PostCommentNotifications(core, this)
        this.siteModerationNotifications = new SiteModerationNotifications(core, this)
        this.userRelationshipNotifications = new UserRelationshipNotifications(core, this)

        this.iosNotifications = new IOSNotifications(core)

        const layoutTemplate = fs.readFileSync(path.resolve(__dirname, './notification/definitions/layout.hbs'), 'utf8')
        Handlebars.registerPartial('layout', layoutTemplate)

        this.notificationMigrationMap = {
            'GroupMember:create:status:pending-invited:member': 'Group:member:create:invited',
            'GroupMember:create:status:pending-requested:moderator': 'Group:member:create:requested',
            'GroupMember:update:status:pending-requested-member:member': 'Group:member:update:request:accepted',
            'GroupMember:update:role:moderator:member': 'Group:member:update:promoted:moderator',
            'GroupMember:update:role:admin:member': 'Group:member:update:promoted:admin',

            'GroupModeration:update:post:status:rejected:author': 'Group:post:moderation:rejected',
            'GroupModeration:update:comment:status:rejected:author': 'Group:post:comment:moderation:rejected',

            'Post:create:mention': 'Post:mention',

            'PostComment:create:author': 'Post:comment:create',
            'PostComment:create:subscriber': 'Post:comment:create:subscriber',
            'PostComment:create:mention': 'Post:comment:create:mention',

            'SiteModeration:update:post:status:rejected:author': 'Post:moderation:rejected',
            'SiteModeration:update:comment:status:rejected:author': 'Post:comment:moderation:rejected',

            'UserRelationship:create:relation': 'User:friend:create',
            'UserRelationship:update:user': 'User:friend:update',
        }
    }

    async sendNotifications(currentUser, type, context, options) {
        const segments = type.split(':')

        const entity = segments[0]
        const action = segments[1]

        if ( entity === 'Post' ) {
            if ( action === 'create' ) {
                return await this.postNotifications.create(currentUser, type, context, options)
            }
        } else if ( entity === 'PostComment' ) {
            if ( action === 'create' ) {
                return await this.postCommentNotifications.create(currentUser, type, context, options)
            }
        } else if ( entity === 'SiteModeration' ) {
            if ( action === 'update' ) {
                return await this.siteModerationNotifications.update(currentUser, type, context, options)
            }
        } else if ( entity === 'UserRelationship' ) {
            if ( action === 'create' ) {
                return await this.userRelationshipNotifications.create(currentUser, type, context, options)
            } else if ( action === 'update' ) {
                return await this.userRelationshipNotifications.update(currentUser, type, context, options)
            }
        } else if ( entity === 'GroupMember' ) {
            if ( action === 'create' ) {
                return await this.groupMemberNotifications.create(currentUser, type, context, options)
            } else if ( action === 'update' ) {
                return await this.groupMemberNotifications.update(currentUser, type, context, options)
            }
        } else if ( entity === 'GroupModeration' ) {
            if ( action === 'update' ) {
                return await this.groupModerationNotifications.update(currentUser, type, context, options)
            }
        }

        throw new ServiceError('missing-notification',
            `No notification defined for ${type}.`)
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
    async createNotification(userId, type, context, options) {
        if ( ! ( type in definitions ) ) {
            throw new ServiceError('missing-definition',
                `Notification type '${type}' is missing definition.`)
        }

        const definition = definitions[type]

        context.host = this.core.config.host

        const results = await this.core.database.query(`
            SELECT email, settings, status FROM users WHERE id = $1
        `, [ userId ])

        const settings = results.rows[0].settings
       
        // Use the default values if `type` isn't in their settings.
        let notificationSetting = {
            web: true, /* This is the root notification.  If this is off, no notifications are sent. */
            email: true, /* Send an email notification. */
            desktop: true, /* Send a desktop push notification. */
            mobile: true /* Send a mobile push notification. */
        }

        if ( 'notifications' in settings && settings.notifications !== undefined ) {
            if ( type in settings.notifications ) {
                notificationSetting = settings.notifications[type]
            } else {
                // Fall back to pre-migration setting.
                const migratedType = this.notificationMigrationMap[type]
                if ( migratedType in settings.notifications ) {
                    notificationSetting = settings.notifications[migratedType]
                }
            } 
        }

        // Only create the web notification if the user has web notifications
        // turned on for that notification.
        const notification = {
            userId: userId,
            type: type,
            description: definition.web.text(context),
            path: definition.web.path(context) ,
            isRead: notificationSetting.web === false || options?.noWeb === true 
        }
        notification.id = await this.notificationDAO.insertNotification(notification)

        if ( notificationSetting.web && options?.noWeb !== true) {
            const results = await this.notificationDAO.selectNotifications(`WHERE notifications.id = $1`, [ notification.id ]) 
            await this.core.events.trigger(userId, 'Notification', 'create', { dictionary: results.dictionary })
        }

        // Only send the email if the user has emails turned on for that
        // notification.  Also, don't send notification emails to users that
        // have been invited but haven't accepted the invitation yet.
        if ( notificationSetting.email && options?.noEmail !== true && results.rows[0].status !== 'invited') {
            const email = results.rows[0].email

            await this.emailService.sendNotificationEmail(
                email, 
                definition.email.subject(context), 
                definition.email.body(context)
            )
        }

        if ( notificationSetting.mobile && options?.noMobile !== true && results.rows[0].status !== 'invited' ) {
            await this.iosNotifications.sendIOSNotification(userId, notification)
        }
    }

}
