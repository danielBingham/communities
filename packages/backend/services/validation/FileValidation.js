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

const { util, schema } = require('@communities/shared')

const ServiceError = require('../../errors/ServiceError')

module.exports = class FileValidation {

    constructor(core, validationService) {
        this.core = core
        this.validationService = validationService

        this.fileSchema = new schema.FileSchema()
    }

    async validateFile(currentUser, file, existing) {
        const errors = []

        if ( existing && file.id !== existing.id ) {
            throw new ServiceError('entity-mismatch',
                `Wrong 'existing' entity.`)
        }

        // Do basic validation the fields.
        const validationErrors = this.fileSchema.validate(file, existing)
        if ( validationErrors.all.length > 0 ) {
            errors.push(...validationErrors.all)
        }

        // If we have invalid fields set, then we don't need to go any further.
        if ( errors.length > 0 ) {
            return errors
        }

        if ( util.objectHas(file, 'userId') ) {
            if ( file.userId === null ) {

            } else {
                const userResults = await this.core.database.query(`
                        SELECT id FROM users WHERE id = $1
                    `, [ file.userId ])

                if ( userResults.rows.length <= 0 ) {
                    errors.push({
                        type: 'userId:not-found',
                        log: `Did not find User(${file.userId}).`,
                        message: `Unable to find a User for that userId.`
                    })
                }
            }
        }

        return errors
    }

}
