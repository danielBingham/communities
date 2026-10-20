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

const CommentReactionDAO = require('../../daos/CommentReactionDAO')

const { util } = require('@communities/shared')

const ServiceError = require('../../errors/ServiceError')

module.exports = class CommentReactionPermissions {

    constructor(core, permissionService) {
        this.core = core

        this.permissionService = permissionService

        this.commentReactionDAO = new CommentReactionDAO(core)
    }

    async ensureContext(user, context, required, optional) {
        // CommentReaction is the root context, so we need to check and retrieve it first.
        if ( (required?.includes('commentReaction') || optional?.includes('commentReaction'))
            && ( ! util.objectHas(context, 'commentReaction') || context.commentReaction === null))
        {
            if ( context.commentReaction !== null ) {
                if ( util.objectHas(context, 'commentId') && context.commentId !== null
                    && util.objectHas(context, 'userId') && context.userId !== null)
                {
                    context.commentReaction = await this.commentReactionDAO.getCommentReactionByCommentAndUser(context.commentId, context.userId)
                } else if ( util.objectHas(context, 'commentReactionId') && context.commentReactionId !== null ) {
                    context.commentReaction = await this.commentReactionDAO.getCommentReactionById(context.commentReactionId)
                } else {
                    context.commentReaction = null
                }
            }

            if ( required?.includes('commentReaction') && context.commentReaction === null ) {
                throw new ServiceError('missing-context', `'commentReaction' missing from context.`)
            }
        }

        let commentId = null
        if ( util.objectHas(context, 'commentId') && context.commentId !== null ) {
            commentId = context.commentId
        }

        if ( util.objectHas(context, 'postComment') && context.postComment !== null ) {
            if ( commentId === null ) {
                commentId = context.postComment.id
            } else if ( commentId !== context.postComment.id ) {
                throw new ServiceError('context-mismatch', `Context includes elements from different PostComments.`)
            }
        }

        if ( util.objectHas(context, 'commentReaction') && context.commentReaction !== null ) {
            if ( commentId === null ) {
                commentId = context.commentReaction.commentId
            } else if ( commentId !== context.commentReaction.commentId ) {
                throw new ServiceError('context-mismatch', `Context includes elements from different PostComments.`)
            }
        }
    }

    async canViewCommentReaction(user, context) {
        // We're not going to test comment visibility here, but if you can see
        // the comment, you can view its reactions (for now).  Reactions from
        // users who are blocked by or have blocked the viewer are filtered out
        // when they are queried.
        return true
    }

    async canCreateCommentReaction(user, context) {
        // We're not going to test comment visibility here, but if you can see
        // the comment, you can react to it (for now).
        return true
    }

    async canUpdateCommentReaction(user, context) {
        await this.ensureContext(user, context, [ 'commentReaction' ])

        // Users may only update their own reactions.
        if ( context.commentReaction.userId === user.id ) {
            return true
        }

        return false
    }

    async canDeleteCommentReaction(user, context) {
        await this.ensureContext(user, context, [ 'commentReaction' ])

        // Users may only delete their own reactions.
        if ( context.commentReaction.userId === user.id ) {
            return true
        }

        return false
    }
}
