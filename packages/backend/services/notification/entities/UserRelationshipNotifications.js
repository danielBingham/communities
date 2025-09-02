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

const { lib } = require('@communities/shared')

const GroupDAO = require('../../../daos/GroupDAO')
const PostCommentDAO = require('../../../daos/PostCommentDAO')
const PostSubscriptionDAO = require('../../../daos/PostSubscriptionDAO')
const UserDAO = require('../../../daos/UserDAO')

const PermissionService = require('../../PermissionService')

module.exports = class UserRelationshipNotifications {
    static notifications = [
        'UserRelationship:create:relation',
        'UserRelationship:update:user'
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

    async ensureContext(currentUser, type, context, options) {
        const userResults = await this.userDAO.selectUsers({
            where: `users.id = ANY($1::uuid[])`,
            params: [  [ context.userId, context.relationId ] ]
        })

        context.friend = userResults.dictionary[context.relationId]
        context.requester = userResults.dictionary[context.userId]
    }

    async create(currentUser, type, context, options) {
        await this.ensureContext(currentUser, type, context, options)

        context.link = new URL(`/friends/requests`, this.core.config.host).href

        await this.notificationService.createNotification(context.relationId, 'UserRelationship:create:relation', context, options)
    }

    async update(currentUser, type, context, options) {
        await this.ensureContext(currentUser, type, context, options)

        context.link = new URL(`/${context.friend.username}`, this.core.config.host).href

        await this.notificationService.createNotification(context.userId, 'UserRelationship:update:user', context, options)
    }

}
