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

module.exports = class GroupSubscriptionSchema extends Schema {
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
            groupId: {
                clean: (value) => { return cleanUuid(value) },
                validate: (value, existing, action) => {
                    const validator = new UUIDValidator('groupId', value, existing, action)
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
            status: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('status', value, existing, action)
                    const errors = validator
                        .mustNotBeNull()
                        .mustBeString()
                        .mustBeOneOf(['unsubscribed', 'mentions', 'posts'])
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
