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

const Uuid = require('uuid')

const {
    PostDAO, 
    PostSubscriptionDAO, 
    UserRelationshipDAO,

    PermissionService
} = require('@communities/backend')
const ControllerError = require('../errors/ControllerError')

module.exports = class PostSubscriptionController {

    constructor(core) {
        this.core = core

        this.postDAO = new PostDAO(core)
        this.postSubscriptionDAO = new PostSubscriptionDAO(core)

        this.userRelationshipDAO = new UserRelationshipDAO(core)

        this.permissionService = new PermissionService(core)
    }

    async getRelations(results, requestedRelations) { 
        return {}
    }

    async createQuery(request) { }

    async getPostSubscriptions(request, response) { 
        throw new ControllerError(503, 'not-implemented',
            `User attempted to GET /post/:postId/subscriptions which isn't implemented.`,
            `GET /post/:postId/subscriptions is not implemented.`)
    }

    async postPostSubscriptions(request, response) {
        const currentUser = request.session.user
        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to subscribe to a post.`,
                `You must be authenticated to subscribe to a post.`)
        }

        const postId = request.params.postId
        const subscription = {
            postId: postId,
            userId: currentUser.id
        }

        const validationErrors = await this.validationService.validatePostReaction(currentUser, subscription)
        if ( validationErrors.length > 0 ) {
            const errorString = validationErrors.reduce((string, error) => `${string}\n${error.message}`, '')
            const logString = validationErrors.reduce((string, error) => `${string}\n${error.log}`, '')
            throw new ControllerError(400, 'invalid',
                `User submitted an invalid PostSubscription: ${logString}`,
                errorString)
        }

        const existing = await this.postSubscriptionDAO.getPostSubscriptionByPostAndUser(postId, currentUser.id)
        if ( existing !== null ) {
            throw new ControllerError(400, 'exists',
                `User(${currentUser.id}) attempted to subscribe from a post they are already subscribed to.`,
                `You are already subscribed to that post.`)

        }

        const post = await this.postDAO.getPostById(postId)
        if ( post === null ) {
            throw new ControllerError(404, 'not-found',
                `User attempted to subscribe to a post that does not exist.`,
                `That post does not exist or you don't have access to view it.`)
        }

        const canViewPost = await this.permissionService.can(currentUser, 'view', 'Post', { post: post })
        if ( ! canViewPost ) {
            throw new ControllerError(404, 'not-found',
                `User attempted to subscribe to a post that they don't have permission to view.`,
                `That post does not exist or you don't have access to view it.`)
        }

        await this.postSubscriptionDAO.insertPostSubscriptions(subscription)

        const entityResults = await this.postSubscriptionDAO.selectPostSubscriptions({
            where: 'post_subscriptions.user_id = $1 AND post_subscriptions.post_id = $2',
            params: [ currentUser.id, postId ]
        })

        if ( entityResults.list.length <= 0 ) {
            throw new ControllerError(500, 'server-error',
                `PostSubscription for User(${currentUser.id}) and Post(${postId}) not found after creation.`,
                `We couldn't find the subscription in the database after we created it.  This is a bug. Please report.`)
        }

        const entity = entityResults.dictionary[entityResults.list[0]]

        const relations = await this.getRelations(entityResults)

        response.status(201).json({
            entity: entity,
            relations: relations
        })
    }

    async getPostSubscription(request, response) { 

        const currentUser = request.session.user
        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to subscribe to a post.`,
                `You must be authenticated to subscribe to a post.`)
        }

        const postId = request.params.postId

        // We're just checking your own subscription, so we don't need to do
        // much permission checking.
        const entityResults = await this.postSubscriptionDAO.selectPostSubscriptions({
            where: 'post_subscriptions.user_id = $1 AND post_subscriptions.post_id = $2',
            params: [ currentUser.id, postId ]
        })

        if ( entityResults.list.length <= 0 ) {
            if ( ! canViewPost ) {
                throw new ControllerError(404, 'not-found',
                    `User(${currentUser.id}) attempted to retrieve a subscription that doesn't exist.`,
                    `That post either doesn't exist or you don't have permission to view it.`)

            } else {
                throw new ControllerError(404, 'not-found',
                    `User(${currentUser.id}) attempted to retrieve a subscription that doesn't exist.`,
                    `You are not subscribed to that post.`)
            }
        }

        const entity = entityResults.dictionary[entityResults.list[0]]

        // If they've lost the ability to view the post, then unsubscribe them.
        const canViewPost = await this.permissionService.can(currentUser, 'view', 'Post', { post: post })
        if ( ! canViewPost ) {
            await this.postSubscriptionDAO.deletePostSubscription(entity)

            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempted to retrieve a subscription that doesn't exist.`,
                `That post either doesn't exist or you don't have permission to view it.`)
        }

        const relations = await this.getRelations(entityResults)

        response.status(200).json({
            entity: entity,
            relations: relations
        })
    }

    async patchPostSubscription(request, response) {
        throw new ControllerError(503, 'not-implemented',
            `User attempted to PATCH a PostSubscription, which isn't implemented.`,
            `PATCH is not implemented for PostSubscription.  Subscriptions are created with POST and removed with DELETE.`)
    }

    async deletePostSubscription(request, response) {

        const currentUser = request.session.user
        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to unsubscribe from a post.`,
                `You must be authenticated to unsubscribe from a post.`)
        }

        const postId = request.params.postId

        const post = await this.postDAO.getPostById(postId)
        if ( post === null ) { 
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempted to unsubscribe from a post that does not exist.`,
                `That post does not exist or you don't have access to view it.`)
        }

        const existing = await this.postSubscriptionDAO.getPostSubscriptionByPostAndUser(postId, currentUser.id)
        if ( existing === null ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempted to unsubscribe from a post that doesn't exist.`,
                `That post does not exist or you don't have access to view it.`)

        }

        await this.postSubscriptionDAO.deletePostSubscription(existing)

        // If they've lost the ability to view the post, then unsubscribe them,
        // but don't let them know the post exists.
        const canViewPost = await this.permissionService.can(currentUser, 'view', 'Post', { post: post })
        if ( ! canViewPost ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempted to retrieve a subscription that doesn't exist.`,
                `That post either doesn't exist or you don't have permission to view it.`)
        }

        response.status(201).json({
            entity: existing,
            relations: {} 
        })
    }

}
