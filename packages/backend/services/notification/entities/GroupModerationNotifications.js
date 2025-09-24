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
const PostDAO = require('../../../daos/PostDAO')
const PostCommentDAO = require('../../../daos/PostCommentDAO')
const PostSubscriptionDAO = require('../../../daos/PostSubscriptionDAO')
const UserDAO = require('../../../daos/UserDAO')

const PermissionService = require('../../PermissionService')

module.exports = class GroupModerationNotifications {
    
    static notifications = [
        'GroupModeration:update:post:status:rejected:author',
        'GroupModeration:update:comment:status:rejected:author'
    ]

    constructor(core, notificationWorker) {
        this.core = core
        this.notificationWorker = notificationWorker

        this.groupDAO = new GroupDAO(core)
        this.postDAO = new PostDAO(core)
        this.postCommentDAO = new PostCommentDAO(core)
        this.postSubscriptionDAO = new PostSubscriptionDAO(core)
        this.userDAO = new UserDAO(core)

        this.permissionService = new PermissionService(core)
    }

    async ensureContext(currentUser, type, context) {
        if( ! ('postId' in context.moderation) || context.moderation.postId === undefined || context.moderation.postId === null ) {
            throw new ServiceError('missing-context',
                `Moderation notification missing postId.`)
        }

        context.post = await this.postDAO.getPostById(context.moderation.postId)
        context.postIntro = context.post.content.substring(0,20)

        context.postAuthor = await this.userDAO.getUserById(context.post.userId, ['status']) 

        context.group = null 
        if ( context.post.groupId ) {
            context.group = await this.groupDAO.getGroupById(context.post.groupId)
            context.path = `/group/${context.group.slug}/${context.post.id}`
            context.link = new URL(context.path, this.core.config.host).href
        } else {
            context.path = `/${context.postAuthor.username}/${context.post.id}`
            context.link = new URL(context.path, this.core.config.host).href
        }

        if ( type === 'GroupModeration:update:comment:status:rejected:author' ) {
            if ( ! ('postCommentId' in context.moderation) 
                || context.moderation.postCommentId === undefined 
                || context.moderation.postCommentId === null 
            ) {
                throw new ServiceError('missing-context',
                    `Moderation notification missing postCommentId.`)
            }

            context.comment = await this.postCommentDAO.getPostCommentById(context.moderation.postCommentId)
            context.commentIntro = context.comment.content.substring(0,20)

            context.commentAuthor = await this.userDAO.getUserById(context.comment.userId, ['status']) 
        }
    }

    async update(currentUser, type, context, options) {
        await this.ensureContext(currentUser, type, context)

        if ( type === 'GroupModeration:update:post:status:rejected:author' ) {
            // Don't send notifications to users who have lost the right to view
            // their post.
            const canViewPost = await this.permissionService.can(context.postAuthor, 'view', 'Post', { post: context.post, group: context.group })
            if ( canViewPost !== true ) {
                return
            }

            await this.notificationWorker.createNotification(context.postAuthor.id, 'GroupModeration:update:post:status:rejected:author', context, options) 
        } else if ( type === 'GroupModeration:update:comment:status:rejected:author' ) {
            // Don't send notifications to users who have lost the right to view
            // their post.
            const canViewPost = await this.permissionService.can(context.commentAuthor, 'view', 'Post', { post: context.post, group: context.group })
            if ( canViewPost !== true ) {
                return
            }

            await this.notificationWorker.createNotification(context.comment.userId, 'GroupModeration:update:comment:status:rejected:author', context, options) 
        }
    }
}
