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

    PermissionService,
    ValidationService
} = require('@communities/backend')

const { cleaning, validation } = require('@communities/shared')

const ControllerError = require('../errors/ControllerError')

module.exports = class PostSubscriptionController {

    constructor(core) {
        this.core = core

        this.postDAO = new PostDAO(core)
        this.postSubscriptionDAO = new PostSubscriptionDAO(core)

        this.userRelationshipDAO = new UserRelationshipDAO(core)

        this.permissionService = new PermissionService(core)
        this.validationService = new ValidationService(core)
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

        const postId = cleaning.PostSubscription.cleanPostId(request.params.postId)
        const postIdValidationErrors = validation.PostSubscription.validatePostId(postId)
        if ( postIdValidationErrors.length > 0 ) {
            const errorString = validationErrors.reduce((string, error) => `${string}\n${error.message}`, '')
            const logString = validationErrors.reduce((string, error) => `${string}\n${error.log}`, '')
            throw new ControllerError(400, 'invalid',
                `Invalid postId used used for PostSubscription.postPostSubscriptions: ${logString}`,
                errorString)
        }

        const post = await this.postDAO.getPostById(postId)
        if ( post === null ) {
            throw new ControllerError(404, 'not-found',
                `User attempted to subscribe to a post that does not exist.`,
                `That post does not exist or you don't have access to view it.`)
        }

        const canViewPost = await this.permissionService.can(currentUser, 'view', 'Post', { post: post })
        if ( canViewPost !== true ) {
            throw new ControllerError(404, 'not-found',
                `User attempted to subscribe to a post that they don't have permission to view.`,
                `That post does not exist or you don't have access to view it.`)
        }

        const canCreatePostSubscription = await this.permissionService.can(currentUser, 'create', 'PostSubscription')
        if ( canCreatePostSubscription !== true ) {
            throw new ControllerError(403, 'not-authorized',
                `User attempted to create a PostSubscription without authorization.`,
                `You are not authorized to subscribe to that post.`)
        }

        const existing = await this.postSubscriptionDAO.getPostSubscriptionByPostAndUser(postId, currentUser.id)
        if ( existing !== null ) {
            throw new ControllerError(400, 'exists',
                `User(${currentUser.id}) attempted to subscribe from a post they are already subscribed to.`,
                `You are already subscribed to that post.`)

        }

        const subscription = {
            postId: postId,
            userId: currentUser.id
        }

        const validationErrors = await this.validationService.validatePostSubscription(currentUser, subscription)
        if ( validationErrors.length > 0 ) {
            const errorString = validationErrors.reduce((string, error) => `${string}\n${error.message}`, '')
            const logString = validationErrors.reduce((string, error) => `${string}\n${error.log}`, '')
            throw new ControllerError(400, 'invalid',
                `User submitted an invalid PostSubscription: ${logString}`,
                errorString)
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

        const postId = cleaning.PostSubscription.cleanPostId(request.params.postId)
        const postIdValidationErrors = validation.PostSubscription.validatePostId(postId)
        if ( postIdValidationErrors.length > 0 ) {
            const errorString = validationErrors.reduce((string, error) => `${string}\n${error.message}`, '')
            const logString = validationErrors.reduce((string, error) => `${string}\n${error.log}`, '')
            throw new ControllerError(400, 'invalid',
                `Invalid postId used used for PostSubscription.getPostSubscriptions: ${logString}`,
                errorString)
        }

        const canViewPost = await this.permissionService.can(currentUser, 'view', 'Post', { postId: postId })
        if ( canViewPost !== true ) {

            // If they've lost the ability to view the post, then unsubscribe them.
            await this.postSubscriptionDAO.deletePostSubscription({ userId: currentUser.id, postId: postId })

            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempted to retrieve a subscription that doesn't exist.`,
                `That post either doesn't exist or you don't have permission to view it.`)
        }

        const entityResults = await this.postSubscriptionDAO.selectPostSubscriptions({
            where: 'post_subscriptions.user_id = $1 AND post_subscriptions.post_id = $2',
            params: [ currentUser.id, postId ]
        })

        if ( entityResults.list.length <= 0 ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempted to retrieve a subscription that doesn't exist.`,
                `Either that PostSubscription doesn't exist or you don't have permission to view it.`)
        }

        const entity = entityResults.dictionary[entityResults.list[0]]

        const canViewPostSubscription = await this.permissionService.can(currentUser, 'view', 'PostSubscription', { postSubscription: entity })
        if ( canViewPostSubscription !== true ) {
            throw new ControllerError(404, 'not-found', 
                `User attempting to view PostSubscription without authorization.`,
                `Either that PostSubscription doesn't exist or you don't have permission to view it.`)
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

        const postId = cleaning.PostSubscription.cleanPostId(request.params.postId)
        const postIdValidationErrors = validation.PostSubscription.validatePostId(postId)
        if ( postIdValidationErrors.length > 0 ) {
            const errorString = validationErrors.reduce((string, error) => `${string}\n${error.message}`, '')
            const logString = validationErrors.reduce((string, error) => `${string}\n${error.log}`, '')
            throw new ControllerError(400, 'invalid',
                `Invalid postId used used for PostSubscription.deletePostSubscriptions: ${logString}`,
                errorString)
        }

        const post = await this.postDAO.getPostById(postId)
        if ( post === null ) { 
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempted to unsubscribe from a post that does not exist.`,
                `That post does not exist or you don't have access to view it.`)
        }

        const canViewPost = await this.permissionService.can(currentUser, 'view', 'Post', { post: post })
        if ( canViewPost !== true ) {

            // If they've lost the ability to view the post, then unsubscribe them.
            await this.postSubscriptionDAO.deletePostSubscription({ userId: currentUser.id, postId: postId })

            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempted to retrieve a subscription that doesn't exist.`,
                `That post either doesn't exist or you don't have permission to view it.`)
        }

        const existing = await this.postSubscriptionDAO.getPostSubscriptionByPostAndUser(postId, currentUser.id)
        if ( existing === null ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempted to unsubscribe from a post that doesn't exist.`,
                `That post does not exist or you don't have access to view it.`)
        }

        const canViewPostSubscription = await this.permissionService.can(currentUser, 'view', 'PostSubscription', { postSubscription: existing})
        if ( canViewPostSubscription !== true ) {
            throw new ControllerError(404, 'not-found', 
                `User attempting to view PostSubscription without authorization.`,
                `Either that PostSubscription doesn't exist or you don't have permission to view it.`)
        }

        const canDeletePostSubscription = await this.permissionService.can(currentUser, 'delete', 'PostSubscription', { postSubscription: existing})
        if ( canDeletePostSubscription !== true ) {
            throw new ControllerError(403, 'not-authorized',
                `User attempting to unsubscribe without authorization.`,
                `You are not authorized to unsubscribe from that post.`)
        }

        await this.postSubscriptionDAO.deletePostSubscription(existing)

        response.status(201).json({
            entity: existing,
            relations: {} 
        })
    }

}
