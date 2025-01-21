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
                select: 'full',
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
                select: 'full',
                key: 'status'
            },
            'permissions': {
                insert: 'denied',
                update: 'denied',
                select: 'full',
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
                select: 'full',
                key: 'settings'
            },
            'notices': {
                needsFeature: '3-notices',
                insert: 'allowed',
                insertDefault: function() {
                    return {}
                },
                update: 'allowed',
                select: 'full',
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
                select: 'full',
                key: 'location'
            },
            'invitations': {
                insert: 'allowed',
                insertDefault: function() {
                    return 50
                },
                update: 'allowed',
                select: 'full',
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

    getUserSelectionString() {
        return this.getSelectionString('User', true)
    }

    getCleanUserSelectionString() {
        return this.getSelectionString('User', false)
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

    async getUserById(id, clean) {
        const results = await this.selectUsers('WHERE users.id = $1', [ id ], '', null, clean)

        if ( results.list.length <= 0 ) {
            return null
        }

        return results.dictionary[id]
    }

    /**
     * Get users with any sensitive data cleaned out of the record.  This
     * method should be used any time we plan to return the users from the
     * backend.
     *
     * @see this.selectUsers()
     */
    async selectCleanUsers(where, params, order, page) {
        return await this.selectUsers(where, params, order, page, true)
    }

    /**
     * Retrieve user records from the database.
     *
     */
    async selectUsers(whereStatement, parameters, orderStatement, page, clean) {
        const params = parameters ? [ ...parameters ] : []
        let where = whereStatement ? whereStatement : ''
        let order = orderStatement ? orderStatement : 'users.created_date desc'

        // We only want to include the paging terms if we actually want paging.
        // If we're making an internal call for another object, then we
        // probably don't want to have to deal with pagination.
        let paging = ''
        if ( page ) {
            page = page ? page : 1
            
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
                    ${ clean === true ? this.getCleanUserSelectionString(): this.getUserSelectionString()}
                FROM users
                ${where} 
                ORDER BY ${order} 
                ${paging}
        `

        console.log(sql)
        console.log(params)
        const results = await this.core.database.query(sql, params)
        return this.hydrateUsers(results.rows)
    }

    async countUsers(where, params, page) {
        params = params ? params : []
        where = where ? where : ''

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
                page: page ? page : 1,
                pageSize: PAGE_SIZE,
                numberOfPages: 1
            }
        }

        const count = results.rows[0].count
        return {
            count: count,
            page: page ? page : 1,
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
