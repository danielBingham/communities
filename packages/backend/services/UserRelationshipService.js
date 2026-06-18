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

    /**
     * Get an array of userIds for all the users who have a confirmed friend
     * relationship with User(userId).  This will be an array of the User.id of
     * all of User(userId)'s friends.
     *
     * @param uuid userId The id of the user who we're retrieving friends of.
     *
     * @return uuid[] The User.id of User(userId)'s friends.
     */
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

    /**
     * Get an array of userIds for users that User(userId) has either blocked
     * or been blocked by.
     *
     * @param uuid userId The User.id of the user for whom we want to retrieve
     * blocked user ids.
     *
     * @return uuid[] The ids of the User.id of the users who are either
     * blocked by User(userId) or have blocked User(userId).
     **/
    async getBlockIdsForUser(userId) {
        const blockResults = await this.core.database.query(`
            SELECT user_id, friend_id
                FROM user_relationships
                    WHERE (user_id = $1 OR friend_id = $1) AND status = 'blocked'
        `, [userId])

        const blockIds = blockResults.rows.map((r) => r.user_id == userId ? r.friend_id : r.user_id)
        return blockIds
    }
}
