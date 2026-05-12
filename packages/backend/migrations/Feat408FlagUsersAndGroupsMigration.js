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

        // ========= Add group_id and user_profile_id to the site_moderation table. =====
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

        await this.core.database.query(`CREATE INDEX IF NOT EXISTS site_moderation__group_id ON site_moderation (group_id)`, [])
        await this.core.database.query(`CREATE INDEX IF NOT EXISTS site_moderation__user_profile_id ON site_moderation (user_profile_id)`, [])

        // ======== Add group_id and user_profile_id to the site_moderation_events table. =====
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

        await this.core.database.query(`CREATE INDEX IF NOT EXISTS site_moderation_events__group_id ON site_moderation_events (group_id)`, [])
        await this.core.database.query(`CREATE INDEX IF NOT EXISTS site_moderation_events__user_profile_id ON site_moderation_events (user_profile_id)`, [])

        // ============= Add site_moderation_id to the groups table. ===============
        await this.core.database.query(`
            ALTER TABLE groups
                ADD COLUMN IF NOT EXISTS site_moderation_id uuid
                    REFERENCES site_moderation (id) ON DELETE SET NULL DEFAULT NULL
        ` , [])

        // ============== Add site_moderation_id to the users table. ==============
        await this.core.database.query(`
            ALTER TABLE users
                ADD COLUMN IF NOT EXISTS site_moderation_id uuid
                    REFERENCES site_moderation (id) ON DELETE SET NULL DEFAULT NULL
        `, [])
    }

    async initBack() { 
        await this.core.database.query(`DROP INDEX IF EXISTS site_moderation__group_id`, [])
        await this.core.database.query(`DROP INDEX IF EXISTS site_moderation__user_profile_id`, [])

        await this.core.database.query(`ALTER TABLE site_moderation DROP COLUMN IF EXISTS group_id`, [])
        await this.core.database.query(`ALTER TABLE site_moderation DROP COLUMN IF EXISTS user_profile_id`, [])

        await this.core.database.query(`DROP INDEX IF EXISTS site_moderation_events__group_id`, [])
        await this.core.database.query(`DROP INDEX IF EXISTS site_moderation_events__user_profile_id`, [])

        await this.core.database.query(`ALTER TABLE site_moderation_events DROP COLUMN IF EXISTS group_id`, [])
        await this.core.database.query(`ALTER TABLE site_moderation_events DROP COLUMN IF EXISTS user_profile_id`, [])

        await this.core.database.query(`ALTER TABLE groups DROP COLUMN IF EXISTS site_moderation_id`, [])
        await this.core.database.query(`ALTER TABLE users DROP COLUMN IF EXISTS site_moderation_id`, [])
    }

    async migrateForward(targets) { }

    async migrateBack(targets) { }
}
