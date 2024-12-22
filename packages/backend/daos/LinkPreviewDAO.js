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

const DAO  = require('./DAO')

const PAGE_SIZE = 20
const SCHEMA = {
    'LinkPreview': {
        table: 'link_previews',
        fields: {
            'id': {
                insert: 'primary',
                update: 'primary',
                select: 'always',
                key: 'id'
            },
            'url': {
                insert: 'required',
                update: 'required',
                select: 'always',
                key: 'url'
            },
            'title': {
                insert: 'allowed',
                update: 'allowed',
                select: 'always',
                key: 'title'
            },
            'description': {
                insert: 'allowed',
                update: 'allowed',
                select: 'always',
                key: 'description'
            },
            'image_url': {
                insert: 'allowed',
                update: 'allowed',
                select: 'always',
                key: 'imageUrl'
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

module.exports = class LinkPreviewDAO extends DAO {
    constructor(core) {
        super(core)

        this.core = core

        this.entityMaps = SCHEMA
    }

    getLinkPreviewSelectionString() {
        return this.getSelectionString('LinkPreview')
    }

    hydrateLinkPreview(row) {
        return this.hydrate('LinkPreview', row)
    }

    hydrateLinkPreviews(rows) {
        const dictionary = {}
        const list = []

        for(const row of rows) {
            if ( ! ( row.LinkPreview_id in dictionary )) {
                dictionary[row.LinkPreview_id] = this.hydrateLinkPreview(row)
                list.push(row.LinkPreview_id)
            }
        }

        return { dictionary: dictionary, list: list }
    }

    async selectLinkPreviews(query) {
        let where = query.where ? `WHERE ${query.where}` : ''
        let params = query.params ? [ ...query.params ] : []
        let order = query.order ? `${query.order}` : 
            `link_previews.created_date DESC`

        const sql = `
            SELECT
                ${this.getLinkPreviewSelectionString()},
            FROM link_previews 
            ${where}
            ORDER BY ${order}
        `

        const results = await this.core.database.query(sql, params)

        if ( results.rows.length <= 0 ) {
            return { dictionary: {}, list: [] }
        }

        return this.hydrateLinkPreviews(results.rows)
    }

    async getLinkPreviewMeta(query) {
        let where = query.where ? `WHERE ${query.where}` : ''
        let params = query.params ? [ ...query.params ] : []

        const results = await this.core.database.query(`
            SELECT COUNT(*) 
                FROM link_previews
                ${where}
        `, params)

        
        const count = results.rows.length <= 0 ? 0 : results.rows[0].count
        return {
            count: count,
            page: 1,
            pageSize: PAGE_SIZE,
            numberOfPages: Math.floor(count / PAGE_SIZE) + ( (count % PAGE_SIZE) > 0 ? 1 : 0) 
        }
    }

    async insertLinkPreviews(linkPreviews) {
        await this.insert('LinkPreview', linkPreviews)
    }

    async updateLinkPreview(linkPreview) {
        await this.update('LinkPreview', linkPreview)
    }

    async deleteLinkPreview(linkPreview) {
        await this.core.database.query(`
            DELETE FROM link_previews WHERE link_previews.id = $1
        `, [ linkPreview.id ])
    }
}
