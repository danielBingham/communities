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
const { stringCleaner, cleanUuid, cleanBoolean } = require('../cleaning/types')
const { StringValidator, ObjectValidator, BooleanValidator, UUIDValidator } = require('../validation/types')

const Schema = require('./Schema')

module.exports = class NotificationSchema extends Schema {
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
            description: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('', value, existing, action)
                    const errors = validator
                        .mustNotBeSet()
                        .getErrors()
                    return errors
                }
            },
            path: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('path', value, existing, action)
                    const errors = validator
                        .mustNotBeSet()
                        .getErrors()
                    return errors
                }
            },
            isRead: {
                clean: (value) => { return cleanBoolean(value) },
                validate: (value, existing, action) => {
                    const validator = new BooleanValidator('isRead', value, existing, action)
                    const errors = validator
                        .isRequiredToUpdate()
                        .mustBeBoolean()
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
