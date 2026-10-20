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

const { util, validation } = require('@communities/shared')

const ServiceError = require('../../errors/ServiceError')

module.exports = class CommentReactionValidation {

    constructor(core, validationService) {
        this.core = core
        this.validationService = validationService
    }


    async validateCommentReaction(currentUser, commentReaction, existing) {
        const errors = []

        if ( existing !== undefined && existing !== null && existing.id !== commentReaction.id ) {
            throw new ServiceError('entity-mismatch',
                `Existing CommentReaction(${existing.id}) does not match CommentReaction(${commentReaction.id}).`)
        }

        // Do basic validation the fields.
        const validationErrors = validation.CommentReaction.validate(commentReaction, existing)
        if ( validationErrors.all.length > 0 ) {
            errors.push(...validationErrors.all)
        }

        if ( errors.length > 0 ) {
            return errors
        }

        if ( util.objectHas(commentReaction, 'userId' ) && commentReaction.userId !== null) {
            const userResults = await this.core.database.query(`
                SELECT id FROM users WHERE id = $1
            `, [ commentReaction.userId ])

            if ( userResults.rows.length <= 0 || userResults.rows[0].id !== commentReaction.userId) {
                errors.push({
                    type: `userId:not-found`,
                    log: `User(${commentReaction.userId}) not found.`,
                    message: `User not found for that userId.`
                })
            }
        }

        if ( util.objectHas(commentReaction, 'postId' ) && commentReaction.postId !== null) {
            const postResults = await this.core.database.query(`
                SELECT id FROM posts WHERE id = $1
            `, [ commentReaction.postId ])

            if ( postResults.rows.length <= 0 || postResults.rows[0].id !== commentReaction.postId) {
                errors.push({
                    type: `postId:not-found`,
                    log: `Post(${commentReaction.postId}) not found.`,
                    message: `Post not found for that postId.`
                })
            }
        }

        if ( util.objectHas(commentReaction, 'commentId' ) && commentReaction.commentId !== null) {
            const commentResults = await this.core.database.query(`
                SELECT id, post_id FROM post_comments WHERE id = $1
            `, [ commentReaction.commentId ])

            if ( commentResults.rows.length <= 0 || commentResults.rows[0].id !== commentReaction.commentId) {
                errors.push({
                    type: `commentId:not-found`,
                    log: `PostComment(${commentReaction.commentId}) not found.`,
                    message: `Comment not found for that commentId.`
                })
            }

            // The reaction's postId must be the post the comment is on.  When
            // updating, postId may be omitted, so compare to the existing.
            else {
                const postId = util.objectHas(commentReaction, 'postId') ? commentReaction.postId : existing?.postId
                if ( commentResults.rows[0].post_id !== postId ) {
                    errors.push({
                        type: `commentId:post-mismatch`,
                        log: `PostComment(${commentReaction.commentId}) is not on Post(${postId}).`,
                        message: `That comment is not on that post.`
                    })
                }
            }
        }

        return errors
    }
}
