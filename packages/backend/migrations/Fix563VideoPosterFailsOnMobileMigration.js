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

module.exports = class Fix563VideoPosterFailsOnMobileMigration extends BaseMigration {

    constructor(core) {
        super(core)
    }

    async initForward() {
        await this.core.database.query(`CREATE INDEX IF NOT EXISTS files__thumb_id ON files (thumb_id)`, [])
    }

    async initBack() {
        await this.core.database.query(`DROP INDEX IF EXISTS files__thumb_id`, [])
    }

    async migrateForward(targets) { }

    async migrateBack(targets) { }
}
