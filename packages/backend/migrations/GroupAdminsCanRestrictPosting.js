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

module.exports = class GroupModeratorsCanBanUsers extends BaseMigration {

    constructor(core) {
        super(core)
    }

    async initForward() { 
        await this.database.query(`CREATE TYPE group_post_permissions as ENUM('anyone', 'members', 'approval', 'restricted')`, [])
        await this.database.query(`ALTER TABLE groups ADD COLUMN IF NOT EXISTS post_permissions group_post_permissions DEFAULT 'members'`, [])
    }

    async initBack() { 
        await this.database.query(`ALTER TABLE groups DROP COLUMN IF EXISTS post_permissions`, [])
        await this.database.query(`DROP TYPE IF EXISTS group_post_permissions`, [])
    }

    async migrateForward(targets) {
        await this.database.query(`UPDATE groups SET post_permissions = 'members'`, [])
    }

    async migrateBack(targets) {}
}
