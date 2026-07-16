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

const FileService = require('../FileService')

const ServiceError = require('../../errors/ServiceError')

module.exports = class GroupValidation {

    constructor(core, validationService) {
        this.core = core
        this.validationService = validationService

        this.fileService = new FileService(core)

        this.groupSchema = new schema.GroupSchema()
    }

    async validateGroup(currentUser, group, existing) {
        const errors = []

        if ( existing && group.id !== existing.id ) {
            throw new ServiceError('entity-mismatch',
                `Wrong 'existing' entity.`)
        }

        // Do basic validation the fields.
        const validationErrors = this.groupSchema.validate(group, existing)
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
                    SELECT id, user_id FROM files WHERE id = $1
                `, [ group.fileId ])

                if ( fileResults.rows.length <= 0 ) {
                    errors.push({
                        type: 'fileId:not-found',
                        log: `Did not file File(${group.fileId}).`,
                        message: `The file you attached is missing.`
                    })
                }

                // We only want to check for ownership and usage if we know the
                // file exists.
                else {
                    // Ensure the user owns the file they are attaching.
                    if ( fileResults.rows[0].user_id !== currentUser.id ) {
                        errors.push({
                            type: 'files:not-authorized',
                            log: `User attempting to attach files they do not own to their group.`,
                            message: `You may only attach files you have uploaded.`
                        })
                    }

                    // We only want to check usage if we know the user owns the
                    // file.
                    else {

                        const usage = await this.fileService.getUsageByFileId(group.fileId)
                        if ( usage !== null ) {
                            // If this is a new group and the file is in use, then conflict.
                            if ( existing === null || existing === undefined ) {
                                errors.push({
                                    type: 'files:conflict',
                                    log: `User attempting to attach file to group, but file is in use.`,
                                    message: `You may not attach files that are already in use.`
                                })
                            }
                            // If this is not a new group, then the usage must
                            // be for this group (and only this group).
                            else if ( usage.groupId !== existing.id
                                || usage.postId !== null
                                || usage.userId !== null
                                || usage.linkPreviewId !== null
                            ) {
                                errors.push({
                                    type: 'files:conflict',
                                    log: `User attempting to attach file to group, but file is in use.`,
                                    message: `You may not attach files that are already in use.`
                                })
                            }
                        }
                    }
                }

            }
        }

        return errors
    }

}
