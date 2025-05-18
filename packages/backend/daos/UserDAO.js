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

const PAGE_SIZE = 20


// Base schema.  We'll modify it with any feature flags in the
// constructor.
const SCHEMA = {
    'User': {
        table: 'users',
        fields: {
            'id': {
                insert: 'primary',
                update: 'primary',
                select: 'always',
                key: 'id'
            },
            'file_id': {
                insert: 'allowed',
                update: 'allowed',
                select: 'always',
                key: 'fileId'
            },
            'name': {
                insert: 'allowed',
                update: 'allowed',
                select: 'always',
                key: 'name',
            },
            'username': {
                insert: 'allowed',
                update: 'allowed',
                select: 'always',
                key: 'username'
            },
            'email': {
                insert: 'required',
                update: 'allowed',
                select: 'request',
                key: 'email'
            },
            'password': {
                insert: 'allowed',
                update: 'allowed',
                select: 'never',
                key: 'password'
            },
            'status': {
                insert: 'allowed',
                update: 'allowed',
                select: 'request',
                key: 'status'
            },
            'permissions': {
                insert: 'denied',
                update: 'denied',
                select: 'request',
                key: 'permissions'
            },
            'settings': {
                needsFeature: '1-notification-settings',
                insert: 'allowed',
                insertDefault: function() {
                    return {
                        notifications: {
                            'Post:comment:create': {
                                email: true,
                                push: true,
                                web: true
                            },
                            'Post:comment:create:subscriber': {
                                email: true,
                                push: true,
                                web: true
                            },
                            'User:friend:create': {
                                email: true,
                                push: true,
                                web: true
                            },
                            'User:friend:update': {
                                email: true,
                                push: true,
                                web: true
                            }
                        }
                    }
                },
                update: 'allowed',
                select: 'request',
                key: 'settings'
            },
            'notices': {
                needsFeature: '3-notices',
                insert: 'allowed',
                insertDefault: function() {
                    return {}
                },
                update: 'allowed',
                select: 'request',
                key: 'notices'
            },
            'about': {
                insert: 'allowed',
                update: 'allowed',
                select: 'always',
                key: 'about'
            },
            'location': {
                insert: 'allowed',
                update: 'allowed',
                select: 'request',
                key: 'location'
            },
            'invitations': {
                insert: 'allowed',
                insertDefault: function() {
                    return 50
                },
                update: 'allowed',
                select: 'request',
                key: 'invitations'
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

module.exports = class UserDAO extends DAO {


    constructor(core) {
        super(core)
        this.core = core

        this.entityMaps = SCHEMA 
    }

    getUserSelectionString(fields) {
        return this.getSelectionString('User', fields)
    }

    hydrateUser(row) {
        return this.hydrate('User', row)
    }

    /**
     * Translate the database rows returned by our queries into objects.
     *
     * @param {Object[]}    rows    An array of rows returned from the database.
     *
     * @return {Object}     The users parsed into a dictionary keyed using user.id. 
     */
    hydrateUsers(rows) {
        // Users
        const dictionary = {}
        const list = []

        for( const row of rows ) {
            const user = this.hydrateUser(row)

            if ( ! dictionary[user.id] ) {
                dictionary[user.id] = user
                list.push(user.id)
            }
        }


        return { dictionary: dictionary, list: list } 
    }

    async getUserById(id, fields) {
        const results = await this.selectUsers({
            where: 'users.id = $1', 
            params: [ id ], 
            fields: fields
        })

        if ( results.list.length <= 0 ) {
            return null
        }

        return results.dictionary[id]
    }

    /**
     * Retrieve user records from the database.
     *
     */
    async selectUsers(query) {
        let where = query.where ? `WHERE ${query.where}` : ''
        const params = query.params ? [ ...query.params ] : []
        let order = query.order ? `${query.order}` : 'users.created_date desc'
        const fields = query.fields ? query.fields : []

        // We only want to include the paging terms if we actually want paging.
        // If we're making an internal call for another object, then we
        // probably don't want to have to deal with pagination.
        let paging = ''
        if ( 'page' in query ) {
            let page = query.page !== null && query.page !== undefined ? query.page : 1
            
            const offset = (page-1) * PAGE_SIZE
            let count = params.length 

            paging = `
                LIMIT $${count+1}
                OFFSET $${count+2}
            `

            params.push(PAGE_SIZE)
            params.push(offset)
        }

        const sql = `
                SELECT 
                    ${this.getUserSelectionString(fields)}
                FROM users
                ${where} 
                ORDER BY ${order} 
                ${paging}
        `

        const results = await this.core.database.query(sql, params)
        return this.hydrateUsers(results.rows)
    }

    async countUsers(query) {
        let where = query.where ? `WHERE ${query.where}` : ''
        const params = query.params ? [ ...query.params ] : []

        const sql = `
               SELECT 
                 COUNT(users.id) as count
                FROM users 
                ${where} 
        `

        const results = await this.core.database.query(sql, params)

        if ( results.rows.length <= 0) {
            return {
                count: 0,
                page: query.page ? query.page : 1,
                pageSize: PAGE_SIZE,
                numberOfPages: 1
            }
        }

        const count = results.rows[0].count
        return {
            count: count,
            page: query.page ? query.page : 1,
            pageSize: PAGE_SIZE,
            numberOfPages: parseInt(count / PAGE_SIZE) + ( count % PAGE_SIZE > 0 ? 1 : 0) 
        }
    }

    async insertUsers(users) {
        await this.insert('User', users)
    }

    async updateUser(user) {
        await this.update('User', user)
    }

    async deleteUser(user) {
        await this.core.database.query(`
            DELETE FROM users WHERE id = $1
        `, [ user.id ])
    }
}
