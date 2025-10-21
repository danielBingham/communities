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
const { stringCleaner, cleanNumber, cleanBoolean, cleanUuid, cleanEmail } = require('../cleaning/types')
const { StringValidator, NumberValidator, BooleanValidator, UUIDValidator } = require('../validation/types')

const Schema = require('./Schema')

/**
 * TODO TECHDEBT This schema is incomplete.
 */
module.exports = class UserSchema extends Schema {
    constructor() {
        super()

        this.properties = {
            id: {
                clean: (value) => { return cleanUuid(value) },
                validate: (value, existing, action) => {
                    const validator = new UUIDValidator('id', value, existing, action)
                    const errors = validator
                        .isRequriedToUpdate()
                        .mustNotBeNull()
                        .mustBeUUID()
                        .getErrors()
                    return errors
                }
            },
            fileId: {
                clean: (value) => { return cleanUuid(value) },
                validate: (value, existing, action) => {
                    const validator = new UUIDValidator('fileId', value, existing, action)
                    const errors = validator
                        .mustBeUUID()
                        .getErrors()
                    return errors
                }
            },
            name: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('name', value, existing, action)
                    const errors = validator
                        .mustNotBeNull()
                        .mustBeString()
                        .mustNotBeEmpty()
                        .mustBeShorterThan(512)
                        .getErrors()
                    return errors
                }
            },
            username: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('name', value, existing, action)
                    const errors = validator
                        .mustNotBeNull()
                        .mustBeString()
                        .mustNotBeEmpty()
                        .mustBeShorterThan(512)
                        .mustMatch(/^[a-zA-Z][a-zA-Z0-9\-_]+$/)
                        .getErrors()
                    return errors
                }
            },
            email: {
                clean: (value) => { return cleanEmail(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('email', value, existing, action)
                    const errors = validator
                        .isRequiredToCreate()
                        .mustNotBeNull()
                        .mustBeString()
                        .mustNotBeEmpty()
                        .mustBeShorterThan(512)
                        .mustMatch(/^.*\@.*$/)
                        .getErrors()
                    return errors

                }
            }
        }
    }
}
