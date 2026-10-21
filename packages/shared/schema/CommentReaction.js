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
const { stringCleaner, cleanUuid } = require('../cleaning/types')
const { StringValidator, ObjectValidator, UUIDValidator } = require('../validation/types')

const Schema = require('./Schema')

/**
 * A user's reaction to a PostComment.
 *
 *  {
 *      id: '<uuid>',
 *      postId: '<id of the Post the comment is on>',
 *      commentId: '<id of the PostComment>',
 *      userId: '<id of the reacting User>',
 *      reaction: 'like',
 *      createdDate: '<timestamp>',
 *      updatedDate: '<timestamp>'
 *  }
 */
module.exports = class CommentReactionSchema extends Schema {

    /**
     * The reactions a user may leave on a PostComment.  These must match the
     * `comment_reaction_type` enum in the database.
     */
    static REACTIONS = [ 'like' ]

    constructor() {
        super()

        this.properties = {
            id: {
                clean: (value) => { return cleanUuid(value) },
                validate: (value, existing, action) => {
                    const validator = new UUIDValidator('id', value, existing, action)
                    const errors = validator
                        .mustNotBeNull()
                        .mustBeUUID()
                        .getErrors()
                    return errors
                }
            },
            postId: {
                clean: (value) => { return cleanUuid(value) },
                validate: (value, existing, action) => {
                    const validator = new UUIDValidator('postId', value, existing, action)
                    const errors = validator
                        .isRequiredToCreate()
                        .mustNotBeUpdated()
                        .mustNotBeNull()
                        .mustBeUUID()
                        .getErrors()
                    return errors
                }
            },
            commentId: {
                clean: (value) => { return cleanUuid(value) },
                validate: (value, existing, action) => {
                    const validator = new UUIDValidator('commentId', value, existing, action)
                    const errors = validator
                        .isRequiredToCreate()
                        .mustNotBeUpdated()
                        .mustNotBeNull()
                        .mustBeUUID()
                        .getErrors()
                    return errors
                }
            },
            userId: {
                clean: (value) => { return cleanUuid(value) },
                validate: (value, existing, action) => {
                    const validator = new UUIDValidator('userId', value, existing, action)
                    const errors = validator
                        .isRequiredToCreate()
                        .mustNotBeUpdated()
                        .mustNotBeNull()
                        .mustBeUUID()
                        .getErrors()
                    return errors
                }
            },
            reaction: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('reaction', value, existing, action)
                    const errors = validator
                        .isRequiredToCreate()
                        .isRequiredToUpdate()
                        .mustNotBeNull()
                        .mustBeString()
                        .mustBeOneOf(CommentReactionSchema.REACTIONS)
                        .getErrors()
                    return errors
                }
            },
            createdDate: {
                clean: (value) => { return value },
                validate: (value, existing, action) => {
                    const validator = new ObjectValidator('createdDate', value, existing, action)
                    const errors = validator
                        .mustNotBeSet()
                        .getErrors()
                    return errors
                }
            },
            updatedDate: {
                clean: (value) => { return value },
                validate: (value, existing, action) => {
                    const validator = new ObjectValidator('updatedDate', value, existing, action)
                    const errors = validator
                        .mustNotBeSet()
                        .getErrors()
                    return errors
                }
            }
        }
    }
}
