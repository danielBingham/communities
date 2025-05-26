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
    'SiteModerationEvent': {
        table: 'site_moderation_events',
        fields: {
            'id': {
                insert: 'primary',
                update: 'primary',
                select: 'always',
                key: 'id'
            },
            'site_moderation_id': {
                insert: 'require',
                update: 'denied',
                select: 'always',
                key: 'siteModerationId'
            },
            'user_id': {
                insert: 'require',
                update: 'denied',
                select: 'always',
                key: 'userId'
            },
            'status': {
                insert: 'require',
                update: 'denied',
                select: 'always',
                key: 'status'
            },
            'reason': {
                insert: 'allow',
                update: 'denied',
                select: 'always',
                key: 'reason'
            },
            'post_id': {
                insert: 'allow',
                update: 'denied',
                select: 'always',
                key: 'postId'
            },
            'post_comment_id': {
                insert: 'allow',
                update: 'denied',
                select: 'always',
                key: 'postCommentId'
            },
            'created_date': {
                insert: 'override',
                insertOverride: 'now()',
                update: 'denied',
                select: 'always',
                key: 'createdDate'
            }
        }
    }
}

module.exports = class SiteModerationEventDAO extends DAO {

    constructor(core) {
        super(core)

        this.core = core

        this.entityMaps = SCHEMA
    }

    getSiteModerationEventSelectionString() {
        return this.getSelectionString('SiteModerationEvent')
    }

    hydrateSiteModerationEvent(row) {
        return this.hydrate('SiteModerationEvent', row)
    }

    hydrateSiteModerationEvents(rows) {
        const dictionary = {}
        const list = []

        for(const row of rows) {

            // Hydrate the siteModerationEvent.
            if ( ! (row.SiteModerationEvent_id in dictionary ) ) {
                dictionary[row.SiteModerationEvent_id] = this.hydrateSiteModerationEvent(row)
                list.push(row.SiteModerationEvent_id)
            }
        }

        return { dictionary: dictionary, list: list }
    }

    async getSiteModerationEventById(id) {
        const results = await this.selectSiteModerationEvents({
            where: `site_moderation_events.id = $1`,
            params: [ id ]
        })

        if ( results.list.length <= 0 || ! ( id in results.dictionary)) {
            return null
        }

        return results.dictionary[id]
    }

    async getSiteModerationEventByPostId(postId) {
        const results = await this.selectSiteModerationEvents({
            where: `site_moderation_events.post_id = $1`,
            params: [ postId ]
        })

        if ( results.list.length <= 0 ) {
            return null
        }

        return results.dictionary[results.list[0]]
    }

    async getSiteModerationEventByPostCommentId(postCommentId) {
        const results = await this.selectSiteModerationEvents({
            where: `site_moderation_events.post_comment_id = $1`,
            params: [ postCommentId ]
        })

        if ( results.list.length <= 0 ) {
            return null
        }

        return results.dictionary[results.list[0]]
    }

    async selectSiteModerationEvents(query) {
        let where = query.where ? `WHERE ${query.where}` : ''
        let params = query.params ? [ ...query.params ] : []
        let page  = query.page ? query.page : 1
        let order = query.order ? `${query.order}` : `site_moderation_events.created_date ASC`

        let paging = ''
        if ( page > 0 ) {
            const limit = query.perPage ? query.perPage : PAGE_SIZE 
            const offset = limit * (page-1) 

            paging = `
                LIMIT ${limit}
                OFFSET ${offset}
            `
        }

        const results = await this.core.database.query(`
            SELECT
                ${this.getSiteModerationEventSelectionString()}
            FROM site_moderation_events
            ${where}
            ORDER BY ${order}
            ${paging}
        `, [ params ])

        if ( results.rows.length <= 0 ) {
            return {
                dictionary: {},
                list: []
            }
        }

        return this.hydrateSiteModerationEvents(rows)
    }

    async getSiteModerationEventPageMeta(query) {
        let where = query.where ? `WHERE ${query.where}` : ''
        let params = query.params ? [ ...query.params ] : []
        let page = query.page ? query.page : 1

        const results = await this.core.database.query(`
                SELECT 
                    COUNT(*)
                FROM site_moderation_events 
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

    createEventFromSiteModeration(siteModeration) {
        const event = { ...siteModeration }
        event.siteModerationId = siteModeration.id
        delete event.id
        delete event.updatedDate
        return event
    }

    async insertSiteModerationEvents(siteModerationEvents) {
        await this.insert('SiteModerationEvent', siteModerationEvents)
    }
}
