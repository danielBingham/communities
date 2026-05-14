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

const getAddMutualsForRelationship = function(core) {
    return async function(job, done) {
        core.logger.id = `Add Mutuals for Relationship: ${job.id}`

        const currentUser = job.data.session.user
        const relationship = job.data.relationship

        core.logger.info(`Beginning job 'add-mutuals-for-relationship' for User(${currentUser.id}) and Relationship(${relationship.id}).`)
        try {
            const mutualsService = new MutualsService(core)
            await mutualsService.addMutualsForRelationship(relationship)
        } catch (error) {
            core.logger.error(error)
        }
        core.logger.info(`Finishing job 'add-mutuals-for-relationship' for User(${currentUser.id}) and Relationship(${relationship.id}).`)
    }
}

module.exports = getAddMutualsForRelationship 
