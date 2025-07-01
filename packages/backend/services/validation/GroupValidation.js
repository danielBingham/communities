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

module.exports = class GroupValidation {

    constructor(core, validationService) {
        this.core = core
        this.validationService = validationService
    }

    async validateGroup(currentUser, group, existing) {
        const errors = []

        if ( existing && group.id !== existing.id ) {
            throw new ServiceError('entity-mismatch',
                `Wrong 'existing' entity.`)
        }

        // Do basic validation the fields.
        const validationErrors = validation.Group.validate(group, existing)
        if ( validationErrors.all.length > 0 ) {
            errors.push(...validationErrors.all)
        }

        // If we have invalid fields set, then we don't need to go any further.
        if ( errors.length > 0 ) {
            return errors
        }

        if ( util.objectHas(group, 'fileId') ) {
            // fileId may be null.
            if ( group.fileId !== null ) {
                const fileResults = await this.core.database.query(`
                    SELECT id FROM files WHERE id = $1
                `, [ group.fileId ])

                if ( fileResults.rows.length <= 0 ) {
                    errors.push({
                        type: 'fileId:not-found',
                        log: `Did not file File(${group.fileId}).`,
                        message: `Unable to find a File for that fileId.`
                    })
                }
            }
        }

        return errors
    }

}
