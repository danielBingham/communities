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
    }

    async migrateBack(targets) { }
}
