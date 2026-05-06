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

const UserDAO = require('../daos/UserDAO')
const UserRelationshipDAO = require('../daos/UserRelationshipDAO')

module.exports = class MutualsService {

    constructor(core) {
        this.core = core

        this.userDAO = new UserDAO(core)
        this.userRelationshipDAO = new UserRelationshipDAO(core)
    }

    async getFriendMap(currentUser, list) {
        // Build a dictionary of users in the target list who are friends of the current user.
        const isFriend = {}
        const targetRelationships = await this.userRelationshipDAO.selectUserRelationships({
            where: `
                user_relationships.status = 'confirmed' AND (
                    ( user_relationships.user_id = $1 AND user_relationships.friend_id = ANY($2::uuid[]))
                    OR ( user_relationships.friend_id = $1 AND user_relationships.user_id = ANY($2::uuid[]))
                )
            `,
            params: [ currentUser.id, list ]})
        for(const id of targetRelationships.list) {
            const relationship = targetRelationships.dictionary[id]
            if ( relationship.userId === currentUser.id ) {
                isFriend[relationship.relationId] = true
            } else {
                isFriend[relationship.userId] = true
            }
        }

        return isFriend
    }

    canCurrentUserViewMutualFriends(user, isFriend) {
        // If the target has "viewMutualFriends" set to 'me', then remove
        // them from the list, because `currentUser` cannot view their
        // mutual friends.
        if ( user.privacyViewMutualFriends === 'me' ) {
            return false 
        }

        // If the target has "viewMutualFriends" set to 'friends', and `currentUser` does not
        // have a friend relationship with them, then remove them from the list.
        if ( user.privacyViewMutualFriends === 'friends' && isFriend === false) { 
            return false
        }

        return true
    }

    async getMutualsForCurrentUserAndList(currentUser, list) {
        const targets = await this.userDAO.selectUsers({
            where: `users.id = ANY($1::uuid[])`,
            params: [ list ],
            fields: 'all'
        })

        const isTargetFriend = await this.getFriendMap(currentUser, list)

        const targetList = list.filter((id) =>  {
            return this.canCurrentUserViewMutualFriends(targets.dictionary[id], (id in isTargetFriend))
        })

        const mutualsResults = await this.core.database.query(`
            SELECT mutuals.current_id, mutuals.mutual_id, mutuals.target_id
                FROM users,
                LATERAL (
                    SELECT 
                            CASE
                                WHEN c.user_id = $1 THEN c.user_id
                                WHEN c.friend_id = $1 THEN c.friend_id
                            END as current_id,
                            CASE 
                                WHEN c.user_id = $1 THEN c.friend_id
                                WHEN c.friend_id = $1 THEN c.user_id
                            END as mutual_id,
                            CASE 
                                WHEN t.user_id = users.id THEN t.user_id
                                WHEN t.friend_id = users.id THEN t.friend_id
                            END as target_id
                        FROM user_relationships c
                        JOIN user_relationships t 
                            ON (c.user_id = $1 AND c.friend_id = t.user_id AND t.friend_id = users.id)
                                OR (c.user_id = $1 AND c.friend_id = t.friend_id AND t.user_id = users.id)
                                OR (c.friend_id = $1 AND c.user_id = t.user_id AND t.friend_id = users.id)
                                OR (c.friend_id = $1 AND c.user_id = t.friend_id AND t.user_id = users.id)
                        WHERE c.status = 'confirmed' AND t.status = 'confirmed'
                ) as mutuals
                WHERE users.id = ANY($2::uuid[])
        `, [ currentUser.id, targetList])

        if ( mutualsResults.rows.length <= 0 ) {
            return { dictionary: {} }
        }

        const mutualIds = mutualsResults.rows.map((r) => r.mutual_id) 

        const mutuals = await this.userDAO.selectUsers({
            where: `users.id = ANY($1::uuid[])`,
            params: [ mutualIds ],
            fields: 'all'
        })

        const isMutualFriend = await this.getFriendMap(currentUser, mutualIds) 
        const visibleMutuals = mutualsResults.rows.filter((row) => {
            return this.canCurrentUserViewMutualFriends(mutuals.dictionary[row.mutual_id], (row.mutual_id in isMutualFriend))
        })

        const dictionary = {}
        for(const row of visibleMutuals) {
            if ( ! ( row.target_id in dictionary ) ) {
                dictionary[row.target_id] = []
            }

            dictionary[row.target_id].push(row.mutual_id)
        }

        return dictionary 
    }

    async hasMutuals(currentUser, userId) {
        const results = await this.core.database.query(`
            SELECT 
                count(*) as count 
                FROM user_relationships c
                JOIN user_relationships t 
                    ON (c.user_id = $1 AND c.friend_id = t.user_id AND t.friend_id = $2)
                        OR (c.user_id = $1 AND c.friend_id = t.friend_id AND t.user_id = $2)
                        OR (c.friend_id = $1 AND c.user_id = t.user_id AND t.friend_id = $2)
                        OR (c.friend_id = $1 AND c.user_id = t.friend_id AND t.user_id = $2)
                WHERE c.status = 'confirmed' AND t.status = 'confirmed'
        `, [ currentUser.id, userId])

        if ( results.rows.length <= 0 ) {
            return false
        }

        if ( results.rows[0].count <= 0 ) {
            return false
        } else if ( results.rows[0].count >= 1 ) {
            return true
        }

        return false
    }


}
