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

const DAO = require('./DAO')

const SCHEMA = {
    'GroupSubscription': {
        table: 'group_subscriptions',
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
                insert: 'allowed',
                update: 'allowed',
                select: 'always',
                key: 'status'
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

module.exports = class GroupSubscriptionDAO extends DAO {

    constructor(core) {
        super(core)

        this.core = core

        this.entityMaps = SCHEMA
    }

    getGroupSubscriptionSelectionString() {
        return this.getSelectionString('GroupSubscription')
    }

    hydrateGroupSubscription(row) {
        return this.hydrate('GroupSubscription', row)
    }

    hydrateGroupSubscriptions(rows) {
        const dictionary = {}
        const list = []

        for(const row of rows) {
            if ( ! ( row.GroupSubscription_id in dictionary)) {
                dictionary[row.GroupSubscription_id] = this.hydrateGroupSubscription(row)
                list.push(row.GroupSubscription_id)
            }
        }

        return { dictionary: dictionary, list: list }
    }

    async getGroupSubscriptionById(id) {
        const results = await this.selectGroupSubscrpitions({
            where: `group_subscriptions.id = $1`,
            params: [ id ]
        })

        if ( results.list.length <= 0 || ! ( id in results.dictionary)) {
            return null
        }

        return results.dictionary[id]
    }

    async getGroupSubscriptionByGroupAndUser(groupId, userId) {
        const results = await this.selectGroupSubscriptions({
            where: `group_subscriptions.user_id = $1 AND group_subscriptions.group_id = $2`,
            params: [ userId, groupId ]
        })

        if ( results.list.length <= 0 ) {
            return null
        }

        const entity = results.dictionary[results.list[0]]

        if ( entity.groupId != groupId || entity.userId != userId ) {
            return null
        }

        return entity 
    }

    async getSubscriptionsByGroup(groupId) {
        const results = await this.selectGroupSubscriptions({
            where: `group_subscriptions.group_id = $1`,
            params: [ groupId ]
        })

        if ( results.list.length <= 0 ) {
            return null
        }

        const subscriptions = results.list.map((id) => results.dictionary[id])
        return subscriptions
    }

    async selectGroupSubscriptions(query) {
        let where = query.where ? `WHERE ${query.where}`: ''
        let params = query.params ? query.params : []
       
        const sql = `
            SELECT
                ${this.getGroupSubscriptionSelectionString()}
            FROM group_subscriptions
            ${where}
        `

        const results = await this.core.database.query(sql, params)

        return this.hydrateGroupSubscriptions(results.rows)
    }

    async getGroupSubscriptionPageMeta(query) {
        let where = query.where ? `WHERE ${query.where}` : ''
        let params = query.params ? query.params : []

        const results = await this.core.database.query(`
            SELECT COUNT(*) FROM group_subscriptions ${where}
        `, params)

        const count = results.rows.length <= 0 ? 0 : results.rows[0].count
        return {
            count: count,
            page: 1,
            pageSize: 0,
            numberOfPages: 1 
        }
    }

    async insertGroupSubscriptions(groupSubscriptions) {
        await this.insert('GroupSubscription', groupSubscriptions)
    }

    async updateGroupSubscription(groupSubscription) {
        await this.update('GroupSubscription', groupSubscription)
    }

    async deleteGroupSubscription(groupSubscription) {
        if ( 'id' in groupSubscription ) {
            await this.core.database.query(`
                DELETE FROM group_subscriptions WHERE group_subscriptions.id = $1
            `, [ groupSubscription.id ])
        } else if ( 'groupId' in groupSubscription && 'userId' in groupSubscription ) {
            await this.core.database.query(`
                DELETE FROM group_subscriptions WHERE group_subscriptions.group_id = $1 AND group_subscriptions.user_id = $2
            `, [ groupSubscription.groupId, groupSubscription.userId])
        }
    }

    async deleteGroupSubscriptions(groupSubscriptionIds) {
        await this.core.database.query(`
            DELETE FROM group_subscriptions WHERE group_subscriptions.id = ANY($1::uuid[])
        `, [ groupSubscriptionIds ])
    }
}
