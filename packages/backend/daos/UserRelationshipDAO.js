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

const DAOError = require('../errors/DAOError')
const DAO = require('./DAO')

const DEFAULT_PAGE_SIZE = 200
// Base schema.  We'll modify it with any feature flags in the
// constructor.
const SCHEMA = {
    'UserRelationship': {
        table: 'user_relationships',
        fields: {
            'id': {
                insert: 'primary',
                update: 'allowed',
                select: 'always',
                key: 'userId'
            },
            'user_id': {
                insert: 'required',
                update: 'allowed',
                select: 'always',
                key: 'userId'
            },
            'friend_id': {
                insert: 'required',
                update: 'allowed',
                select: 'always',
                key: 'friendId'
            },
            'status': {
                insert: 'allowed',
                update: 'allowed',
                select: 'always',
                key: 'status'
            },
            'created_date': {
                insert: 'override',
                insertOverride: 'now()',
                update: 'denied',
                select: 'always',
                key: 'createdDate'
            },
            'updated_date': {
                insert: 'override',
                insertOverride: 'now()',
                update: 'override',
                updateOverride: 'now()',
                select: 'always',
                key: 'updatedDate'
            }
        }
    }
}

module.exports = class UserRelationshipDAO extends DAO {

    constructor(core) {
        this.core = core

        this.entityMaps = SCHEMA
    }

    getUserRelationshipSelectionString() {
        return this.getSelectionString('UserRelationship', true)
    }

    hydrateUserRelationship(row) {
        return this.hydrate('UserRelationship', row)
    }

    hydrateUserRelationships(rows) {
        const dictionary = {}
        const list = []

        for( const row of rows ) {
            const userRelationship = this.hydrateUserRelationship(row)

            if ( ! dictionary[userRelationship.id] ) {
                dictionary[userRelationship.id] = userRelationship
                list.push(userRelationship)
            }

            return { dictionary: dictionary, list: list }
        }

    }

    async selectUserRelationships(query) {
        const params = query.params ? [ ...query.params ] : []
        const where = query.where ? `WHERE ${query.where}` : ''
        const order = query.order ? `ORDER BY ${query.order}` : ''

        let paging = ''
        if ( query.page ) {
            const page = query.page ? query.page : 1
            const pageSize = query.pageSize ? query.pageSize : DEFAULT_PAGE_SIZE

            const offset = (page-1) * pageSize
            let count = params.length

            paging = `
                LIMIT $${count+1}
                OFFSET $${count+2}
            `

            params.push(pageSize)
            params.push(offset)
        }

        const sql = `
            SELECT
                ${ this.getUserRelationshipSelectionString() }
            FROM user_relationships
            ${where}
            ${order}
            ${paging}
        `

        const results = await this.core.database.query(sql, params)
        return this.hydrateUsers(results.rows)
    }


    async getUserRelationshipPageMeta(query) {
        const params = query.params ? [ ...query.params ] : []
        const where = query.where ? `WHERE ${query.where}` : ''
        const order = query.order ? `ORDER BY ${query.order}` : ''
        const page = query.page ? query.page : 1
        const pageSize = query.pageSize ? query.pageSize : DEFAULT_PAGE_SIZE

        const results = await this.core.database.query(`
            SELECT
                COUNT(*)
            FROM user_relationship
            ${where}
        `, params)

        const count = results.rows.length <= 0 ? 0 : results.rows[0].count
        return {
            count: count,
            page: page,
            pageSize: pageSize,
            numberOfPages: Math.floor(count / pageSize) + ( (count % pageSize) > 0 ? 1 : 0)
        }
    }

    async insertUserRelationships(userRelationships) {
        await this.insert('UserRelationship', userRelationships)
    }

    async updateUserRelationship(userRelationship) {
        await this.update('UserRelationship', userRelationship)
    }

    async deleteUserRelationship(userRelationship) {
        await this.core.database.query(`
            DELETE FROM user_relationships WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)
        `, [ userRelationship.userId, userRelationship.friendId ])
    }

}
