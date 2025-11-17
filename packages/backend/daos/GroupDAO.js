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
    'Group': {
        table: 'groups',
        fields: {
            'id': {
                insert: DAO.INSERT.PRIMARY,
                update: DAO.UPDATE.PRIMARY,
                select: DAO.SELECT.ALWAYS,
                key: 'id'
            },
            'type': {
                insert: DAO.INSERT.REQUIRE,
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.ALWAYS,
                key: 'type'
            },
            'post_permissions': {
                insert: DAO.INSERT.REQUIRE,
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.ALWAYS,
                key: 'postPermissions'
            },
            'title': {
                insert: DAO.INSERT.REQUIRE,
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.ALWAYS,
                key: 'title'
            },
            'slug': {
                insert: DAO.INSERT.REQUIRE,
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.ALWAYS,
                key: 'slug'
            },
            'about': {
                insert: DAO.INSERT.ALLOW,
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.ALWAYS,
                key: 'about'
            },
            'parent_id': {
                insert: DAO.INSERT.ALLOW,
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.ALWAYS,
                key: 'parentId',
                needsFeature: 'issue-165-subgroups'
            },
            'file_id': {
                insert: DAO.INSERT.ALLOW,
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.ALWAYS,
                key: 'fileId'
            },
            'entrance_questions': {
                insert: DAO.INSERT.ALLOW,
                insertDefault: () => {},
                update: DAO.UPDATE.ALLOW,
                select: DAO.SELECT.ALWAYS,
                key: 'entranceQuestions'
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

module.exports = class GroupDAO extends DAO {

    constructor(core) {
        super(core)

        this.core = core

        this.entityMaps = SCHEMA
    }

    getGroupSelectionString() {
        return this.getSelectionString('Group')
    }

    hydrateGroup(row) {
        return this.hydrate('Group', row)
    }

    hydrateGroups(rows) {
        const dictionary = {}
        const list = []

        for(const row of rows) {

            // Hydrate the group.
            if ( ! (row.Group_id in dictionary ) ) {
                dictionary[row.Group_id] = this.hydrateGroup(row)
                list.push(row.Group_id)
            }
        }

        return { dictionary: dictionary, list: list }
    }

    async getGroupById(id) {
        const results = await this.selectGroups({
            where: `groups.id = $1`,
            params: [ id ]
        })

        if ( results.list.length <= 0 || ! ( id in results.dictionary)) {
            return null
        }

        return results.dictionary[id]
    }

    async getGroupBySlug(slug) {
        const results = await this.selectGroups({
            where: `groups.slug = $1`,
            params: [ slug ]
        })

        if ( results.list.length <= 0 ) {
            return null
        }

        const entity = results.dictionary[results.list[0]]

        if ( entity.slug !== slug ) {
            this.core.logger.error(`Slug, '${entity.slug}' does not match '${slug}' in getGroupBySlug.`)
            return null
        }

        return entity
    }

    async getGroupsForUser(userId) {
        const groupMemberResults = await this.core.database.query(`
            SELECT group_id FROM group_members WHERE user_id = $1
        `, [ userId ])

        const groupIds = groupMemberResults.rows.map((r) => r.group_id)

        const results = this.selectGroups({
            where: `groups.id = ANY($1::uuid[])`,
            params: [groupIds]
        })

        if ( results.list.length <= 0 ) {
            return null
        }

        const groups = results.list.map((id) => results.dictionary[id])
        return groups
    }

    async selectGroups(query) {
        let where = query.where ? `WHERE ${query.where}` : ''
        let params = query.params ? [ ...query.params ] : []
        let page = query.page 
        let order = query.order ? `${query.order}` : `groups.created_date DESC`

        let paging = ''
        if ( query.page ) {
            const page = query.page ? query.page : 1
            const pageSize = query.pageSize ? query.pageSize : PAGE_SIZE

            const offset = (page-1) * pageSize
            let count = params.length

            paging = `
                LIMIT $${count+1}
                OFFSET $${count+2}
            `

            params.push(pageSize)
            params.push(offset)
        }

        const sql = `
            SELECT
                ${this.getGroupSelectionString()}
            FROM groups
            ${where}
            ORDER BY ${order}
            ${paging}
        `

        const results = await this.core.database.query(sql, params)

        if ( results.rows.length <= 0 ) {
            return { dictionary: {}, list: [] }
        }

        return this.hydrateGroups(results.rows)
    }

    async getGroupPageMeta(query) {
        let where = query.where ? `WHERE ${query.where}` : ''
        let params = query.params ? [ ...query.params ] : []
        let page = query.page ? query.page : 1

        const results = await this.core.database.query(`
                SELECT 
                    COUNT(*)
                FROM groups
                ${where}
        `, params)

        const count = results.rows.length <= 0 ? 0 : results.rows[0].count
        return {
            count: count,
            page: page,
            pageSize: PAGE_SIZE,
            numberOfPages: Math.floor(count / PAGE_SIZE) + ( (count % PAGE_SIZE) > 0 ? 1 : 0) 
        }
    }

    async insertGroups(groups) {
        await this.insert('Group', groups)
    }

    async updateGroup(group) {
        await this.update('Group', group)
    }

    async deleteGroup(group) {
        await this.core.database.query(`
            DELETE FROM groups WHERE groups.id = $1
        `, [ group.id])
    }

}
