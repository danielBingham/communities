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

module.exports = class LoggingMigration extends BaseMigration {

    constructor(core) {
        super(core)
    }

    async initForward() { 
        await this.core.database.query(`CREATE TYPE log_levels as ENUM('error', 'warn', 'info', 'debug', 'verbose', 'silly')`, [])
        await this.core.database.query(`CREATE TYPE log_platform as ENUM('web', 'ios', 'android', 'server', 'worker')`, [])
        await this.core.database.query(`CREATE TABLE IF NOT EXISTS logs (
            id uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
            level log_levels DEFAULT 'info',
            platform log_platform DEFAULT 'server',

            trace_id uuid NOT NULL,
            user_id uuid REFERENCES users (id) ON DELETE SET NULL DEFAULT NULL,
            session_id text DEFAULT NULL,

            method text DEFAULT NULL,
            endpoint text DEFAULT NULL,

            message text DEFAULT ''
        )`, [])
    }

    async initBack() { 
        await this.core.database.query(`DROP TYPE log_levels`, [])
        await this.core.database.query(`DROP TYPE log_platform`, [])
        await this.core.database.qeury(`DROP TABLE IF EXISTS logs`, [])
    }

    async migrateForward(targets) { }

    async migrateBack(targets) { }
}
