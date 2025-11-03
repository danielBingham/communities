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

module.exports = class GroupSearchMigration extends BaseMigration {

    constructor(core) {
        super(core)
    }

    async initForward() { 
        await this.database.query(`CREATE INDEX IF NOT EXISTS groups_title ON groups (title)`, [])
        await this.database.query(`CREATE INDEX IF NOT EXISTS groups_title_trgm ON groups USING GIN (title gin_trgm_ops)`, [])
    }

    async initBack() { 
        await this.database.query(`DROP INDEX IF EXISTS groups_title`, [])
        await this.database.query(`DROP INDEX IF EXISTS groups_title_trgm`, [])
    }

    async migrateForward(targets) {}

    async migrateBack(targets) {}
}
