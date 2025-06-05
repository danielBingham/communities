/******************************************************************************
 *
 *  Communities -- Non-profit cooperative social media 
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

const DAO  = require('./DAO')

const PAGE_SIZE = 20
const SCHEMA = {
    'Blocklist': {
        table: 'blocklist',
        fields: {
            'id': {
                insert: DAO.INSERT.PRIMARY,
                update: DAO.UPDATE.PRIMARY,
                select: DAO.SELECT.PRIMARY,
                key: 'id'
            },
            'user_id': {
                insert: DAO.INSERT.REQUIRE,
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.PRIMARY,
                key: 'userId'
            },
            'domain': {
                insert: DAO.INSERT.REQUIRE,
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.PRIMARY,
                key: 'domain'
            },
            'notes': {
                insert: DAO.INSERT.ALLOW,
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.PRIMARY,
                key: 'notes'
            },
            'created_date': {
                insert: DAO.INSERT.OVERRIDE,
                insertOverride: 'now()',
                update: DAO.UPDATE.DENY,
                select: DAO.SELECT.PRIMARY,
                key: 'createdDate'
            },
            'updated_date': {
                insert: DAO.INSERT.OVERRIDE,
                insertOverride: 'now()',
                update: DAO.UPDATE.OVERRIDE,
                updateOverride: 'now()',
                select: DAO.SELECT.PRIMARY,
                key: 'updatedDate'
            },
        }
    }
}

module.exports = class BlocklistDAO extends DAO {

    constructor(core) {
        super(core)

        this.core = core

        this.entityMaps = SCHEMA
    }

    getBlocklistSelectionString() {
        return this.getSelectionString('Blocklist')
    }

    hydrateBlocklist(row) {
        return this.hydrate('Blocklist', row)
    }

    hydrateBlocklists(rows) {
        const dictionary = {}
        const list = []

        for(const row of rows) {

            // Hydrate the blocklist.
            if ( ! (row.Blocklist_id in dictionary ) ) {
                dictionary[row.Blocklist_id] = this.hydrateBlocklist(row)
                list.push(row.Blocklist_id)
            }
        }

        return { dictionary: dictionary, list: list }
    }

    async getBlocklistById(id) {
        const results = await this.selectBlocklists({
            where: `blocklist.id = $1`,
            params: [ id ]
        })

        if ( results.list.length <= 0 || ! ( id in results.dictionary)) {
            return null
        }

        return results.dictionary[id]
    }

    async getBlocklistByDomain(domain) {
        const results = await this.selectBlocklists({
            where: `blocklist.domain = $1`,
            params: [ domain ]
        })

        if ( results.list.length <= 0 ) {
            return null
        }

        const entity = results.dictionary[results.list[0]]
        if ( entity.domain !== domain ) {
            throw new DAOError('invalid-result',
                `getBlocklistByDomain returned a result with '${entity.domain}' instead of '${domain}'`)
        }

        return entity 
    }

    async selectBlocklists(query) {
        let where = query.where ? `WHERE ${query.where}` : ''
        let params = query.params ? [ ...query.params ] : []
        let page  = query.page ? query.page : 1
        let order = query.order ? `${query.order}` : `blocklist.created_date ASC`

        let paging = ''
        if ( 'page' in query && query.page !== undefined && query.page !== null) {
            const limit = query.perPage ? query.perPage : PAGE_SIZE 
            const offset = limit * (page-1) 

            paging = `
                LIMIT ${limit}
                OFFSET ${offset}
            `
        }

        const sql = `
            SELECT
                ${this.getBlocklistSelectionString()}
            FROM blocklist
            ${where}
            ORDER BY ${order}
            ${paging}
        `

        const result = await this.core.database.query(sql, params)

        if ( result.rows.length <= 0 ) {
            return {
                dictionary: {},
                list: []
            }
        }

        return this.hydrateBlocklists(result.rows)
    }

    async getBlocklistPageMeta(query) {
        let where = query.where ? `WHERE ${query.where}` : ''
        let params = query.params ? [ ...query.params ] : []
        let page = query.page ? query.page : 1

        const results = await this.core.database.query(`
                SELECT 
                    COUNT(*)
                FROM blocklist 
                ${where}
        `, params)

        const count = results.rows.length <= 0 ? 0 : results.rows[0].count
        const pageSize = query.perPage ? query.perPage : PAGE_SIZE
        return {
            count: count,
            page: page,
            pageSize: pageSize,
            numberOfPages: Math.floor(count / pageSize) + ( (count % pageSize) > 0 ? 1 : 0) 
        }
    }

    async insertBlocklists(blocklists) {
        await this.insert('Blocklist', blocklists)
    }

    async updateBlocklist(blocklist) {
        await this.update('Blocklist', blocklist)
    }

    async deleteBlocklist(blocklist) {
        await this.core.database.query(`
            DELETE FROM blocklist WHERE blocklist.id = $1
        `, [ blocklist.id])
    }

}
