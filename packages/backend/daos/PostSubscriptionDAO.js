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
    'PostSubscription': {
        table: 'post_subscriptions',
        fields: {
            'id': {
                insert: 'primary',
                update: 'primary',
                select: 'always',
                key: 'id'
            },
            'post_id': {
                insert: 'required',
                update: 'denied',
                select: 'always',
                key: 'postId'
            },
            'user_id': {
                insert: 'required',
                update: 'denied',
                select: 'always',
                key: 'userId'
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

module.exports = class PostSubscriptionDAO extends DAO {

    constructor(core) {
        super(core)

        this.core = core

        this.entityMaps = SCHEMA
    }

    getPostSubscriptionSelectionString() {
        return this.getSelectionString('PostSubscription')
    }

    hydratePostSubscription(row) {
        return this.hydrate('PostSubscription', row)
    }

    hydratePostSubscriptions(rows) {
        const dictionary = {}
        const list = []

        for(const row of rows) {
            if ( ! ( row.PostSubscription_id in dictionary)) {
                dictionary[row.PostSubscription_id] = this.hydratePostSubscription(row)
                list.push(row.PostSubscription_id)
            }
        }

        return { dictionary: dictionary, list: list }
    }

    async getPostSubscriptionById(id) {
        const results = await this.selectPostSubscrpitions({
            where: `post_subscriptions.id = $1`,
            params: [ id ]
        })

        if ( results.list.length <= 0 || ! ( id in results.dictionary)) {
            return null
        }

        return results.dictionary[id]
    }

    async getPostSubscriptionByPostAndUser(postId, userId) {
        const results = await this.selectPostSubscriptions({
            where: `post_subscriptions.user_id = $1 AND post_subscriptions.post_id = $2`,
            params: [ userId, postId ]
        })

        if ( results.list.length <= 0 ) {
            return null
        }

        const entity = results.dictionary[results.list[0]]

        if ( entity.postId != postId || entity.userId != userId ) {
            return null
        }

        return entity 
    }

    async getSubscriptionsByPost(postId) {
        const results = await this.selectPostSubscriptions({
            where: `post_subscriptions.post_id = $1`,
            params: [ postId ]
        })

        if ( results.list.length <= 0 ) {
            return null
        }

        const subscriptions = results.list.map((id) => results.dictionary[id])
        return subscriptions
    }

    async selectPostSubscriptions(query) {
        let where = query.where ? `WHERE ${query.where}`: ''
        let params = query.params ? query.params : []
       
        const sql = `
            SELECT
                ${this.getPostSubscriptionSelectionString()}
            FROM post_subscriptions
            ${where}
        `

        const results = await this.core.database.query(sql, params)

        return this.hydratePostSubscriptions(results.rows)
    }

    async getPostSubscriptionPageMeta(query) {
        let where = query.where ? `WHERE ${query.where}` : ''
        let params = query.params ? query.params : []

        const results = await this.core.database.query(`
            SELECT COUNT(*) FROM post_subscriptions ${where}
        `, params)

        const count = results.rows.length <= 0 ? 0 : results.rows[0].count
        return {
            count: count,
            page: 1,
            pageSize: 0,
            numberOfPages: 1 
        }
    }

    async insertPostSubscriptions(postSubscriptions) {
        await this.insert('PostSubscription', postSubscriptions)
    }

    async updatePostSubscription(postSubscription) {
        throw new DAOError('not-implemented', 'PostSubscriptions should only be created or deleted.  There is nothing to update.')
    }

    async deletePostSubscription(postSubscription) {
        if ( 'id' in postSubscription ) {
            await this.core.database.query(`
                DELETE FROM post_subscriptions WHERE post_subscriptions.id = $1
            `, [ postSubscription.id ])
        } else if ( 'postId' in postSubscription && 'userId' in postSubscription ) {
            await this.core.database.query(`
                DELETE FROM post_subscriptions WHERE post_subscriptions.post_id = $1 AND post_subscriptions.user_id = $2
            `, [ postSubscription.postId, postSubscription.userId])
        }
    }
}
