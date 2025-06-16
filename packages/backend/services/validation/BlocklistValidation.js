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

module.exports = class BlocklistValidation {

    constructor(core, validationService) {
        this.core = core
        this.validationService = validationService
    }

    async validateBlocklist(currentUser, blocklist, existing) {
        const errors = []
        
        // We're editing a blocklist.
        if ( existing !== null && existing !== undefined ) {
            if ( util.objectHas(blocklist, 'id') && blocklist.id !== existing.id ) {
                throw new ServiceError('entity-mismatch',
                    `Wrong 'existing' entity.`)
            }
        }

        // Do basic validation the fields.
        const validationErrors = validation.Blocklist.validate(blocklist, existing)
        if ( validationErrors.all.length > 0 ) {
            errors.push(...validationErrors.all)
        }

        // If we have invalid fields set, then we don't need to go any further.
        if ( errors.length > 0 ) {
            return errors
        }

        
       if ( util.objectHas(blocklist, 'userId') ) {
            const userResults = await this.core.database.query(`SELECT id FROM users WHERE id = $1`, [ blocklist.userId ])
            if ( userResults.rows.length <= 0 ) {
                errors.push({
                    type: `userId:not-found`,
                    log: `No user found for userId '${blocklist.userId}'.`,
                    message: `No user found for userId.`
                })
            }

            if ( currentUser.id !== blocklist.userId ) {
                errors.push({
                    type: `userId:not-authorized`,
                    log: `User may not create a blocklist for another user.`,
                    message: `You may not create a blocklist for another user.`
                })
            }
        } 

        // Do backend specific validation.
        if ( util.objectHas(blocklist, 'domain') ) {
            const domainResults = await this.core.database.query(`SELECT id FROM blocklist WHERE domain = $1`, [ blocklist.domain])
            if ( domainResults.rows.length > 0 ) {
                errors.push({
                    type: `domain:conflict`,
                    log: `${blocklist.domain} is already in the blocklist.`,
                    message: `${blocklist.domain} is already in the blocklist.`
                })
            }
        }

        return errors
    }
}
