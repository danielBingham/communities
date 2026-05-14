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

const { MutualsService } = require('@communities/backend')

const getRemoveMutualsForRelationship = function(core) {
    return async function(job, done) {
        try {
            const currentUser = job.data.session.user
            const relationship = job.data.relationship

            core.logger.id = `Remove Mutuals For Relationship: ${job.id}`
            core.logger.info(`Beginning job 'remove-mutuals-for-relationship' for User(${currentUser.id}) and Relationship(${relationship.id}).`)

            const mutualsService = new MutualsService(core)
            await mutualsService.removeMutualsForRelationship(relationship)

            core.logger.info(`Finishing job 'remove-mutuals-for-relationship' for User(${currentUser.id}) and Relationship(${relationship.id}).`)
            core.logger.id = 'core'
            done(null)
        } catch (error) {
            core.logger.error(error)
            core.logger.id = 'core'
            done(error)
        }
    }
}

module.exports = getRemoveMutualsForRelationship 
