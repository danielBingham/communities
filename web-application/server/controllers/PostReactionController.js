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
    PostReactionDAO, 

    PermissionService,
    ValidationService
} = require('@communities/backend')
const ControllerError = require('../errors/ControllerError')

module.exports = class PostReactionController {

    constructor(core) {
        this.core = core

        this.postDAO = new PostDAO(core)
        this.postReactionDAO = new PostReactionDAO(core)

        this.permissionService = new PermissionService(core)
        this.validationService = new ValidationService(core)
    }

    async getRelations(results, requestedRelations) {
        // Need to send the posts up as a relation, because they will have been
        // updated.
        const postIds = []
        for(const reactionId of results.list) {
            const reaction = results.dictionary[reactionId]

            postIds.push(reaction.postId)
        }

        const postResults = await this.postDAO.selectPosts({
            where: `posts.id = ANY($1::uuid[])`,
            params: [ postIds ]
        })

        return {
            posts: postResults.dictionary
        }
    }

    async createQuery(request) { }

    async getPostReactions(request, response) {
        throw new ControllerError(503, 'not-implemented',
            `GET /post/:id/reactions is not implemented yet.`,
            `GET /post/:id/reactions is not implemented yet.`)
    }

    async postPostReactions(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to react to a post.`,
                `You must be authenticated to reaction to a post.`)
        }

        const postId = request.params.postId

        const post = await this.postDAO.getPostById(postId)
        if ( post === null ) {
            throw new ControllerError(404, 'not-found',
                `Post(${postId}) was not found by User(${currentUser.id}) attempting to react.`,
                `That post either doesn't exist or you don't have permission to see it.`)
        }

        const canViewPost = await this.permissionService.can(currentUser, 'view', 'Post', { post: post})
        if ( canViewPost !== true ) {
            throw new ControllerError(404, 'not-found',
                `User attempting to react to Post(${postId}) without authorization to view.`,
                `That post either doesn't exist or you don't have permission to see it.`)
        }

        const canCreatePostReaction = await this.permissionService.can(currentUser, 'create', 'PostReaction', { post: post })
        if ( canCreatePostReaction !== true ) {
            throw new ControllerError(403, 'not-authorized',
                `User attempting to react to Post(${postId}) without authorization.`,
                `You're not authorized to react to that post.`)
        }

        const existing = await this.core.database.query(`
            SELECT reaction FROM post_reactions WHERE post_reactions.post_id = $1 AND post_reactions.user_id = $2
        `, [ postId, currentUser.id])

        if ( existing.rows.length > 0 ) {
            throw new ControllerError(400, 'invalid',
                `User(${currentUser.id}) attempted to react to Post(${postId}) twice.`,
                `You can only react to a post once.`)
        }

        const reaction = {
            id: Uuid.v4(),
            postId: postId,
            userId: currentUser.id,
            reaction: request.body.reaction
        }

        const validationErrors = await this.validationService.validatePostReaction(currentUser, reaction)
        if ( validationErrors.length > 0 ) {
            const errorString = validationErrors.reduce((string, error) => `${string}\n${error.message}`, '')
            const logString = validationErrors.reduce((string, error) => `${string}\n${error.log}`, '')
            throw new ControllerError(400, 'invalid',
                `User submitted an invalid PostReaction: ${logString}`,
                errorString)
        }

        await this.postReactionDAO.insertPostReactions(reaction)

        let activity = parseInt(post.activity)
        if ( reaction.reaction == 'block' ) {
            activity -= 1
        } else {
            activity += 1
        }

        const postPatch = {
            id: postId,
            activity: activity
        }

        await this.postDAO.updatePost(postPatch)

        const postReactionResult = await this.postReactionDAO.selectPostReactions({
            where: `post_reactions.id = $1`,
            params: [ reaction.id ]
        })

        const entity = postReactionResult.dictionary[reaction.id]

        if ( ! entity ) {
            throw new ControllerError(500, 'server-error',
                `PostReaction(${reaction.id}) missing after update.`,
                `PostReaction missing after being updated.  Please report as a bug.`)
        }

        response.status(201).json({
            entity: entity,
            relations: await this.getRelations(postReactionResult)
        })
    }

    async getPostReaction(request, response) {
        throw new ControllerError(503, 'not-implemented',
            `GET /post/:id/reaction/:userId is not implemented yet.`,
            `GET /post/:id/reaction/:userId is not implemented yet.`)
    }

    async patchPostReaction(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to react to a post.`,
                `You must be authenticated to reaction to a post.`)
        }

        const postId = request.params.postId
        const post = await this.postDAO.getPostById(postId)
        if ( post === null ) {
            throw new ControllerError(404, 'not-found',
                `Post(${postId}) was not found by User(${currentUser.id}) attempting to react.`,
                `That post either doesn't exist or you don't have permission to see it.`)
        }

        const canViewPost = await this.permissionService.can(currentUser, 'view', 'Post', { post: post })
        if ( canViewPost !== true ) {
            throw new ControllerError(404, 'not-found',
                `User attempting to react to Post(${postId}) without authorization to view.`,
                `That post either doesn't exist or you don't have permission to see it.`)
        }

        const existing = await this.postReactionDAO.getPostReactionByPostAndUser(postId, currentUser.id) 
        if ( existing === null ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempted to patch reaction to Post(${postId}) but not existed.`,
                `You can't patch a reaction that doesn't exist.  Try POST to create a reaction.`)
        }

        const canUpdatePostReaction = await this.permissionService.can(currentUser, 'update', 'PostReaction', { postReaction: existing })
        if ( canUpdatePostReaction !== true ) {
            throw new ControllerError(403, 'not-authorized',
                `User attempting to update a PostReaction without authorization.`,
                `You are not authorized to update that PostReaction.`)
        }

        const reaction = {
            id: existing.id,
            postId: postId,
            userId: currentUser.id,
            reaction: request.body.reaction
        }

        const validationErrors = await this.validationService.validatePostReaction(currentUser, reaction, existing)
        if ( validationErrors.length > 0 ) {
            const errorString = validationErrors.reduce((string, error) => `${string}\n${error.message}`, '')
            const logString = validationErrors.reduce((string, error) => `${string}\n${error.log}`, '')
            throw new ControllerError(400, 'invalid',
                `User submitted an invalid PostReaction: ${logString}`,
                errorString)
        }

        await this.postReactionDAO.updatePostReaction(reaction)

        let activity = parseInt(post.activity)
        let existingReaction = existing.reaction
        if ( existingReaction != 'block' && reaction.reaction == 'block' ) {
            activity -= 2
        } else if ( existingReaction == 'block' && reaction.reaction != 'block') {
            activity += 2
        }

        const postPatch = {
            id: postId,
            activity: activity
        }

        await this.postDAO.updatePost(postPatch)

        const postReactionResult = await this.postReactionDAO.selectPostReactions({
            where: `post_reactions.post_id= $1 AND post_reactions.user_id = $2`,
            params: [ postId, currentUser.id ]
        })

        const entity = postReactionResult.dictionary[postReactionResult.list[0]]
        if ( ! entity ) {
            throw new ControllerError(500, 'server-error',
                `PostReaction(${postId},${currentUser.id}) missing after update.`,
                `PostReaction missing after being updated.  Please report as a bug.`)
        }

        response.status(201).json({
            entity: entity,
            relations: await this.getRelations(postReactionResult)
        })
    }

    async deletePostReaction(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to react to a post.`,
                `You must be authenticated to reaction to a post.`)
        }

        const postId = request.params.postId
        const post = await this.postDAO.getPostById(postId)
        if ( post === null ) {
            throw new ControllerError(404, 'not-found',
                `Post(${postId}) was not found by User(${currentUser.id}) attempting to react.`,
                `That post either doesn't exist or you don't have permission to see it.`)
        }

        const canViewPost = await this.permissionService.can(currentUser, 'view', 'Post', { post: post })
        if ( ! canViewPost ) {
            throw new ControllerError(404, 'not-found',
                `Post(${postId}) was not found by User(${currentUser.id}) attempting to react.`,
                `That post either doesn't exist or you don't have permission to see it.`)
        }

        const existing = await this.postReactionDAO.getPostReactionByPostAndUser(postId, currentUser.id)
        if ( existing === null) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempted to delete reaction to Post(${postId}) but no reaction found.`,
                `You can't delete a reaction that doesn't exist.`)
        }

        const canDeletePostReaction = await this.permissionService.can(currentUser, 'delete', 'PostReaction', { postReaction: existing})
        if ( canDeletePostReaction !== true ) {
            throw new ControllerError(403, 'not-authorized',
                `User attempting to delete PostReaction(${existing.id}) on Post(${postId}) without authorization.`,
                `You are not authorized to delete that PostReaction.`)
        }

        const reaction = {
            postId: postId,
            userId: currentUser.id,
        }

        await this.postReactionDAO.deletePostReaction(reaction)

        let activity = parseInt(post.activity)
        let existingReaction = existing.reaction

        if ( existingReaction == 'block')  {
            activity += 1
        } else {
            activity -= 1
        }

        const postPatch = {
            id: postId,
            activity: activity
        }

        await this.postDAO.updatePost(postPatch)

        const postResult = await this.postDAO.selectPosts({
            where: `posts.id = $1`,
            params: [ postId ]
        })

        const entity = postResult.dictionary[postId]

        if ( ! entity ) {
            throw new ControllerError(500, 'server-error',
                `Post(${postId}) missing after update.`,
                `Post missing after being updated.  Please report as a bug.`)
        }

        response.status(201).json({
            relations: {
                posts: postResult.dictionary
            } 
        })
    }

}
