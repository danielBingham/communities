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

module.exports = class Feat484FindActiveGroupsMigration extends BaseMigration {

    constructor(core) {
        super(core)
    }

    async initForward() {
        await this.core.database.query(`ALTER TABLE groups ADD COLUMN IF NOT EXISTS total_members int DEFAULT 1`, [])
        await this.core.database.query(`ALTER TABLE groups ADD COLUMN IF NOT EXISTS total_posts int DEFAULT 0`, [])
        await this.core.database.query(`ALTER TABLE groups ADD COLUMN IF NOT EXISTS most_recent_post_date timestamptz`, [])
    }

    async initBack() { 
        await this.core.database.query(`ALTER TABLE groups DROP COLUMN IF EXISTS total_members`, [])
        await this.core.database.query(`ALTER TABLE groups DROP COLUMN IF EXISTS total_posts`, [])
        await this.core.database.query(`ALTER TABLE groups DROP COLUMN IF EXISTS most_recent_post_date`, [])

    }

    async migrateForward(targets) {
        const groupIdResults = await this.core.database.query(`SELECT id FROM groups`, [])
        for(const row of groupIdResults.rows) {
            const memberCountResults = await this.core.database.query(`SELECT count(*) as count FROM group_members WHERE group_members.group_id = $1`, [ row.id ])
            const memberCount = memberCountResults.rows[0].count

            const postCountResults = await this.core.database.query(`SELECT count(*) as count FROM posts WHERE posts.group_id = $1`, [ row.id ])
            const postCount = postCountResults.rows[0].count

            const mostRecentPostResults = await this.core.database.query(`SELECT posts.created_date FROM posts WHERE posts.group_id = $1 ORDER BY created_date desc LIMIT 1`, [ row.id ])

            let mostRecentPost = null
            if ( mostRecentPostResults.rows.length > 0 ) {
                mostRecentPost = mostRecentPostResults.rows[0].created_date
            }

            await this.core.database.query(`
                UPDATE groups SET total_members = $1, total_posts = $2, most_recent_post_date = $3 WHERE id = $4
             `, [ memberCount, postCount, mostRecentPost, row.id ])
        }
    }

    async migrateBack(targets) { 
        const groupIdResults = await this.core.database.query(`SELECT id FROM groups`, [])
        for(const row of groupIdResults.rows) {
            await this.core.database.query(` 
                UPDATE groups SET total_members = 1, total_posts = 0, most_recent_post_date = NULL WHERE id = $1
            `, [ row.id ])
        }
    }
}
