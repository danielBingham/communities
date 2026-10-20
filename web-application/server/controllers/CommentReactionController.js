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
    CommentReactionDAO,
    PostDAO,
    PostCommentDAO,

    PermissionService,
    ValidationService
} = require('@communities/backend')
const ControllerError = require('../errors/ControllerError')

module.exports = class CommentReactionController {

    constructor(core) {
        this.core = core

        this.commentReactionDAO = new CommentReactionDAO(core)
        this.postDAO = new PostDAO(core)
        this.postCommentDAO = new PostCommentDAO(core)

        this.permissionService = new PermissionService(core)
        this.validationService = new ValidationService(core)
    }

    /**
     * Send the PostComments up as relations, because their `reactions` will
     * have changed.
     *
     * @param {string[]} commentIds The ids of the PostComments to send.
     */
    async getRelations(commentIds) {
        const postCommentResults = await this.postCommentDAO.selectPostComments({
            where: `post_comments.id = ANY($1::uuid[])`,
            params: [ commentIds ]
        })

        return {
            postComments: postCommentResults.dictionary
        }
    }

    /**
     * Run the checks shared by every CommentReaction endpoint: the feature is
     * enabled, the user is authenticated, and the user can view both the Post
     * and the PostComment, which must be on that Post.
     *
     * Users who are blocked by (or have blocked) the comment's author can't
     * view the comment, so they can't react to it either.
     *
     * @return {Promise<Object>} The `currentUser`, `post` and `postComment`.
     */
    async ensureCanViewComment(request) {
        if ( ! this.core.features.has('feat-268-comment-reactions') ) {
            throw new ControllerError(503, 'unsupported',
                `Comment reactions are not currently supported.`,
                `Comment reactions are not currently supported.`)
        }

        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to react to a comment.`,
                `You must be authenticated to react to a comment.`)
        }

        const postId = request.params.postId
        const commentId = request.params.commentId

        const post = await this.postDAO.getPostById(postId)
        if ( post === null ) {
            throw new ControllerError(404, 'not-found',
                `Post(${postId}) was not found by User(${currentUser.id}) attempting to react to Comment(${commentId}).`,
                `That comment either doesn't exist or you don't have permission to see it.`)
        }

        const canViewPost = await this.permissionService.can(currentUser, 'view', 'Post', { post: post })
        if ( canViewPost !== true ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to react to Comment(${commentId}) on Post(${postId}) without authorization to view the Post.`,
                `That comment either doesn't exist or you don't have permission to see it.`)
        }

        // A comment on a different post is reported as not found, so that we
        // don't leak the existence of comments on posts the user can't see.
        const postComment = await this.postCommentDAO.getPostCommentById(commentId)
        if ( postComment === null || postComment.postId !== postId ) {
            throw new ControllerError(404, 'not-found',
                `Comment(${commentId}) was not found on Post(${postId}) by User(${currentUser.id}) attempting to react.`,
                `That comment either doesn't exist or you don't have permission to see it.`)
        }

        const canViewPostComment = await this.permissionService.can(currentUser, 'view', 'PostComment', { post: post, postComment: postComment })
        if ( canViewPostComment !== true ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to react to Comment(${commentId}) without authorization to view it.`,
                `That comment either doesn't exist or you don't have permission to see it.`)
        }

        return { currentUser, post, postComment }
    }

    async postCommentReactions(request, response) {
        const { currentUser, post, postComment } = await this.ensureCanViewComment(request)

        const canCreateCommentReaction = await this.permissionService.can(currentUser, 'create', 'CommentReaction', { post: post, postComment: postComment })
        if ( canCreateCommentReaction !== true ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to react to Comment(${postComment.id}) without authorization.`,
                `You're not authorized to react to that comment.`)
        }

        const existing = await this.commentReactionDAO.getCommentReactionByCommentAndUser(postComment.id, currentUser.id)
        if ( existing !== null ) {
            throw new ControllerError(400, 'invalid',
                `User(${currentUser.id}) attempted to react to Comment(${postComment.id}) twice.`,
                `You can only react to a comment once.`)
        }

        const reaction = {
            id: Uuid.v4(),
            postId: post.id,
            commentId: postComment.id,
            userId: currentUser.id,
            reaction: request.body?.reaction
        }

        const validationErrors = await this.validationService.validateCommentReaction(currentUser, reaction)
        if ( validationErrors.length > 0 ) {
            const errorString = validationErrors.reduce((string, error) => `${string}\n${error.message}`, '')
            const logString = validationErrors.reduce((string, error) => `${string}\n${error.log}`, '')
            throw new ControllerError(400, 'invalid',
                `User submitted an invalid CommentReaction: ${logString}`,
                errorString)
        }

        try {
            await this.commentReactionDAO.insertCommentReactions(reaction)
        } catch (error) {
            // The unique constraint on (comment_id, user_id) catches the race
            // where two requests both pass the `existing` check above.
            if ( error?.code === '23505' ) {
                throw new ControllerError(400, 'invalid',
                    `User(${currentUser.id}) attempted to react to Comment(${postComment.id}) twice.`,
                    `You can only react to a comment once.`)
            }
            throw error
        }

        const entity = await this.commentReactionDAO.getCommentReactionById(reaction.id)
        if ( ! entity ) {
            throw new ControllerError(500, 'server-error',
                `CommentReaction(${reaction.id}) missing after creation.`,
                `CommentReaction missing after being created.  Please report as a bug.`)
        }

        response.status(201).json({
            entity: entity,
            relations: await this.getRelations([ postComment.id ])
        })
    }

    async deleteCommentReaction(request, response) {
        const { currentUser, postComment } = await this.ensureCanViewComment(request)

        const existing = await this.commentReactionDAO.getCommentReactionByCommentAndUser(postComment.id, currentUser.id)
        if ( existing === null ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempted to delete reaction to Comment(${postComment.id}) but no reaction found.`,
                `You can't delete a reaction that doesn't exist.`)
        }

        const canDeleteCommentReaction = await this.permissionService.can(currentUser, 'delete', 'CommentReaction', { postComment: postComment, commentReaction: existing })
        if ( canDeleteCommentReaction !== true ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to delete CommentReaction(${existing.id}) on Comment(${postComment.id}) without authorization.`,
                `You are not authorized to delete that reaction.`)
        }

        await this.commentReactionDAO.deleteCommentReaction({
            commentId: postComment.id,
            userId: currentUser.id
        })

        response.status(200).json({
            entity: existing,
            relations: await this.getRelations([ postComment.id ])
        })
    }

}
