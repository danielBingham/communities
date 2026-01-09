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
const { ArrayValidator, StringValidator, ObjectValidator, UUIDValidator } = require('../validation/types')

const Schema = require('./Schema')

module.exports = class FileSchema extends Schema {
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
            state: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('state', value, existing, action)
                    const errors = validator
                        .mustNotBeNull()
                        .mustBeString()
                        .mustBeOneOf([ 'pending', 'processing', 'error', 'ready' ])
                        .getErrors()
                    return errors
                }
            }, 
            jobId: {
                clean: (value) => { return cleanUuid(value) },
                validate: (value, existing, action) => {
                    const validator = new UUIDValidator('jobId', value, existing, action)
                    const errors = validator
                        .mustNotBeSet()
                        .getErrors()
                    return errors
                }
            },
            variants: {
                clean: (value) => { return value },
                validate: (value, existing, action) => {
                    const validator = new ArrayValidator('variants', value, existing, action)
                    const errors = validator
                        .mustNotBeSet()
                        .getErrors()
                    return errors
                }
            }, 
            kind: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('kind', value, existing, action)
                    const errors = validator
                        .mustNotBeNull()
                        .mustBeString()
                        .mustBeOneOf([ 'video', 'image' ])
                        .getErrors()
                    return errors
                }
            }, 
            mimetype: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('mimetype', value, existing, action)
                    const errors = validator
                        .mustNotBeSet()
                        .getErrors()
                    return errors
                }
            }, 
            type: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('type', value, existing, action)
                    const errors = validator
                        .mustNotBeSet()
                        .getErrors()
                    return errors
                }
            }, 
            location: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('location', value, existing, action)
                    const errors = validator
                        .mustNotBeSet()
                        .getErrors()
                    return errors
                }
            }, 
            filepath: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('filepath', value, existing, action)
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
