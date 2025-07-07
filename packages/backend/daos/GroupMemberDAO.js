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
    'GroupMember': {
        table: 'group_members',
        fields: {
            'id': {
                insert: 'primary',
                update: 'primary',
                select: 'always',
                key: 'id'
            },
            'group_id': {
                insert: 'required',
                update: 'denied',
                select: 'always',
                key: 'groupId'
            },
            'user_id': {
                insert: 'required',
                update: 'denied',
                select: 'always',
                key: 'userId'
            },
            'status': {
                insert: 'required',
                update: 'allowed',
                select: 'always',
                key: 'status'
            },
            'role': {
                insert: 'required',
                update: 'allowed',
                select: 'always',
                key: 'role'
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

module.exports = class GroupMemberDAO extends DAO {

    constructor(core) {
        super(core)

        this.core = core

        this.entityMaps = SCHEMA
    }

    getGroupMemberSelectionString() {
        return this.getSelectionString('GroupMember')
    }

    hydrateGroupMember(row) {
        return this.hydrate('GroupMember', row)
    }

    hydrateGroupMembers(rows) {
        const dictionary = {}
        const list = []

        for(const row of rows) {

            // Hydrate the groupMember.
            if ( ! (row.GroupMember_id in dictionary ) ) {
                dictionary[row.GroupMember_id] = this.hydrateGroupMember(row)
                list.push(row.GroupMember_id)
            }
        }

        return { dictionary: dictionary, list: list }
    }

    async getGroupMemberById(id, full) {
        const results = await this.selectGroupMembers({
            where: `groupMembers.id = $1`,
            params: [ id ],
            full: full
        })

        if ( results.list.length <= 0 || ! ( id in results.dictionary)) {
            return null
        }

        return results.dictionary[id]
    }

    async getGroupMemberByGroupAndUser(groupId, userId, full) {
        const results = await this.selectGroupMembers({
            where: `group_members.group_id = $1 AND group_members.user_id = $2`,
            params: [ groupId, userId ],
            full: full 
        })

        if ( results.list.length <= 0 ) {
            return null
        }

        const entity = results.dictionary[results.list[0]]

        if ( entity.groupId !== groupId || entity.userId !== userId ) {
            this.core.logger.info(entity)
            this.core.logger.error(`Entity does not match query (${groupId}, ${userId}) in 'getGroupMemberByGroupAndUser'.  This should not happen.`)
            return null
        }

        return entity 
    }

    async getGroupMembers(groupId) {
        const results = await this.selectGroupMembers({
            where: 'group_members.group_id = $1',
            params: [ groupId ]
        })

        if ( results.list.length <= 0 ) {
            return []
        }

        return results.list.map((id) => results.dictionary[id])
    }

    async selectGroupMembers(query) {
        let where = query.where ? `WHERE ${query.where}` : ''
        let params = query.params ? [ ...query.params ] : []
        let order = query.order ? `${query.order}` : `group_members.created_date DESC`
        let full = query.full ? query.full : false

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
                ${this.getGroupMemberSelectionString()}
            FROM group_members
            ${where}
            ORDER BY ${order}
            ${paging}
        `

        const results = await this.core.database.query(sql, params)

        if ( results.rows.length <= 0 ) {
            return { dictionary: {}, list: [] }
        }

        return this.hydrateGroupMembers(results.rows)
    }

    async getGroupMemberPageMeta(query) {
        let where = query.where ? `WHERE ${query.where}` : ''
        let params = query.params ? [ ...query.params ] : []
        let page = query.page ? query.page : 1

        const results = await this.core.database.query(`
                SELECT 
                    COUNT(*)
                FROM group_members
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

    async insertGroupMembers(groupMembers) {
        await this.insert('GroupMember', groupMembers)
    }

    async updateGroupMember(groupMember) {
        await this.update('GroupMember', groupMember)
    }

    async deleteGroupMember(groupMember) {
        await this.core.database.query(`
            DELETE FROM group_members WHERE group_members.id = $1
        `, [ groupMember.id])
    }

}
