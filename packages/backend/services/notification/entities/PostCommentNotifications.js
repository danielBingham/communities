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

const { lib } = require('@communities/shared')

const GroupDAO = require('../../../daos/GroupDAO')
const PostCommentDAO = require('../../../daos/PostCommentDAO')
const PostSubscriptionDAO = require('../../../daos/PostSubscriptionDAO')
const UserDAO = require('../../../daos/UserDAO')

const PermissionService = require('../../PermissionService')

module.exports = class PostCommentNotifications {
        static notifications = [
            'PostComment:create:author',
            'PostComment:create:mention',
            'PostComment:create:subscriber'
        ]

    constructor(core, notificationWorker) {
        this.core = core
        this.notificationWorker = notificationWorker

        this.groupDAO = new GroupDAO(core)
        this.postCommentDAO = new PostCommentDAO(core)
        this.postSubscriptionDAO = new PostSubscriptionDAO(core)
        this.userDAO = new UserDAO(core)

        this.permissionService = new PermissionService(core)
    }

    async ensureContext(currentUser, type, context) {
        if ( context.post.content.length > 20 ) {
            context.postIntro = context.post.content.substring(0,20) + '...'
        } else {
            context.postIntro = context.post.content
        }

        if ( context.comment.content.length > 20 ) {
            context.commentIntro = context.comment.content.substring(0,20) + '...'
        } else {
            context.commentIntro = context.comment.content
        }

        context.postAuthor = await this.userDAO.getUserById(context.post.userId, ['status']) 

        if ( context.post.groupId ) {
            const group = await this.groupDAO.getGroupById(context.post.groupId)
            context.path = `/group/${group.slug}/${context.post.id}#comment-${context.comment.id}`
            context.link = new URL(context.path, this.core.config.host).href
        } else {
            context.path = `/${context.postAuthor.username}/${context.post.id}#comment-${context.comment.id}`
            context.link = new URL(context.path, this.core.config.host).href
        }

        context.mentionedUsernames = lib.mentions.parseMentions(context.comment.content)
    }

    async create(currentUser, type, context, options) {
        await this.ensureContext(currentUser, type, context)

        if ( type === 'PostComment:create' || type === 'PostComment:create:author' ) {
            await this.createAuthor(currentUser, type, context, options)
        }

        if ( type === 'PostComment:create' || type === 'PostComment:create:author' || type === 'PostComment:create:subscriber' ) {
            await this.createSubscriber(currentUser, type, context, options)
        }

        if ( type === 'PostComment:create' || type === 'PostComment:create:mention' ) {
            await this.createMention(currentUser, type, context, options)
        }
    }

    async createAuthor(currentUser, type, context, options) {
        // They'll be notified of the mention and we don't want to send duplicate notifications.
        if ( type === 'PostComment:create' && context.mentionedUsernames.includes(context.postAuthor.username) ) {
           return 
        }

        const subscription = await this.postSubscriptionDAO.getPostSubscriptionByPostAndUser(context.post.id, context.postAuthor.id)

        if ( subscription !== null ) {

            // Don't notify the comment author of their own comment.
            if ( subscription.userId == context.commentAuthor.id ) {
               return 
            }

            // If the user has lost the ability to view this post, then don't send them a notification.
            //
            // For post authors, this might be because the post is in a private
            // or hidden group that they've left (or been banned from).
            const canViewPost = await this.permissionService.can(context.postAuthor, 'view', 'Post', { post: context.post })
            if ( canViewPost !== true ) {
                return 
            }

            await this.notificationWorker.createNotification(context.postAuthor.id, 'PostComment:create:author', context, options) 
        }
    }

    async createSubscriber(currentUser, type, context, options) {
        const subscriptions = await this.postSubscriptionDAO.getSubscriptionsByPost(context.post.id)
        if ( subscriptions !== null ) {
            const subscriberIds = subscriptions.map((s) => s.userId)
            
            // User.status is needed by PermissionService
            const subscribers = await this.userDAO.selectUsers({ where: `users.id = ANY($1::uuid[])`, params: [ subscriberIds], fields: ['status']})

            for(const subscription of subscriptions) {
                // Don't notify the comment author of their own comment.
                if ( subscription.userId == context.commentAuthor.id ) {
                    continue
                }

                // Don't notify the Post's author, they'll be notified in PostComment:create:author
                if ( type === 'PostComment:create' && subscription.userId === context.postAuthor.id ) {
                    continue
                }

                // They'll be notified of the mention and we don't want to send duplicate notifications.
                if ( type === 'PostComment:create' && context.mentionedUsernames.includes(subscribers.dictionary[subscription.userId].username) ) {
                    continue
                }

                // If the user has lost the ability to view this post, then don't send them a notification.
                const canViewPost = await this.permissionService.can(subscribers.dictionary[subscription.userId], 'view', 'Post', { post: context.post })
                if ( canViewPost !== true ) {
                    continue
                }

                const subscriberContext = { ...context, subscriber: subscribers.dictionary[subscription.userId] }
                await this.notificationWorker.createNotification(subscription.userId, 'PostComment:create:subscriber', subscriberContext, options)
            }
        }
    }

    async createMention(currentUser, type, context, options) {
        // No mentions to notify
        if ( context.mentionedUsernames.length <= 0 ) {
            return
        }

        // User.status is needed by PermissionService
        const userResults = await this.userDAO.selectUsers({
            where: `users.username = ANY($1::text[])`,
            params: [ context.mentionedUsernames ],
            fields: ['status']
        })

        // None of the mentions referred to real users.
        if ( userResults.list.length <= 0 ) {
            return
        }

        for(const userId of userResults.list ) {
            // Don't notify the comment author of their own comment.
            if ( userId == context.commentAuthor.id ) {
                continue
            }

            // If the user has lost the ability to view this post, then don't send them a notification.
            const canViewPost = await this.permissionService.can(userResults.dictionary[userId], 'view', 'Post', { post: context.post })
            if ( canViewPost !== true ) {
                continue
            }

            const mentionContext = { ...context, mentioned: userResults.dictionary[userId] }
            await this.notificationWorker.createNotification(userId, 'PostComment:create:mention', mentionContext, options)
        }

    }
}
