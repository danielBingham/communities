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

const GroupDAO = require('../../daos/GroupDAO')
const PostCommentDAO = require('../../daos/PostCommentDAO')
const PostSubscriptionDAO = require('../../daos/PostSubscriptionDAO')
const UserDAO = require('../../daos/UserDAO')

const PermissionService = require('../PermissionService')

module.exports = class PostNotifications {
    static notifications = [
        'Post:create:mention'
    ]

    constructor(core, notificationService) {
        this.core = core
        this.notificationService = notificationService

        this.groupDAO = new GroupDAO(core)
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
            const group = await this.groupDAO.getGroupById(context.post.groupId)
            context.link = `group/${group.slug}/${context.post.id}`
        } else {
            context.link = `${context.postAuthor.username}/${context.post.id}`
        }

    }

    async create(currentUser, type, context, options) {
        await this.ensureContext(currentUser, type, context)

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

            const mentionContext = { ...context, mentioned: userResults.dictionary[userId] }
            await this.notificationService.createNotification(userId, 
                'Post:create:mention', mentionContext, options)
        }
    }
}
