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

module.exports = class PostSubscriptionValidation {

    constructor(core, validationService) {
        this.core = core
        this.validationService = validationService
    }


    async validatePostSubscription(currentUser, postSubscription, existing) {
        const errors = []

        if ( existing !== undefined && existing !== null && existing.id !== postSubscription.id ) {
            throw new ServiceError('entity-mismatch', 
                `Existing PostComment(${existing.id}) does not match PostSubscription(${postSubscription.id}).`)
        }

        // Do basic validation the fields.
        const validationErrors = validation.PostSubscription.validate(postSubscription, existing)
        if ( validationErrors.all.length > 0 ) {
            errors.push(...validationErrors.all)
        }

        // TODO Check userId and postId for existence

        return errors
    }
}
