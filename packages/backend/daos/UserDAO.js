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
                insert: DAO.INSERT.PRIMARY,
                update: DAO.UPDATE.PRIMARY,
                select: DAO.SELECT.ALWAYS,
                key: 'id'
            },
            'file_id': {
                insert: DAO.INSERT.ALLOW,
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.ALWAYS,
                key: 'fileId'
            },
            'name': {
                insert: DAO.INSERT.ALLOW,
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.ALWAYS,
                key: 'name',
            },
            'username': {
                insert: DAO.INSERT.ALLOW,
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.ALWAYS,
                key: 'username'
            },
            'email': {
                insert: DAO.INSERT.REQUIRE,
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.REQUEST,
                key: 'email'
            },
            'password': {
                insert: DAO.INSERT.ALLOW,
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.NEVER,
                key: 'password'
            },
            'birthdate': {
                insert: DAO.INSERT.ALLOW,
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.REQUEST,
                key: 'birthdate',
                needsFeature: '253-better-age-gate'
            },
            'status': {
                insert: DAO.INSERT.ALLOW,
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.REQUEST,
                key: 'status'
            },
            'permissions': {
                insert: DAO.INSERT.DENY,
                update: DAO.UPDATE.DENY,
                select: DAO.SELECT.REQUEST,
                key: 'permissions'
            },
            'site_role': {
                insert: DAO.INSERT.DENY,
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.REQUEST,
                key: 'siteRole'
            },
            'settings': {
                insert: DAO.INSERT.ALLOW,
                insertDefault: function() {
                    return {
                        notifications: {}
                    }
                },
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.REQUEST,
                key: 'settings'
            },
            'notices': {
                insert: DAO.INSERT.ALLOW,
                insertDefault: function() {
                    return {}
                },
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.REQUEST,
                key: 'notices'
            },
            'about': {
                insert: DAO.INSERT.ALLOW,
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.ALWAYS,
                key: 'about'
            },
            'location': {
                insert: DAO.INSERT.ALLOW,
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.REQUEST,
                key: 'location'
            },
            'invitations': {
                insert: DAO.INSERT.ALLOW,
                insertDefault: function() {
                    return 50
                },
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.REQUEST,
                key: 'invitations'
            },
            'last_authentication_attempt_date': {
                insert: DAO.INSERT.OVERRIDE,
                insertOverride: 'now()',
                update: DAO.UPDATE.OVERRIDE,
                updateOverride: 'now()',
                select: DAO.SELECT.REQUEST,
                key: 'lastAuthenticationAttemptDate',
                needsFeature: '163-limit-login-attempts'
            },
            'created_date': {
                insert: DAO.INSERT.OVERRIDE,
                insertOverride: 'now()',
                update: DAO.UPDATE.DENY,
                select: DAO.SELECT.ALWAYS,
                key: 'createdDate'
            },
            'updated_date': {
                insert: DAO.INSERT.OVERRIDE,
                insertOverride: 'now()',
                update: DAO.UPDATE.OVERRIDE,
                updateOverride: 'now()',
                select: DAO.SELECT.ALWAYS,
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

    async getUserByEmail(email, fields) {
        const results = await this.selectUsers({
            where: `users.email = $1`,
            params: [ email ],
            fields: fields
        })

        if ( results.list.length <= 0 ) {
            return null
        }

        return results.dictionary[results.list[0]]
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
