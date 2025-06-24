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

module.exports = class GroupModerationMigration extends BaseMigration {

    constructor(core) {
        super(core)
    }

    async initForward() { 
        await this.database.query(`CREATE TYPE group_moderation_status AS ENUM('flagged', 'approved', 'rejected')`, [])

        await this.database.query(`
            CREATE TABLE IF NOT EXISTS group_moderation (
                id uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
                user_id uuid REFERENCES users (id) ON DELETE SET NULL,

                status group_moderation_status NOT NULL DEFAULT 'flagged',
                reason text,

                post_id uuid REFERENCES posts (id) ON DELETE CASCADE DEFAULT NULL ,
                post_comment_id uuid REFERENCES post_comments (id) ON DELETE CASCADE DEFAULT NULL, 

                created_date timestamptz, 
                updated_date timestamptz
            )
        `, [])

        await this.database.query(`CREATE INDEX IF NOT EXISTS group_moderation__user_id ON group_moderation (user_id)`, [])
        await this.database.query(`CREATE INDEX IF NOT EXISTS group_moderation__post_id ON group_moderation (post_id)`, [])
        await this.database.query(`CREATE INDEX IF NOT EXISTS group_moderation__post_comment_id ON group_moderation (post_comment_id)`, [])

        await this.database.query(`
            CREATE TABLE IF NOT EXISTS group_moderation_events (
                id uuid PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
                group_moderation_id uuid REFERENCES group_moderation (id) ON DELETE SET NULL,
                user_id uuid REFERENCES users (id) ON DELETE SET NULL,

                status group_moderation_status NOT NULL,
                reason text,

                post_id uuid REFERENCES posts(id) ON DELETE CASCADE DEFAULT NULL,
                post_comment_id uuid REFERENCES post_comments(id) ON DELETE CASCADE DEFAULT NULL,

                created_date timestamptz
            )
        `, [])
        await this.database.query(`CREATE INDEX IF NOT EXISTS group_moderation_events__group_moderation_id ON group_moderation_events (group_moderation_id)`, [])
        await this.database.query(`CREATE INDEX IF NOT EXISTS group_moderation_events__user_id ON group_moderation_events (user_id)`, [])
        await this.database.query(`CREATE INDEX IF NOT EXISTS group_moderation_events__post_id ON group_moderation_events (post_id)`, [])
        await this.database.query(`CREATE INDEX IF NOT EXISTS group_moderation_events__post_comment_id ON group_moderation_events (post_comment_id)`, [])
    }

    async initBack() { 
        await this.database.query(`DROP INDEX IF EXISTS group_moderation_events__post_comment_id`, [])
        await this.database.query(`DROP INDEX IF EXISTS group_moderation_events__post_id`, [])
        await this.database.query(`DROP INDEX IF EXISTS group_moderation_events__user_id`, [])
        await this.database.query(`DROP INDEX IF EXISTS group_moderation_events__group_moderation_id`, [])

        await this.database.query(`DROP TABLE IF EXISTS group_moderation_events`, [])

        await this.database.query(`DROP INDEX IF EXISTS group_moderation__post_comment_id`, [])
        await this.database.query(`DROP INDEX IF EXISTS group_moderation__post_id`, [])
        await this.database.query(`DROP INDEX IF EXISTS group_moderation_user_id`, [])

        await this.database.query(`DROP TABLE IF EXISTS group_moderation`, [])

        await this.database.query(`DROP TYPE group_moderation_status`, [])
    }

    async migrateForward(targets) {}

    async migrateBack(targets) {}
}
