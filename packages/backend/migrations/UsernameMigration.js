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

module.exports = class UsernameMigration extends BaseMigration {

    constructor(core) {
        super(core)
    }

    async initForward() {}

    async initBack() { }

    // ***WARNING***: This is a potentially destructive migration.  We need to
    // test it up the wazoo.
    async migrateForward(targets) { 
        const usernameResults = await this.core.database.query(`SELECT id, username FROM users`, [])

        for(const row of usernameResults.rows) {
            let username = row.username

            // Clean out any invalid characters.
            username = username.replace(/[^a-zA-Z0-9\.\-_]/g, "")

            // Replace periods with dashes.
            username = username.replace(".", "-")

            username = username.trim()

            // If the username changed, update it.
            if ( username !== row.username ) {
                // If the resulting username is taken, then start adding numbers to
                // it until we find one that isn't taken.
                const existingResults = await this.core.database.query(`SELECT id, username FROM users WHERE username = $1`, [ username ])
                if ( existingResults.rows.length > 0 ) {
                    for(let index = 1;; index++) {
                        const indexedUsername = username + index
                        const indexedResults = await this.core.database.query(`SELECT id, username FROM users WHERE username = $1`, [ indexedUsername ])

                        if ( indexedResults.rows.length <= 0 ) {
                            username = indexedUsername
                            break
                        }
                    }
                }

                await this.core.database.query(`UPDATE users SET username = $1 WHERE id = $2`, [ username, row.id ])
            }
        }


    }

    async migrateBack(targets) { }
}
