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

module.exports = class LimitLoginAttemptsMigration extends BaseMigration {

    constructor(core) {
        super(core)
    }

    async initForward() { 
        await this.database.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_authentication_attempts int DEFAULT 0`, [])
        await this.database.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_authentication_attempt_date timestamptz`, [])
    }

    async initBack() { 
        await this.database.query(`ALTER TABLE users DROP COLUMN IF EXISTS failed_authentication_attempts`, [])
        await this.database.query(`ALTER TABLE users DROP COLUMN IF EXISTS last_authentication_attempt_date`, [])
    }

    async migrateForward(targets) {}

    async migrateBack(targets) {}
}
