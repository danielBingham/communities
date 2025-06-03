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
    'SiteModeration': {
        table: 'site_moderation',
        fields: {
            'id': {
                insert: 'primary',
                update: 'primary',
                select: 'always',
                key: 'id'
            },
            'user_id': {
                insert: 'require',
                update: 'allow',
                select: 'always',
                key: 'userId'
            },
            'status': {
                insert: 'require',
                update: 'allow',
                select: 'always',
                key: 'status'
            },
            'reason': {
                insert: 'allow',
                update: 'allow',
                select: 'always',
                key: 'reason'
            },
            'post_id': {
                insert: 'allow',
                update: 'allow',
                select: 'always',
                key: 'postId'
            },
            'post_comment_id': {
                insert: 'allow',
                update: 'allow',
                select: 'always',
                key: 'postCommentId'
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
            },
        }
    }
}

module.exports = class SiteModerationDAO extends DAO {

    constructor(core) {
        super(core)

        this.core = core

        this.entityMaps = SCHEMA
    }

    getSiteModerationSelectionString() {
        return this.getSelectionString('SiteModeration')
    }

    hydrateSiteModeration(row) {
        return this.hydrate('SiteModeration', row)
    }

    hydrateSiteModerations(rows) {
        const dictionary = {}
        const list = []

        for(const row of rows) {

            // Hydrate the siteModeration.
            if ( ! (row.SiteModeration_id in dictionary ) ) {
                dictionary[row.SiteModeration_id] = this.hydrateSiteModeration(row)
                list.push(row.SiteModeration_id)
            }
        }

        return { dictionary: dictionary, list: list }
    }

    async getSiteModerationById(id) {
        const results = await this.selectSiteModerations({
            where: `site_moderation.id = $1`,
            params: [ id ]
        })

        if ( results.list.length <= 0 || ! ( id in results.dictionary)) {
            return null
        }

        return results.dictionary[id]
    }

    async getSiteModerationByPostId(postId) {
        const results = await this.selectSiteModerations({
            where: `site_moderation.post_id = $1 AND site_moderation.post_comment_id IS NULL`,
            params: [ postId ]
        })

        if ( results.list.length <= 0 ) {
            return null
        }

        return results.dictionary[results.list[0]]
    }

    async getSiteModerationByPostCommentId(postCommentId) {
        const results = await this.selectSiteModerations({
            where: `site_moderation.post_comment_id = $1`,
            params: [ postCommentId ]
        })

        if ( results.list.length <= 0 ) {
            return null
        }

        return results.dictionary[results.list[0]]
    }

    async selectSiteModerations(query) {
        let where = query.where ? `WHERE ${query.where}` : ''
        let params = query.params ? [ ...query.params ] : []
        let page  = query.page ? query.page : 1
        let order = query.order ? `${query.order}` : `site_moderation.created_date ASC`

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
                ${this.getSiteModerationSelectionString()}
            FROM site_moderation
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

        return this.hydrateSiteModerations(result.rows)
    }

    async getSiteModerationPageMeta(query) {
        let where = query.where ? `WHERE ${query.where}` : ''
        let params = query.params ? [ ...query.params ] : []
        let page = query.page ? query.page : 1

        const results = await this.core.database.query(`
                SELECT 
                    COUNT(*)
                FROM site_moderation 
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

    async insertSiteModerations(siteModerations) {
        await this.insert('SiteModeration', siteModerations)
    }

    async updateSiteModeration(siteModeration) {
        await this.update('SiteModeration', siteModeration)
    }


    async deleteSiteModeration(siteModeration) {
        await this.core.database.query(`
            DELETE FROM site_moderation WHERE site_moderation.id = $1
        `, [ siteModeration.id])
    }

}
