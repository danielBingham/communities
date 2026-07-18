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

module.exports = class NotificationValidation {

    constructor(core, validationService) {
        this.core = core
        this.validationService = validationService

        this.notificationSchema = new schema.NotificationSchema()
    }

    async validateNotification(currentUser, notification, existing) {
        const errors = []

        if ( existing && notification.id !== existing.id ) {
            throw new ServiceError('entity-mismatch',
                `Wrong 'existing' entity.`)
        }

        // Do basic validation the fields.
        const validationErrors = this.notificationSchema.validate(notification, existing)
        if ( validationErrors.all.length > 0 ) {
            errors.push(...validationErrors.all)
        }

        // If we have invalid fields set, then we don't need to go any further.
        if ( errors.length > 0 ) {
            return errors
        }

        return errors
    }

}
