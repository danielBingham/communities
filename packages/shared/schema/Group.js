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

module.exports = class GroupSchema extends Schema {
    constructor() {
        super()

        this.properties = {
            id: {
                clean: (value) => { return cleanUuid(value) },
                validate: (value, existing, action) => {
                    const validator = new UUIDValidator('id', value, existing, action)
                    const errors = validator
                        .isRequiredToUpdate()
                        .mustNotBeNull()
                        .mustBeUUID()
                        .getErrors()
                    return errors
                }
            },
            type: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('type', value, existing, action)
                    const errors = validator
                        .isRequiredToCreate()
                        .mustNotBeUpdated()
                        .mustNotBeNull()
                        .mustBeString()
                        .mustBeOneOf(['open', 'private', 'hidden', 'private-open', 'hidden-open', 'hidden-private'])
                        .getErrors()
                    return errors
                }
            }, 
            postPermissions: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('postPermissions', value, existing, action)
                    const errors = validator
                        .isRequiredToCreate()
                        .mustNotBeNull()
                        .mustBeString()
                        .mustBeOneOf(['anyone', 'members', 'approval', 'restricted'])
                        .getErrors()
                    return errors
                }
            },
            title: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('title', value, existing, action)
                    const errors = validator
                        .isRequiredToCreate()
                        .mustNotBeUpdated()
                        .mustNotBeNull()
                        .mustBeString()
                        .mustNotBeEmpty()
                        .mustBeShorterThan(512)
                        .getErrors()

                    return errors
                }
            },
            slug: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('slug', value, existing, action)
                    const errors = validator
                        .isRequiredToCreate()
                        .mustNotBeUpdated()
                        .mustNotBeNull()
                        .mustBeString()
                        .mustNotBeEmpty()
                        .mustBeShorterThan(512)
                        .mustMatch(/^[a-zA-Z][a-zA-Z0-9\-_]+$/, `Must start with a letter and may only include letters, numbers, '-', '_'.`)
                        .getErrors()
                    return errors
                }
            },
            about: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('about', value, existing, action)
                    const errors = validator
                        .mustNotBeNull()
                        .mustBeString()
                        .mustBeShorterThan(10000)
                        .getErrors()
                    return errors
                }
            },
            parentId: {
                clean: (value) => { return cleanUuid(value) },
                validate: (value, existing, action) => {
                    const validator = new UUIDValidator('fileId', value, existing, action)

                    // parentId may be null.
                    const errors = validator
                        .mustBeUUID()
                        .getErrors()
                    return errors

                }

            },
            fileId: {
                clean: (value) => { return cleanUuid(value) },
                validate: (value, existing, action) => {
                    const validator = new UUIDValidator('fileId', value, existing, action)

                    // fileId may be null.
                    const errors = validator
                        .mustBeUUID()
                        .getErrors()
                    return errors

                }
            },
            entranceQuestions: {
                clean: (value) => { return value },
                validate: (value, existing, action) => {
                    const validator = new ObjectValidator('entranceQuestions', value, existing, action)
                    const errors = validator
                        .mustNotBeSet()
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
