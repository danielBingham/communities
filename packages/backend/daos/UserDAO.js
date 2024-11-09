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
const FileDAO = require('./FileDAO')

const PAGE_SIZE = 20

module.exports = class UserDAO {


    constructor(core) {
        this.core = core

        this.database = core.database
        this.logger = core.logger

        this.fileDAO = new FileDAO(core)

        this.fieldMap = {
            'id': {
                insert: 'allowed',
                update: 'primary',
                key: 'id'
            },
            'name': {
                insert: 'required',
                update: 'denied',
                key: 'name',
            },
            'display_name': {
                insert: 'required',
                update: 'allowed',
                key: 'displayName'
            },
            'email': {
                insert: 'required',
                update: 'allowed',
                key: 'email'
            },
            'password': {
                insert: 'required',
                update: 'allowed',
                key: 'password'
            },
            'status': {
                insert: 'allowed',
                update: 'allowed',
                key: 'status'
            },
            'permissions': {
                insert: 'denied',
                update: 'denied',
                key: 'permissions'
            },
            'about': {
                insert: 'allowed',
                update: 'allowed',
                key: 'about'
            },
            'location': {
                insert: 'allowed',
                update: 'allowed',
                key: 'location'
            },
            'created_date': {
                insert: 'override',
                insertOverride: 'now()',
                update: 'denied',
                key: 'createdDate'
            },
            'updated_date': {
                insert: 'override',
                insertOverride: 'now()',
                update: 'override',
                updateOverride: 'now()',
                key: 'updatedDate'
            }
        }



    }

    getUserSelectionString() {
        return `
            users.id as "User_id", 
            users.file_id as "User_fileId",
            users.name as "User_name", 
            users.display_name as "User_displayName",
            users.email as "User_email", 
            users.status as "User_status", 
            users.permissions as "User_permissions",
            users.about as "User_about",
            users.location as "User_location", 
            users.created_date as "User_createdDate", 
            users.updated_date as "User_updatedDate"
        `
    }

    getCleanUserSelectionString() {
        return `
            users.id as "User_id", 
            users.file_id as "User_fileId",
            users.name as "User_name", 
            users.display_name as "User_displayName",
            users.about as "User_about",
            users.created_date as "User_createdDate", 
            users.updated_date as "User_updatedDate"
        `

    }

    /**
     * Translate the database rows returned by our queries into objects.
     *
     * @param {Object[]}    rows    An array of rows returned from the database.
     *
     * @return {Object}     The users parsed into a dictionary keyed using user.id. 
     */
    hydrateUsers(rows, clean) {
        // Users
        const dictionary = {}
        const list = []

        for( const row of rows ) {
            const user = {
                id: ( row.user_id !== undefined ? row.user_id : null),
                name: ( row.user_name !== undefined ? row.User_name : null),
                displayName: ( row.User_displayName !== undefined ? row.User_displayName: null),
                about: ( row.User_about !== undefined ? row.User_about: null),
                createdDate: ( row.User_createdDate !== undefined ? row.User_createdDate : null),
                updatedDate: ( row.User_updatedDate !== undefined ? row.User_updatedDate : null),
            }

            if ( ! clean ) {
                user.email = ( row.User_email !== undefined ? row.User_email : null)
                user.location = ( row.User_location !== undefined ? row.User_location : null), 
                user.status = ( row.User_status !== undefined ? row.User_status : null)
                user.permissions = ( row.User_permissions !== undefined ? row.User_permissions : null)
            }

            if ( row.file_id ) {
                user.file = this.fileDAO.hydrateFile(row)
            } else {
                user.file = null
            }

            if ( ! dictionary[row.user_id] ) {
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
                    ${ clean === true ? this.cleanSelectionString : this.selectionString},

                    ${this.fileDAO.getFilesSelectionString()}

                FROM users
                    LEFT OUTER JOIN files ON files.id = users.file_id
                ${where} 
                ORDER BY ${order} 
                ${paging}
        `

        const results = await this.database.query(sql, params)
        return this.hydrateUsers(results.rows, (clean === true))
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
        await this.insert('User', 'users', this.fieldMap, users)
    }

    async updateUser(user) {
        await this.update('User', 'users', this.fieldMap, user)
    }
}
