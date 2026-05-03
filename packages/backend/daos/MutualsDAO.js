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

module.exports = class MutualsDAO {

    constructor(core) {
        this.core = core
    }

    hydrateMutuals(currentUser, rows) {
        const dictionary = { }

        if ( rows.length <= 0 ) {
            return { dictionary: dictionary }
        }

        for(const row of rows) {
            if ( ! ( row.id in dictionary )) {
                dictionary[row.id] = []
            }

            if ( row.current_user_id === currentUser.id ) {
                dictionary[row.id].push(row.current_friend_id)
            } else if ( row.current_friend_id === currentUser.id ) {
                dictionary[row.id].push(row.current_user_id)
            }
        }

        return { dictionary: dictionary }
    }

    async selectMutuals(currentUser, query) {
        let where = query.where ? `WHERE ${query.where}` : ''
        const params = query.params ? [ currentUser.id, ...query.params ] : []

        const results = await this.core.database.query(`
            SELECT users.id, mutuals.current_user_id, mutuals.current_friend_id 
                FROM users, 
                LATERAL (
                    SELECT current.user_id as current_user_id, current.friend_id as current_friend_id FROM user_relationships current
                        JOIN user_relationships target
                            ON (current.user_id = $1 AND current.friend_id = target.user_id AND target.friend_id = users.id)
                                OR (current.user_id = $1 AND current.friend_id = target.friend_id AND target.user_id = users.id)
                                OR (current.friend_id = $1 AND current.user_id = target.user_id AND target.friend_id = users.id)
                                OR (current.friend_id = $1 AND current.user_id = target.friend_id AND target.user_id = users.id)
                            
                        ) as mutuals
                ${where}
        `, params)

        if ( results.rows.length <= 0 ) {
            return { dictionary: {} }
        }

        return this.hydrateMutuals(currentUser, results.rows)
    }
}

