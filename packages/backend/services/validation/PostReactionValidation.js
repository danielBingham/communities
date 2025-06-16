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

module.exports = class PostReactionValidation {

    constructor(core, validationService) {
        this.core = core
        this.validationService = validationService
    }


    async validatePostReaction(currentUser, postReaction, existing) {
        const errors = []

        if ( existing !== undefined && existing !== null && existing.id !== postReaction.id ) {
            throw new ServiceError('entity-mismatch', 
                `Existing PostComment(${existing.id}) does not match PostReaction(${postReaction.id}).`)
        }

        // Do basic validation the fields.
        const validationErrors = validation.PostReaction.validate(postReaction, existing)
        if ( validationErrors.all.length > 0 ) {
            errors.push(...validationErrors.all)
        }

        if ( errors.length > 0 ) {
            return errors
        }

        if ( util.objectHas(postReaction, 'userId' ) && postReaction.userId !== null) {
            const userResults = await this.core.database.query(`
                SELECT id FROM users WHERE id = $1
            `, [ postReaction.userId ])

            if ( userResults.rows.length <= 0 || userResults.rows[0].id !== postReaction.userId) {
                errors.push({
                    type: `userId:not-found`,
                    log: `User(${postReaction.userId}) not found.`,
                    message: `User not found for that userId.`
                })
            }
        }

        if ( util.objectHas(postReaction, 'postId' ) && postReaction.postId !== null) {
            const postResults = await this.core.database.query(`
                SELECT id FROM posts WHERE id = $1
            `, [ postReaction.postId ])

            if ( postResults.rows.length <= 0 || postResults.rows[0].id !== postReaction.postId) {
                errors.push({
                    type: `postId:not-found`,
                    log: `Post(${postReaction.postId}) not found.`,
                    message: `User not found for that postId.`
                })
            }
        }

        return errors
    }
}
