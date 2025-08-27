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

const BaseValidator = require('../validation/types/BaseValidator')

module.exports = class Schema {
    constructor() {
        this.properties = {}
    }

    clean(entity) {
        const cleanedEntity = {}
        for( const [property, handlers] of Object.entries(this.properties)) {
            const cleaner = handlers.clean
            if ( ! (property in entity) || entity[property] === undefined ) {
                continue
            }

            if ( cleaner !== null && typeof cleaner === 'function' ) {
                cleanedEntity[property] = cleaner(entity[property])
            } else {
                cleanedEntity[property] = entity[property]
            }
        }
        return cleanedEntity
    }

    validate(entity, existing) {
        const errors = {
            all: []
        }

        const action = existing !== undefined && existing !== null ? BaseValidator.ACTIONS.UPDATE : BaseValidator.ACTIONS.CREATE

        for(const [property, handlers] of Object.entries(this.properties)) {
            const validator = handlers.validate
            errors[property] = validator(entity[property], existing ? existing[property] : undefined, action)
            if ( errors[property].length > 0 ) {
                errors.all.push(...errors[property])
            }
        }

        return errors
    }
}
