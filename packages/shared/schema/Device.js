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

const { stringCleaner, cleanNumber, cleanBoolean } = require('../cleaning/types')
const { StringValidator, NumberValidator, BooleanValidator } = require('../validation/types')

const Schema = require('./Schema')

module.exports = class DeviceSchema extends Schema {
    constructor() {
        super()

        this.properties = {
            identifier: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('identifier', value, existing, action)
                    const errors = validator
                        .mustNotBeNull()
                        .mustBeString()
                        .mustNotBeEmpty()
                        .getErrors()
                    return errors
                }
            },
            name: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('name', value, existing, action)
                    const errors = validator
                        .mustBeString()
                        .getErrors()
                    return errors
                }
            },
            model: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('model', value, existing, action)
                    const errors = validator
                        .mustBeString()
                        .getErrors()
                    return errors
                }
            },
            platform: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('platform', value, existing, action)
                    const errors = validator
                        .mustBeString()
                        .mustBeOneOf([ 'ios', 'android', 'web' ])
                        .getErrors()
                    return errors
                }
            },
            operatingSystem: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('operatingSystem', value, existing, action)
                    const errors = validator
                        .mustBeString()
                        .mustBeOneOf([ 'ios', 'android', 'windows', 'mac', 'unknown' ])
                        .getErrors()
                    return errors
                }
            },
            osVersion: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('osVersion', value, existing, action)
                    const errors = validator
                        .mustBeString()
                        .getErrors()
                    return errors
                }
            },
            iOSVersion: {
                clean: (value) => { return cleanNumber(value) },
                validate: (value, existing, action) => {
                    const validator = new NumberValidator('iOSVersion', value, existing, action)
                    const errors = validator
                        .mustBeNumber()
                        .mustNotBeNaN()
                        .getErrors()
                    return errors
                }
            },
            androidSDKVersion: {
                clean: (value) => { return cleanNumber(value) },
                validate: (value, existing, action) => {
                    const validator = new NumberValidator('androidSDKVersion', value, existing, action)
                    const errors = validator
                        .mustBeNumber()
                        .mustNotBeNaN()
                        .getErrors()
                    return errors
                }
            },
            manufacturer: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('manufacturer', value, existing, action)
                    const errors = validator
                        .mustBeString()
                        .getErrors()
                    return errors
                }
            },
            isVirtual: {
                clean: (value) => { return cleanBoolean(value) },
                validate: (value, existing, action) => {
                    const validator = new BooleanValidator('isVirtual', value, existing, action)
                    const errors = validator
                        .mustBeBoolean()
                        .getErrors()
                    return errors
                }
            },
            memUsed: {
                clean: (value) => { return cleanNumber(value) },
                validate: (value, existing, action) => {
                    const validator = new NumberValidator('memUsed', value, existing, action)
                    const errors = validator
                        .mustBeNumber()
                        .mustNotBeNaN()
                        .getErrors()
                    return errors
                }
            },
            webViewVersion: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('webViewVersion', value, existing, action)
                    const errors = validator
                        .mustBeString()
                        .getErrors()
                    return errors
                }
            },
            deviceToken: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('deviceToken', value, existing, action)
                    const errors = validator
                        .mustBeString()
                        .getErrors()
                    return errors
                }
            },
            notificationPermission: {
                clean: (value) => { return stringCleaner(value) },
                validate: (value, existing, action) => {
                    const validator = new StringValidator('notificationPermissions', value, existing, action)
                    const errors = validator
                        .mustBeString()
                        .mustBeOneOf([ 'granted', 'denied' ])
                        .getErrors()
                    return errors
                }
            }
        }
    }
}
