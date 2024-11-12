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
const FileDAO = require('./FileDAO')

const PAGE_SIZE = 20

module.exports = class UserDAO extends DAO {


    constructor(core) {
        super(core)
        this.core = core

        this.database = core.database
        this.logger = core.logger

        this.entityMaps = {
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
                        insert: 'required',
                        update: 'denied',
                        select: 'always',
                        key: 'name',
                    },
                    'display_name': {
                        insert: 'required',
                        update: 'allowed',
                        select: 'always',
                        key: 'displayName'
                    },
                    'email': {
                        insert: 'required',
                        update: 'allowed',
                        select: 'full',
                        key: 'email'
                    },
                    'password': {
                        insert: 'required',
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
    async selectUsers(where, params, order, page, clean) {
        params = params ? params : []
        where = where ? where : ''
        order = order ? order : 'users.created_date desc'

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

        const results = await this.database.query(sql, params)
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

        const results = await this.database.query(sql, params)

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
}
