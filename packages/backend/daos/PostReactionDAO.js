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

module.exports = class PostReactionDAO extends DAO {

    constructor(core) {
        super(core)

        this.core = core

        this.entityMaps = {
            'PostReaction': {
                table: 'post_reactions',
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
                    'reaction': {
                        insert: 'required',
                        update: 'allowed',
                        select: 'always',
                        key: 'reaction'
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

    getPostReactionSelectionString() {
        return this.getSelectionString('PostReaction')
    }

    hydratePostReaction(row) {
        return this.hydrate('PostReaction', row)
    }

    hydratePostReactions(rows) {
        const dictionary = {}
        const list = []

        for(const row of rows) {
            if ( ! ( row.PostReaction_id in dictionary)) {
                dictionary[row.PostReaction_id] = this.hydratePostReaction(row)
                list.push(row.PostReaction_id)
            }
        }

        return { dictionary: dictionary, list: list }
    }

    async getPostReactionByPostAndUser(postId, userId) {
        const results = await this.selectPostReactions({
            where: `post_reactions.post_id = $1 AND post_reactions.user_id = $2`,
            params: [ postId, userId ]
        })

        if ( results.list.length <= 0 ) {
            return null
        }

        return results.dictionary[results.list[0]]
    }

    async selectPostReactions(query) {
        let where = query.where ? `WHERE ${query.where}`: ''
        let params = query.params ? query.params : []
       
        const sql = `
            SELECT
                ${this.getPostReactionSelectionString()}
            FROM post_reactions
            ${where}
        `

        const results = await this.core.database.query(sql, params)

        return this.hydratePostReactions(results.rows)
    }

    async getPostReactionPageMeta(query) {
        let where = query.where ? `WHERE ${query.where}` : ''
        let params = query.params ? query.params : []

        const results = await this.core.database.query(`
            SELECT COUNT(*) FROM post_reactions ${where}
        `, params)

        const count = results.rows.length <= 0 ? 0 : results.rows[0].count
        return {
            count: count,
            page: 1,
            pageSize: 0,
            numberOfPages: 1 
        }
    }

    async insertPostReactions(postReactions) {
        await this.insert('PostReaction', postReactions)
    }

    async updatePostReaction(postReaction) {
        if ( 'id' in postReaction ) {
            await this.update('PostReaction', postReaction)
        } else if ( 'userId'in postReaction && 'postId' in postReaction) {
            await this.core.database.query(`
                UPDATE post_reactions SET reaction = $1 WHERE post_id = $2 AND user_id = $3
            `, [ postReaction.reaction, postReaction.postId, postReaction.userId ])
        }
    }

    async deletePostReaction(postReaction) {
        await this.core.database.query(`
            DELETE FROM post_reactions WHERE post_reactions.post_id = $1 AND post_reactions.user_id = $2
        `, [ postReaction.postId, postReaction.userId])
    }
}
