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
    'GroupModeration': {
        table: 'group_moderation',
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

module.exports = class GroupModerationDAO extends DAO {

    constructor(core) {
        super(core)

        this.core = core

        this.entityMaps = SCHEMA
    }

    getGroupModerationSelectionString() {
        return this.getSelectionString('GroupModeration')
    }

    hydrateGroupModeration(row) {
        return this.hydrate('GroupModeration', row)
    }

    hydrateGroupModerations(rows) {
        const dictionary = {}
        const list = []

        for(const row of rows) {

            // Hydrate the groupModeration.
            if ( ! (row.GroupModeration_id in dictionary ) ) {
                dictionary[row.GroupModeration_id] = this.hydrateGroupModeration(row)
                list.push(row.GroupModeration_id)
            }
        }

        return { dictionary: dictionary, list: list }
    }

    async getGroupModerationById(id) {
        const results = await this.selectGroupModerations({
            where: `group_moderation.id = $1`,
            params: [ id ]
        })

        if ( results.list.length <= 0 || ! ( id in results.dictionary)) {
            return null
        }

        return results.dictionary[id]
    }

    async getGroupModerationByPostId(postId) {
        const results = await this.selectGroupModerations({
            where: `group_moderation.post_id = $1 AND group_moderation.post_comment_id IS NULL`,
            params: [ postId ]
        })

        if ( results.list.length <= 0 ) {
            return null
        }

        return results.dictionary[results.list[0]]
    }

    async getGroupModerationByPostCommentId(postCommentId) {
        const results = await this.selectGroupModerations({
            where: `group_moderation.post_comment_id = $1`,
            params: [ postCommentId ]
        })

        if ( results.list.length <= 0 ) {
            return null
        }

        return results.dictionary[results.list[0]]
    }

    async selectGroupModerations(query) {
        let where = query.where ? `WHERE ${query.where}` : ''
        let params = query.params ? [ ...query.params ] : []
        let page  = query.page ? query.page : 1
        let order = query.order ? `${query.order}` : `group_moderation.created_date ASC`

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
                ${this.getGroupModerationSelectionString()}
            FROM group_moderation
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

        return this.hydrateGroupModerations(result.rows)
    }

    async getGroupModerationPageMeta(query) {
        let where = query.where ? `WHERE ${query.where}` : ''
        let params = query.params ? [ ...query.params ] : []
        let page = query.page ? query.page : 1

        const results = await this.core.database.query(`
                SELECT 
                    COUNT(*)
                FROM group_moderation 
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

    async insertGroupModerations(groupModerations) {
        await this.insert('GroupModeration', groupModerations)
    }

    async updateGroupModeration(groupModeration) {
        await this.update('GroupModeration', groupModeration)
    }


    async deleteGroupModeration(groupModeration) {
        await this.core.database.query(`
            DELETE FROM group_moderation WHERE group_moderation.id = $1
        `, [ groupModeration.id])
    }

}
