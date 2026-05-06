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

module.exports = class Feat491MutualFriendsMigration extends BaseMigration {

    constructor(core) {
        super(core)
    }

    async initForward() {
        await this.core.database.query(`CREATE TYPE user_privacy AS ENUM('me', 'friends', 'friends-of-friends', 'public')`, [])

        await this.core.database.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy__view_friends user_privacy DEFAULT 'friends'`, [])
        await this.core.database.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy__view_mutual_friends user_privacy DEFAULT 'friends-of-friends'`, [])
    }

    async initBack() { 
        await this.core.database.query(`ALTER TABLE users DROP COLUMN IF EXISTS privacy__view_friends`, [])
        await this.core.database.query(`ALTER TABLE users DROP COLUMN IF EXISTS privacy__view_mutual_friends`, [])

        await this.core.database.query(`DROP TYPE IF EXISTS user_privacy`, [])
    }

    async migrateForward(targets) { 
        await this.core.database.query(`UPDATE users SET privacy__view_friends = 'friends' WHERE (users.settings#>>'{showFriendsOnProfile}')::boolean = TRUE`, [])
        await this.core.database.query(`UPDATE users SET privacy__view_friends = 'friends' WHERE (users.settings#>>'{showFriendsOnProfile}')::boolean IS NULL`, [])
        await this.core.database.query(`UPDATE users SET privacy__view_friends = 'me' WHERE (users.settings#>>'{showFriendsOnProfile}')::boolean = FALSE`, [])

        // Initialize the materialized view of mutual friends.
        await this.core.database.query(`
 CREATE TABLE IF NOT EXISTS mutuals AS SELECT 
        current.id as current_id, 
        current.privacy__view_mutual_friends as current_privacy__view_mutual_friends, 
        target.id as target_id, 
        target.privacy__view_mutual_friends as target_privacy__view_mutual_friends,
        target_relationship.is_friend as target_is_friend, 
        mutuals.id as mutual_id,
        mutual.privacy__view_mutual_friends as mutual_privacy__view_mutual_friends
    FROM users current,
    users target,
    LATERAL (
        SELECT count(*) > 0 as is_friend
            FROM user_relationships
                WHERE (user_id = current.id AND friend_id = target.id) OR (user_id = current.id AND friend_id = target.id)
    ) as target_relationship,
    LATERAL (
        SELECT CASE 
                    WHEN c.user_id = current.id THEN c.friend_id
                    WHEN c.friend_id = current.id THEN c.user_id
                END as id
            FROM user_relationships c 
            JOIN user_relationships t 
                ON (c.user_id = current.id AND c.friend_id = t.user_id AND t.friend_id = target.id)
                    OR (c.user_id = current.id AND c.friend_id = t.friend_id AND t.user_id = target.id)
                    OR (c.friend_id = current.id AND c.user_id = t.user_id AND t.friend_id = target.id)
                    OR (c.friend_id = current.id AND c.user_id = t.friend_id AND t.user_id = target.id)
            WHERE c.status = 'confirmed' AND t.status = 'confirmed'
    ) as mutuals
    JOIN users mutual ON mutuals.id = mutual.id
        `, [])

    }

    async migrateBack(targets) { 
        await this.core.database.query(`DROP TABLE IF EXISTS mutuals`, [])

    }
}
