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
const { stringCleaner, intCleaner } = require('../cleaning/types')
const { StringValidator, ArrayValidator, NumberValidator } = require('../validation/types')

const Schema = require('./Schema')

module.exports = class GroupSchema extends Schema {
    constructor() {
        super()

        this.properties = {
            timestamp: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('timestamp', value, existing, action)
                    const errors = validator
                        .isRequiredToCreate()
                        .mustNotBeNull()
                        .mustBeString()
                        .mustNotBeEmpty()
                        .mustBeShorterThan(32)
                        .getErrors()
                    return errors
                }
            },
            level: {
                clean: (value) => { return intCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new NumberValidator('level', value, existing, action)
                    const errors = validator
                        .isRequiredToCreate()
                        .mustNotBeNull()
                        .mustBeNumber()
                        .mustNotBeNaN()
                        .mustBeInteger()
                    return errors
                }
            },
            message: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('message', value, existing, action)
                    const errors = validator
                        .isRequiredToCreate()
                        .mustNotBeNull()
                        .mustBeString()
                        .mustNotBeEmpty()
                        .mustBeShorterThan(2048)
                        .getErrors()
                    return errors
                }
            },
            args: {
                clean: (value) => { return Array.isArray(value) ? value : [] },
                validate: (value, existing, action) => {
                    const validator = new ArrayValidator('args', value, existing, action)
                    const errors = validator
                        .isRequiredToCreate()
                        .mustNotBeNull()
                        .mustBeArray()
                        .getErrors()
                    return errors
                }
            },
            errors: {
                clean: (value) => { return Array.isArray(value) ? value : [] },
                validate: (value, existing, action) => {
                    const validator = new ArrayValidator('errors', value, existing, action)
                    const errors = validator
                        .isRequiredToCreate()
                        .mustNotBeNull()
                        .mustBeArray()
                        .getErrors()
                    return errors
                }
            }
        }
    }
}
