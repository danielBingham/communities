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

module.exports = class PostCommentValidation {

    constructor(core, validationService) {
        this.core = core
        this.validationService = validationService
    }


    async validatePostComment(currentUser, postComment, existing) {
        const errors = []

        if ( existing !== undefined && existing !== null && existing.id !== postComment.id ) {
            throw new ServiceError('entity-mismatch', 
                `Existing PostComment(${existing.id}) does not match PostComment(${postComment.id}).`)
        }

        // ================== Always Disallowed ===============================
        // There are some fields the user is never allowed to set.  Check those 
        // fields first and return if any of them are set.

        const alwaysDisallowedFields = [ 'createdDate', 'updatedDate' ]

        for(const disallowedField of alwaysDisallowedFields ) {
            if ( util.objectHas(postComment, disallowedField) ) {
                errors.push({
                    type: `${disallowedField}:not-allowed`,
                    log: `${disallowedField} is not allowed.`,
                    message: `You may not set '${disallowedField}'.`
                })
            }
        }

        if ( errors.length > 0 ) {
            return errors
        }

        // ================== Situational Checks ==============================
        // Initial creation and updating each have different sets of fields they
        // require or disallow. Check those next and return if any are set.

        // Creating a new comment.
        if ( ! existing ) {
            const requiredFields = [ 'userId', 'postId', 'content' ]
            for(const requiredField of requiredFields) {
                if ( ! util.objectHas(postComment, requiredField) || postComment[requiredField] === null ) {
                    errors.push({
                        type: `${requiredField}:missing`,
                        log: `${requiredField} is required.`,
                        message: `${requiredField} is required.`
                    })
                }
            }
        } 

        // We're editing a comment.
        else {
            const disallowedFields = [ 'userId', 'postId' ]
            for(const disallowedField of disallowedFields ) {
                if ( util.objectHas(postComment, disallowedField) 
                    && postComment[disallowedField] !== existing[disallowedField] ) 
                {
                    errors.push({
                        type: `${disallowedField}:not-allowed`,
                        log: `Updating ${disallowedField} is not allowed.`,
                        message: `You may not update '${disallowedField}'.`
                    })
                }
            }

            const requiredFields = [ 'content' ]
            for(const requiredField of requiredFields) {
                if ( ! util.objectHas(postComment, requiredField) || postComment[requiredField] === null ) {
                    errors.push({
                        type: `${requiredField}:missing`,
                        log: `${requiredField} is required.`,
                        message: `${requiredField} is required.`
                    })
                }
            }
        }

        if ( errors.length > 0 ) {
            return errors
        }

        // Do basic validation the fields.
        const validationErrors = validation.PostComment.validate(postComment)
        if ( validationErrors.all.length > 0 ) {
            errors.push(...validationErrors.all)
        }

        // TO DO Validate that userId and postId exist.

        return errors
    }
}
