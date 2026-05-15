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
const BaseMigration = require('./BaseMigration')

const UserRelationshipDAO = require('../daos/UserRelationshipDAO')
const MutualsService = require('../services/MutualsService')

module.exports = class Fix495SlowFriendsListMigration extends BaseMigration {

    constructor(core) {
        super(core)

        this.userRelationshipDAO = new UserRelationshipDAO(core)

        this.mutualsService = new MutualsService(core)
    }

    async initForward() { 
        await this.core.database.query(`
CREATE TABLE IF NOT EXISTS mutual_relationships (
    current_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    target_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    mutual_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (current_id, target_id, mutual_id)
)
        `, [])

        await this.core.database.query(`CREATE INDEX IF NOT EXISTS mutual_relationships__current_id ON mutual_relationships (current_id)`, [])
        await this.core.database.query(`CREATE INDEX IF NOT EXISTS mutual_relationships__target_id ON mutual_relationships (target_id)`, [])
        await this.core.database.query(`CREATE INDEX IF NOT EXISTS mutual_relationships__mutual_id ON mutual_relationships (mutual_id)`, [])
    }

    async initBack() { 
        await this.core.database.query(`DROP INDEX IF EXISTS mutual_relationships__current_id`, [])
        await this.core.database.query(`DROP INDEX IF EXISTS mutual_relationships__target_id`, [])
        await this.core.database.query(`DROP INDEX IF EXISTS mutual_relationships__mutual_id`, [])

        await this.core.database.query(`DROP TABLE IF EXISTS mutual_relationships`, [])
    }

    async migrateForward(targets) { 
        const relationshipResults = await this.userRelationshipDAO.selectUserRelationships({ 
            where: `user_relationships.status = $1`,
            params: ['confirmed']
        })
        for(const [id, relationship] of Object.entries(relationshipResults.dictionary)) {
            await this.mutualsService.addMutualsForRelationship(relationship)
        }
    }

    async migrateBack(targets) { 
        await this.core.database.query(`DELETE FROM mutual_relationships`)
    }
}
