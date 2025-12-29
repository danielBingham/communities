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
const GroupModerationDAO = require('../../../daos/GroupModerationDAO')
const GroupSubscriptionDAO = require('../../../daos/GroupSubscriptionDAO')
const PostCommentDAO = require('../../../daos/PostCommentDAO')
const PostSubscriptionDAO = require('../../../daos/PostSubscriptionDAO')
const UserDAO = require('../../../daos/UserDAO')

const PermissionService = require('../../PermissionService')

module.exports = class PostNotifications {
    static notifications = [
        'Post:create:mention',
        'Post:create:type:group:subscriber'
    ]

    constructor(core, notificationWorker) {
        this.core = core
        this.notificationWorker = notificationWorker

        this.groupDAO = new GroupDAO(core)
        this.groupModerationDAO = new GroupModerationDAO(core)
        this.groupSubscriptionDAO = new GroupSubscriptionDAO(core)
        this.postCommentDAO = new PostCommentDAO(core)
        this.postSubscriptionDAO = new PostSubscriptionDAO(core)
        this.userDAO = new UserDAO(core)

        this.permissionService = new PermissionService(core)
    }

    async ensureContext(currentUser, type, context) {
        context.mentionedUsernames = lib.mentions.parseMentions(context.post.content)

        context.postIntro = context.post.content.substring(0,20)
        context.postAuthor = await this.userDAO.getUserById(context.post.userId, ['status']) 

        if ( context.post.groupId ) {
            context.group = await this.groupDAO.getGroupById(context.post.groupId)
            context.path = `group/${context.group.slug}/${context.post.id}`
            context.link = new URL(context.path, this.core.config.host).href
            context.moderation = await this.groupModerationDAO.

        } else {
            context.path = `${context.postAuthor.username}/${context.post.id}`
            context.link = new URL(context.path, this.core.config.host).href
        }

    }

    async create(currentUser, type, context, options) {
        await this.ensureContext(currentUser, type, context)

        // If this is a post in a group, then we need to respect their
        // group subscription.  If they've unsubscribed from the group,
        // then we shouldn't notify them.
        let subscriptionMap = {}
        let subscriptions = []
        if ( context.post.type === 'group' && context.post.groupId !== null && context.post.groupId !== undefined ) {
            subscriptions = await this.groupSubscriptionDAO.getSubscriptionsByGroup(context.post.groupId)
            for(const subscription of subscriptions) {
                subscriptionMap[subscription.userId] = subscription
            }
        }

        // Mentions
        if ( 'mentionedUsernames' in context && context.mentionedUsernames !== null 
            && context.mentionedUsernames !== undefined && context.mentionedUsernames.length > 0 
        ) {
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
                // If the user has lost the ability to view this post, then don't send them a notification.
                const canViewPost = await this.permissionService.can(userResults.dictionary[userId], 
                    'view', 'Post', { post: context.post })
                if ( canViewPost !== true ) {
                    continue
                }

                if ( context.post.groupId !== null && context.post.groupId !== undefined && userId in subscriptionMap ) {
                    const subscription = subscriptionMap[userId] 
                    if ( subscription.status === 'unsubscribed' ) {
                        continue
                    }
                }

                const mentionContext = { ...context, mentioned: userResults.dictionary[userId] }
                await this.notificationWorker.createNotification(userId, 
                    'Post:create:mention', mentionContext, options)
            }
        }

        // Group subscriptions

        if ( context.post.groupId !== undefined && context.post.groupId !== null ) {
            const userIds = subscriptions.map((subscription) => subscription.userId)
            const userResults = await this.userDAO.selectUsers({
                where: `users.id = ANY($1::uuid[])`,
                params: [ userIds ],
                fields: [ 'status' ]
            })

            for(const subscription of subscriptions) {

                // Don't notify authors of their own posts.
                if ( subscription.userId === context.post.userId ) {
                    continue
                }

                // If the user has lost the ability to view this post, then
                // don't send them a notification.
                const canViewPost = await this.permissionService.can(userResults.dictionary[subscription.userId], 
                    'view', 'Post', { post: context.post })
                if ( canViewPost !== true ) {
                    continue
                }

                // If they have unsubscribed, don't send them a notification.
                if ( subscription.status !== 'posts' ) {
                    continue
                }

                const subscriptionContext = { ...context, subscriber: userResults.dictionary[subscription.userId] }
                await this.notificationWorker.createNotification(subscription.userId, 
                    'Post:create:type:group:subscriber', subscriptionContext, options)

            }
        }
    }
}
