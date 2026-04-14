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

module.exports = class Feat292TrackUserActivityMigration extends BaseMigration {

    constructor(core) {
        super(core)
    }

    async initForward() {
        await this.core.database.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS activity_date timestamptz`, [])

        await this.core.database.query(`
CREATE TABLE daily_active_users (
    year int,
    month int,
    day int,
    users int
)
        `, [])

        await this.core.database.query(`
CREATE TABLE weekly_active_users (
    year int,
    week int,
    users int
)
        `, [])

        await this.core.database.query(`
CREATE TABLE monthly_active_users (
    year int,
    month int,
    users int
)
        `, [])

    }

    async initBack() { 
        await this.core.database.query(`ALTER TABLE users DROP COLUMN IF EXISTS activity_date timestamptz`, [])

        await this.core.database.query(`DROP TABLE IF EXISTS daily_active_users`, [])
        await this.core.database.query(`DROP TABLE IF EXISTS weekly_active_users`, [])
        await this.core.database.query(`DROP TABLE IF EXISTS monthly_active_users`, [])
    }

    async migrateForward(targets) {
        await this.core.database.query(`
            UPDATE users SET activity_date = last_authentication_attempt_date
        `, [])
    }

    async migrateBack(targets) { }
}
