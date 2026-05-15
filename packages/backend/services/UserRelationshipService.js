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

module.exports = class UserRelationshipService {

    constructor(core) {
        this.core = core
    }

    async getFriendIdsForUser(userId) {
        const friendResults = await this.core.database.query(`
            SELECT
                CASE
                    WHEN user_id = $1 THEN friend_id
                    WHEN friend_id = $1 THEN user_id
                END AS friend_id
            FROM user_relationships WHERE status = 'confirmed' AND (user_id = $1 OR friend_id = $1)
        `, [ userId ])

        if ( friendResults.rows.length <= 0 ) {
            return []
        }

        const friendIds = friendResults.rows.map((r) => r.friend_id)
        return friendIds
    }
}
