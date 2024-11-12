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

const PAGE_SIZE = 20 

const DAO  = require('./DAO')

module.exports = class TagDAO extends DAO {

    constructor(core) {
        super(core)

        this.database = core.database
        this.logger = core.logger

        this.entityMaps = {
            'Tag': {
                table: 'tags',
                fields: {
                    'id': {
                        insert: 'allowed',
                        update: 'primary',
                        select: 'always',
                        key: 'id'
                    },
                    'name': {
                        insert: 'required',
                        update: 'denied',
                        select: 'always',
                        key: 'name'
                    },
                    'description': {
                        insert: 'allowed',
                        update: 'allowed',
                        select: 'always',
                        key: 'description'
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

    getTagSelectionString() {
        return this.getSelectionString('Tag')
    }

    validateTag(tag) {
        // Validate the `name` tag
        if ( tag.name.length < 3) {
            throw new ValidationError('name', 'length', 'Tag names must be at least 3 characters long.')
        }
    }

    hydrateTag(row) {
        return this.hydrate('Tag', row)
    }

    /**
     * Translate the database rows returned by our join queries into objects.
     *
     * @param {Object[]}    rows    An array of rows returned from the database.
     *
     * @return {Object[]}   The data parsed into one or more objects.
     */
    hydrateTags(rows) {
        const dictionary = {}
        const list = []

        for(const row of rows) {
            const tag = this.hydrateTag(row)

            if ( ! dictionary[tag.id] ) {
                dictionary[tag.id] = tag
                list.push(tag.id)
            }
        }

        return { dictionary: dictionary, list: list } 
    }

    async selectTags(whereStatement, parameters, orderStatement, page) {
        const params = parameters ? [ ...parameters ] : []
        let where = whereStatement ? whereStatement : ''
        let order = orderStatement ? orderStatement : 'tags.name asc'

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
                   ${this.getTagSelectionString()}
                FROM tags
                ${where} 
                ORDER BY ${order} 
                ${paging}
        `

        const results = await this.database.query(sql, params)
        return this.hydrateTags(results.rows)
    }

    async countTags(where, params, page) {
        params = params ? params : []
        where = where ? where : ''

        const sql = `
               SELECT 
                 COUNT(tags.id) as count
                FROM tags
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

    async insertTags(tags) {
        await this.insert('Tag', tags)
    }

    async updateTag(tag) {
        await this.update('Tag', tag)
    }

    async deleteDat(tag) {
        await this.core.database(`
            DELETE FROM tags WHERE tags.id = $1
        `, [ tag.id ])
    }


}
