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
const UserDAO = require('../daos/UserDAO')
const PostSubscriptionDAO = require('../daos/PostSubscriptionDAO')

const EmailService = require('./EmailService')

const ServiceError = require('../errors/ServiceError')

module.exports = class NotificationService {


    constructor(core) {
        this.core = core

        this.notificationDAO = new NotificationDAO(core)
        this.userDAO = new UserDAO(core)
        this.postSubscriptionDAO = new PostSubscriptionDAO(core)

        this.emailService = new EmailService(core)

        this.notificationDefinitions = { 
            'Post:comment:create': {
                email: {
                    subject: Handlebars.compile('[Communities] {{{commentAuthor.name}}} commented on your post "{{{postIntro}}}..."'), 
                    body: Handlebars.compile(`
Hi {{{postAuthor.name}}},

{{{commentAuthor.name}}} left a new comment on your post "{{{postIntro}}}...":

{{{comment.content}}}

Read the comment in context here: {{{host}}}{{{postAuthor.username}}}/{{{post.id}}}#comment-{{{comment.id}}}.

Cheers,
The Communities Team
                        `)
                },
                text: Handlebars.compile(`{{{commentAuthor.name}}} commented, "{{{commentIntro}}}...", on your post, "{{{postIntro}}}...".`),
                path: Handlebars.compile(`/{{{postAuthor.username}}}/{{{post.id}}}#comment-{{{comment.id}}}`) 
            },
            'Post:comment:create:subscriber': {
                email: {
                    subject: Handlebars.compile('[Communities] {{{commentAuthor.name}}} commented, "{{{commentIntro}}}", on a post, "{{{postIntro}}}...", you subscribe to, '), 
                    body: Handlebars.compile(`
Hi {{{subscriber.name}}},

{{{commentAuthor.name}}} left a new comment on a post by {{{postAuthor.name}}}, "{{{postIntro}}}...", you subscribe to:

"{{{comment.content}}}"

Read the comment in context here: {{{host}}}{{{postAuthor.username}}}/{{{post.id}}}#comment-{{{comment.id}}}.

Cheers,
The Communities Team
                        `)
                },
                text: Handlebars.compile(`{{{commentAuthor.name}}} commented, "{{{commentIntro}}}...", on a post, "{{{postIntro}}}...", you subscribe to.`),
                path: Handlebars.compile(`/{{{postAuthor.username}}}/{{{post.id}}}#comment-{{{comment.id}}}`) 
            },
            'User:friend:create': {
                email: {
                    subject: Handlebars.compile('[Communities] {{{requester.name}}} sent you a Friend Request'),
                    body: Handlebars.compile(`
Hi {{{friend.name}}},

You have a new friend request on Communities from {{{requester.name}}}.

To accept, log in to your account and view your friend requests: {{{host}}}friends/requests

Cheers,
The Communities Team`)
                },
                text: Handlebars.compile(`{{{requester.name}}} sent you a friend request.`),
                path: Handlebars.compile(`/friends/requests`)
            },
            'User:friend:update': {
                email: {
                    subject: Handlebars.compile('[Communities] {{{friend.name}}} accepted your Friend Request'),
                    body: Handlebars.compile(`
Hi {{{requester.name}}},

{{{friend.name}}} accepted your friend request.

You can now view their profile here: {{{host}}}{{{friend.username}}}

Cheers,
The Communities Team`)
                },
                text: Handlebars.compile(`{{{friend.name}}} accepted your friend request.`),
                path: Handlebars.compile(`/{{{friend.username}}}`)
            }
        }

        this.notificationMap = { 
            'Post:comment:create': this.sendNewCommentNotification.bind(this),
            'User:friend:create': this.sendFriendRequestNotification.bind(this),
            'User:friend:update': this.friendRequestAcceptedNotification.bind(this)
        }
    }

    async sendNotifications(currentUser, type, context) {
        return await this.notificationMap[type](currentUser, context)
    }

    async getNotificationSettings(userId, type) {

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

        const results = await this.core.database.query(`
            SELECT email, settings FROM users WHERE id = $1
        `, [ userId ])

        const settings = results.rows[0].settings

        // Only create the web notification if the user has web notifications
        // turned on for that notification.
        if ( settings.notifications[type].web ) {
            const notification = {
                userId: userId,
                type: type,
                description: definition.text(context),
                path: definition.path(context) 
            }
            await this.notificationDAO.insertNotification(notification)
        }

        // Only send the email if the user has emails turned on for that
        // notification.
        if ( settings.notifications[type].email ) {
            const email = results.rows[0].email

            await this.emailService.sendNotificationEmail(
                email, 
                definition.email.subject(context), 
                definition.email.body(context)
            )
        }
    }

    async sendNewCommentNotification(currentUser, context) {
        context.postIntro = context.post.content.substring(0,20)
        context.commentIntro = context.comment.content.substring(0,20)

        const postAuthor = await this.userDAO.getUserById(context.post.userId) 
        context.postAuthor = postAuthor

        if ( context.commentAuthor.id != context.post.userId ) {
            await this.createNotification(postAuthor.id, 'Post:comment:create', context) 
        }

        const subscriptions = await this.postSubscriptionDAO.getSubscriptionsByPost(context.post.id)
        if ( subscriptions !== null ) {
            const subscriberIds = subscriptions.map((s) => s.userId)
            const subscribers = await this.userDAO.selectUsers(`WHERE users.id = ANY($1::uuid[])`, [ subscriberIds])

            for(const subscription of subscriptions) {
                if ( subscription.userId == context.commentAuthor.id ) {
                    continue
                }

                const subscriberContext = { ...context, subscriber: subscribers.dictionary[subscription.userId] }
                await this.createNotification(subscription.userId, 'Post:comment:create:subscriber', subscriberContext)
            }
        }
    }

    async sendFriendRequestNotification(currentUser, context) {
        const userResults = await this.userDAO.selectUsers(
            `WHERE users.id = ANY($1::uuid[])`,
            [  [ context.userId, context.relationId ] ]
        )

        context.friend = userResults.dictionary[context.relationId]
        context.requester = userResults.dictionary[context.userId]

        await this.createNotification(context.relationId, 'User:friend:create', context)
    }

    async friendRequestAcceptedNotification(currentUser, context) {
        const userResults = await this.userDAO.selectUsers(
            `WHERE users.id = ANY($1::uuid[])`,
            [  [ context.userId, context.relationId ] ]
        )

        context.friend = userResults.dictionary[context.relationId]
        context.requester = userResults.dictionary[context.userId]

        await this.createNotification(context.userId, 'User:friend:update', context)
    }
}
