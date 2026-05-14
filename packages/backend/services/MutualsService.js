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

const UserRelationshipService = require('./UserRelationshipService')

module.exports = class MutualsService {

    constructor(core) {
        this.core = core

        this.userDAO = new UserDAO(core)
        this.userRelationshipDAO = new UserRelationshipDAO(core)

        this.userRelationshipService = new UserRelationshipService(core)
    }

    async getMutualsForCurrentUserAndList(currentUser, list) {
        const results = await this.core.database.query(`
            SELECT 
                mutual_relationships.target_id as target_id,
                mutual_relationships.mutual_id as mutual_id
            FROM mutual_relationships
                LEFT OUTER JOIN users mutual ON mutual_relationships.mutual_id = mutual.id
                LEFT OUTER JOIN users target ON mutual_relationships.target_id = target.id
                LEFT OUTER JOIN user_relationships ON 
                    (mutual_relationships.current_id = user_relationships.user_id AND mutual_relationships.target_id = user_relationships.friend_id and user_relationships.status = 'confirmed')
                    OR (mutual_relationships.current_id = user_relationships.friend_id AND mutual_relationships.target_id = user_relationships.user_id and user_relationships.status = 'confirmed')
            WHERE 
                mutual_relationships.current_id = $1 
                AND mutual_relationships.target_id = ANY($2::uuid[])
                AND mutual.privacy__view_mutual_friends != 'me'
                AND ( 
                    ( target.privacy__view_mutual_friends = 'friends' AND user_relationships.id IS NOT NULL)
                    OR target.privacy__view_mutual_friends = 'friends-of-friends'
                    OR target.privacy__view_mutual_friends = 'public'
                )
        `, [currentUser.id, list])

        if ( results.rows.length <= 0 ) {
            return {}
        }

        const dictionary = {}
        for(const row of results.rows) {
            if ( ! ( row.target_id in dictionary) ) {
                dictionary[row.target_id] = []
            }

            dictionary[row.target_id].push(row.mutual_id)
        }

        return dictionary
    }

    async hasMutuals(currentUser, userId) {
        const results = await this.core.database.query(`
            SELECT mutual_id FROM mutual_relationships WHERE current_id = $1 AND target_id = $2
        `, [ currentUser.id, userId ])

        if ( results.rows.length > 0 ) {
            return true
        }

        return false
    }

    async addMutualsForRelationship(userRelationship) {
        // `userRelationship` is already confirmed and we don't necessarily
        // want a row pointing back to the relationship itself.
        const userFriendIds = (await this.userRelationshipService.getFriendIdsForUser(userRelationship.userId)).filter((id) => id !== userRelationship.relationId)
        const relationFriendIds = (await this.userRelationshipService.getFriendIdsForUser(userRelationship.relationId)).filter((id) => id !== userRelationship.userId)

        let query = ''
        let params = []

        //
        // All of user's friends gain user as a mutual with relation.
        //
        if ( userFriendIds.length > 0 ) {
            query = `INSERT INTO mutual_relationships (current_id, mutual_id, target_id ) VALUES `
            params = []
            for(const friendId of userFriendIds) {
                query += `($${params.length+1}, $${params.length+2}, $${params.length+3}),`
                params.push(friendId, userRelationship.userId, userRelationship.relationId)
            }
            // Strip off the last comma.
            query = query.substring(0,query.length-1)
            query += ` ON CONFLICT DO NOTHING`
            await this.core.database.query(query, params)
        }

        //
        // All of relation's friends gain relation as a mutual with user.
        //
        if ( relationFriendIds.length > 0 ) {
            query = `INSERT INTO mutual_relationships (current_id, mutual_id, target_id ) VALUES `
            params = []
            for(const friendId of relationFriendIds) {
                query += `($${params.length+1}, $${params.length+2}, $${params.length+3}),`
                params.push(friendId, userRelationship.relationId, userRelationship.userId)
            }
            // Strip off the last comma.
            query = query.substring(0,query.length-1)
            query += ` ON CONFLICT DO NOTHING`
            await this.core.database.query(query, params)
        }

        //
        // Relation gains user as a mutual with all of user's friends.
        //
        if ( userFriendIds.length > 0 ) {
            query = `INSERT INTO mutual_relationships (current_id, mutual_id, target_id ) VALUES `
            params = []
            for(const friendId of userFriendIds) {
                query += `($${params.length+1}, $${params.length+2}, $${params.length+3}),`
                params.push(userRelationship.relationId, userRelationship.userId, friendId)
            }
            // Strip off the last comma.
            query = query.substring(0,query.length-1)
            query += ` ON CONFLICT DO NOTHING`
            await this.core.database.query(query, params)
        }

        //
        // User gains relation as a mutual with all of relation's friends.
        //
        if ( relationFriendIds.length > 0 ) {
            query = `INSERT INTO mutual_relationships (current_id, mutual_id, target_id ) VALUES `
            params = []
            for(const friendId of relationFriendIds) {
                query += `($${params.length+1}, $${params.length+2}, $${params.length+3}),`
                params.push(userRelationship.userId, userRelationship.relationId, friendId)
            }
            // Strip off the last comma.
            query = query.substring(0,query.length-1)
            query += ` ON CONFLICT DO NOTHING`
            await this.core.database.query(query, params)
        }
    }

    async removeMutualsForRelationship(userRelationship) {
        // All of user's friends lose user as a mutual with relation.
        await this.core.database.query(`
            DELETE FROM mutual_relationships WHERE mutual_id = $1 AND target_id = $2
        `, [ userRelationship.userId, userRelationship.relationId ])

        // All of relation's friends lose relation as a mutual with user.
        await this.core.database.query(`
            DELETE FROM mutual_relationships WHERE mutual_id = $1 AND target_id = $2
        `, [ userRelationship.relationId, userRelationship.userId])

        // Relation loses user as a mutual with all of user's friends.
        await this.core.database.query(`
            DELETE FROM mutual_relationships WHERE current_id = $1 AND mutual_id = $2
        `, [ userRelationship.relationId, userRelationship.userId ])


        // User loses relation as a mutual with all of relation's friends.
        await this.core.database.query(`
            DELETE FROM mutual_relationships WHERE current_id = $1 AND mutual_id = $2
        `, [ userRelationship.userId, userRelationship.relationId ])

    }


}
