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

module.exports = class Feat408FlagProfilesAndGroups extends BaseMigration {

    constructor(core) {
        super(core)
    }

    async initForward() {
        await this.core.database.query(
            `ALTER TABLE site_moderation 
                ADD COLUMN IF NOT EXISTS group_id uuid 
                    REFERENCES groups (id) ON DELETE CASCADE DEFAULT NULL`
        , [])

        await this.core.database.query(
            `ALTER TABLE site_moderation
                ADD COLUMN IF NOT EXISTS user_profile_id uuid 
                    REFERENCES users (id) ON DELETE CASCADE DEFAULT NULL`
        , [])

        await this.core.database.query(
            `ALTER TABLE site_moderation_events
                ADD COLUMN IF NOT EXISTS group_id uuid 
                    REFERENCES groups (id) ON DELETE CASCADE DEFAULT NULL`
        , [])

        await this.core.database.query(
            `ALTER TABLE site_moderation_events
                ADD COLUMN IF NOT EXISTS user_profile_id uuid 
                    REFERENCES users (id) ON DELETE CASCADE DEFAULT NULL`
        , [])
    }

    async initBack() { 
        await this.core.database.query(`ALTER TABLE site_moderation DROP COLUMN IF EXISTS group_id`, [])
        await this.core.database.query(`ALTER TABLE site_moderation DROP COLUMN IF EXISTS user_profile_id`, [])

        await this.core.database.query(`ALTER TABLE site_moderation_events DROP COLUMN IF EXISTS group_id`, [])
        await this.core.database.query(`ALTER TABLE site_moderation_events DROP COLUMN IF EXISTS user_profile_id`, [])
    }

    async migrateForward(targets) { }

    async migrateBack(targets) { }
}
