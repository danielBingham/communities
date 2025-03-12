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

const { NotificationService, PermissionService, PostDAO, UserRelationshipDAO, PostCommentDAO, PostSubscriptionDAO } = require('@communities/backend')

const ControllerError = require('../errors/ControllerError')

module.exports = class PostCommentController {

    constructor(core) {
        this.core = core

        this.postDAO = new PostDAO(core)
        this.postCommentDAO = new PostCommentDAO(core)
        this.userRelationshipDAO = new UserRelationshipDAO(core)
        this.postSubscriptionDAO = new PostSubscriptionDAO(core)

        this.notificationService = new NotificationService(core)
        this.permissionService = new PermissionService(core)
    }

    async getRelations(currentUser, results, requestedRelations) {
        const postIds = []
        for(const commentId of results.list) {
            postIds.push(results.dictionary[commentId].postId)
        }

        const postResults = await this.postDAO.selectPosts({
            where: 'posts.id = ANY($1::uuid[])',
            params: [ postIds ]
        })

        const postSubscriptionResults = await this.postSubscriptionDAO.selectPostSubscriptions({
            where: 'post_subscriptions.user_id = $1 AND post_subscriptions.post_id = ANY($2::uuid[])',
            params: [ currentUser.id, postIds ]
        })

        return {
            posts: postResults.dictionary,
            postSubscriptions: postSubscriptionResults.dictionary
        }
    }

    async getPostComments(request, response) {
        const currentUser = request.session.user
        const postId = request.params.postId

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to get comments.`,
                `You must be authenticated to get comments.`)
        }

        const post = await this.postDAO.getPostById(postId)

        if ( ! post ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempted to post a comment on Post(${postId}) that doesn't exist.`,
                `Either that post doesn't exist or you don't have permission to view it.`)
        }

        if ( post.userId !== currentUser.id) {
            const canViewPost = await this.permissionService.can(currentUser, 'view', 'Post', { post: post })

            if ( ! canViewPost ) {
                throw new ControllerError(404, 'not-found',
                    `User(${currentUser.id}) attempted to post a comment on Post(${postId}) they don't have permission to view.`,
                    `Either that post doesn't exist or you don't have permission to view it.`)
            }
        }

        const commentResults = await this.postCommentDAO.selectPostComments({
            where: `post_comments.post_id = $1`,
            params: [ postId ]
        })

        const meta = await this.postCommentDAO.selectPostComments({
            where: `post_commens.post_id = $1`,
            params: [ postId ]
        })

        const relations = await this.getRelations(currentUser, commentResults)

        response.status(200).json({
            dictionary: commentResults.dictionary,
            list: commentResults.list,
            meta: meta,
            relations: relations
        })
    }

    async postPostComments(request, response) {
        const currentUser = request.session.user
        const postId = request.params.postId

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to post a comment.`,
                `You must be authenticated to post a comment.`)
        }

        const post = await this.postDAO.getPostById(postId)

        if ( ! post ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempted to post a comment on Post(${postId}) that doesn't exist.`,
                `Either that post doesn't exist or you don't have permission to view it.`)
        }

        if ( post.userId !== currentUser.id) {
            const canViewPost = await this.permissionService.can(currentUser, 'view', 'Post', { post: post })

            if ( ! canViewPost ) {
                throw new ControllerError(404, 'not-found',
                    `User(${currentUser.id}) attempted to post a comment on Post(${postId}) they don't have permission to view.`,
                    `Either that post doesn't exist or you don't have permission to view it.`)
            }
        }
        
        const reactionResults = await this.core.database.query(`
            SELECT reaction FROM post_reactions WHERE post_reactions.post_id = $1 AND post_reactions.user_id = $2
        `, [ postId, currentUser.id])


        const comment = {
            id: Uuid.v4(),
            postId: postId,
            userId: currentUser.id,
            content: request.body.content
        }

        await this.postCommentDAO.insertPostComments(comment)

        let activity = parseInt(post.activity)
        if ( reactionResults.rows.length <= 0 || reactionResults.rows[0].reaction != 'block') {
            activity += 1
        } 

        const postPatch = {
            id: postId,
            activity: activity
        }

        await this.postDAO.updatePost(postPatch)

        const results = await this.postCommentDAO.selectPostComments({
            where: `post_comments.id = $1`,
            params: [ comment.id ]
        })

        const entity = results.dictionary[comment.id]

        if ( ! entity ) {
            throw new ControllerError(500, 'server-error',
                `PostComment(${comment.id}) missing after update.`,
                `Postcomment(${comment.id}) missing after being updated.  Please report as a bug.`)
        }
    
        // Subscribe the user if they aren't already subscribed.
        // Don't subscribe post authors to their own posts.
        // Authors already get notified of comments on their posts.

        const subscription = await this.postSubscriptionDAO.getPostSubscriptionByPostAndUser(postId, currentUser.id)

        if ( subscription === null ) {
            await this.postSubscriptionDAO.insertPostSubscriptions({
                postId: postId,
                userId: currentUser.id
            })
        }

        const relations = await this.getRelations(currentUser, results)

        const postCommentVersion = {
            postCommentId: entity.id,
            content: entity.content,
        }

        await this.postCommentDAO.insertPostCommentVersions(postCommentVersion)


        await this.notificationService.sendNotifications(
            currentUser, 
            'Post:comment:create',
            {
                post: relations.posts[postId],
                commentAuthor: currentUser,
                comment: entity
            }
        )

        response.status(201).json({
            entity: entity,
            relations: relations 
        })
    }

    async getPostComment(request, response) {
        const currentUser = request.session.user
        const postId = request.params.postId
        const id = request.params.id
 
        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to GET a comment.`,
                `You must be authenticated to GET a comment.`)
        }

        const post = await this.postDAO.getPostById(postId)

        if ( ! post ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempted to post a comment on Post(${postId}) that doesn't exist.`,
                `Either that post doesn't exist or you don't have permission to view it.`)
        }

        if ( post.userId !== currentUser.id) {
            const canViewPost = await this.permissionService.can(currentUser, 'view', 'Post', { post: post })

            if ( ! canViewPost ) {
                throw new ControllerError(404, 'not-found',
                    `User(${currentUser.id}) attempted to post a comment on Post(${postId}) they don't have permission to view.`,
                    `Either that post doesn't exist or you don't have permission to view it.`)
            }
        }

        const results = await this.postCommentDAO.selectPostComments({
            where: `post_comments.id = $1`,
            params: [ id ]
        })

        if ( results.list.length <= 0 ) {
            throw new ControllerError(404, 'not-found',
                `No Comment(${id}) found.`,
                `That comment either doesn't exist or you don't have permission to view it.`)
        }

        const relations = await this.getRelations(currentUser, results)
        response.status(200).json({
            entity: results.dictionary[id],
            relations: relations 
        })
    }

    async patchPostComment(request, response) {
        const currentUser = request.session.user
        const postId = request.params.postId
        const commentId = request.params.id
 
        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to post a comment.`,
                `You must be authenticated to post a comment.`)
        }

        const existing = await this.core.database.query(`
            SELECT post_id, user_id FROM post_comments WHERE post_comments.id = $1
        `, [ commentId ])

        if ( existing.rows.length <= 0 ) {
            throw new ControllerError(404, 'not-found',
                `Comment(${commentId}) on Post(${postId}) was not found by User(${currentUser.id}) attempting to edit.`,
                `That comment either doesn't exist or you don't have permission to see it.`)
        }

        if ( existing.rows[0].user_id != currentUser.id) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempted to edit Comment(${commentId}) without permission.`,
                `You may only edit your own comments.`)
        }

        if ( existing.rows[0].post_id != postId) {
            throw new ControllerError(400, 'invalid',
                `User(${currentUser.id}) attempted to edit Comment(${commentId}) with wrong post.`,
                `You provided the wrong postId in the route, please provide the correct one.`)
        }

        const comment = {
            id: commentId
        }

        if ( 'content' in request.body) {
            comment.content = request.body.content
        }

        await this.postCommentDAO.updatePostComment(comment)

        const results = await this.postCommentDAO.selectPostComments({
            where: `post_comments.id = $1`,
            params: [ comment.id ]
        })

        const entity = results.dictionary[comment.id]

        if ( ! entity ) {
            throw new ControllerError(500, 'server-error',
                `PostComment(${comment.id}) missing after update.`,
                `Postcomment(${comment.id}) missing after being updated.  Please report as a bug.`)
        }

        const postCommentVersion = {
            postCommentId: entity.id,
            content: entity.content
        }
        await this.postCommentDAO.insertPostCommentVersions(postCommentVersion)

        response.status(200).json({
            entity: entity,
            relations: await this.getRelations(currentUser, results)
        })
    }

    async deletePostComment(request, response) {
        const currentUser = request.session.user
        const postId = request.params.postId
        const commentId = request.params.id
 
        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to delete a comment.`,
                `You must be authenticated to delete a comment.`)
        }

        const existing = await this.core.database.query(`
            SELECT post_id, user_id FROM post_comments WHERE post_comments.id = $1
        `, [ commentId ])

        if ( existing.rows.length <= 0 ) {
            throw new ControllerError(404, 'not-found',
                `Comment(${commentId}) on Post(${postId}) was not found by User(${currentUser.id}) attempting to delete.`,
                `That comment either doesn't exist or you don't have permission to see it.`)
        }

        if ( existing.rows[0].user_id != currentUser.id) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempted to delete Comment(${commentId}) without permission.`,
                `You may only delete your own comments.`)
        }

        if ( existing.rows[0].post_id != postId) {
            throw new ControllerError(400, 'invalid',
                `User(${currentUser.id}) attempted to delete Comment(${commentId}) with wrong post.`,
                `You provided the wrong postId in the route, please provide the correct one.`)
        }


        await this.postCommentDAO.deletePostComment({ id: commentId })

        const postResult = await this.postDAO.selectPosts({ where: `posts.id = $1`,
            params: [ postId ]
        })

        const entity = postResult.dictionary[postId]

        if ( ! entity ) {
            throw new ControllerError(500, 'server-error',
                `Post(${postId}) missing after update.`,
                `Post missing after being updated.  Please report as a bug.`)
        }

        const posts = {}
        posts[entity.id] = entity

        response.status(200).json({
            entity: entity,
            relations: {
                posts: posts
            }
        })

    }


}
