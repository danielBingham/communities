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

module.exports = class GroupSubscriptionValidation {

    constructor(core, validationService) {
        this.core = core
        this.validationService = validationService

        this.schema = new schema.GroupSubscriptionSchema()
    }


    async validateGroupSubscription(currentUser, groupSubscription, existing) {
        const errors = []

        if ( existing !== undefined && existing !== null && existing.id !== groupSubscription.id ) {
            throw new ServiceError('entity-mismatch', 
                `Existing GroupComment(${existing.id}) does not match GroupSubscription(${groupSubscription.id}).`)
        }

        // Do basic validation the fields.
        const validationErrors = this.schema.validate(groupSubscription, existing)
        if ( validationErrors.all.length > 0 ) {
            errors.push(...validationErrors.all)
        }

        if ( errors.length > 0 ) {
            return errors
        }

        // Validate relations.
        if ( util.objectHas(groupSubscription, 'userId' ) && groupSubscription.userId !== null) {
            const userResults = await this.core.database.query(`
                SELECT id FROM users WHERE id = $1
            `, [ groupSubscription.userId ])

            if ( userResults.rows.length <= 0 || userResults.rows[0].id !== groupSubscription.userId) {
                errors.push({
                    type: `userId:not-found`,
                    log: `User(${groupSubscription.userId}) not found.`,
                    message: `User not found for that userId.`
                })
            }
        }

        if ( util.objectHas(groupSubscription, 'groupId' ) && groupSubscription.groupId !== null) {
            const groupResults = await this.core.database.query(`
                SELECT id FROM groups WHERE id = $1
            `, [ groupSubscription.groupId ])

            if ( groupResults.rows.length <= 0 || groupResults.rows[0].id !== groupSubscription.groupId) {
                errors.push({
                    type: `groupId:not-found`,
                    log: `Group(${groupSubscription.groupId}) not found.`,
                    message: `Group not found for that groupId.`
                })
            }
        }

        if ( errors.length > 0 ) {
            return errors
        }

        // Authorization validation.
        if ( util.objectHas(groupSubscription, 'userId') && groupSubscription.userId !== null ) {

            // Users may only subscribe themselves.
            if ( groupSubscription.userId !== currentUser.id ) {
                errors.push({
                    type: `userId:not-authorized`,
                    log: `User attempting to create GroupSubscription for User(${groupSubscription.userId}).`,
                    message: `You are not allowed to create a GroupSubscription for another user.`
                })
            }
        }

        return errors
    }
}
