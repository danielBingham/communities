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

module.exports = class CommentReactionDAO extends DAO {

    constructor(core) {
        super(core)

        this.core = core

        this.entityMaps = {
            'CommentReaction': {
                table: 'comment_reactions',
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
                    'comment_id': {
                        insert: 'required',
                        update: 'denied',
                        select: 'always',
                        key: 'commentId'
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

    getCommentReactionSelectionString() {
        return this.getSelectionString('CommentReaction')
    }

    hydrateCommentReaction(row) {
        return this.hydrate('CommentReaction', row)
    }

    hydrateCommentReactions(rows) {
        const dictionary = {}
        const list = []

        for(const row of rows) {
            if ( ! ( row.CommentReaction_id in dictionary)) {
                dictionary[row.CommentReaction_id] = this.hydrateCommentReaction(row)
                list.push(row.CommentReaction_id)
            }
        }

        return { dictionary: dictionary, list: list }
    }

    async getCommentReactionById(commentReactionId) {
        const results = await this.selectCommentReactions({
            where: `comment_reactions.id = $1`,
            params: [ commentReactionId ]
        })

        if ( ! (commentReactionId in results.dictionary)) {
            return null
        }

        return results.dictionary[commentReactionId]
    }

    async getCommentReactionByCommentAndUser(commentId, userId) {
        const results = await this.selectCommentReactions({
            where: `comment_reactions.comment_id = $1 AND comment_reactions.user_id = $2`,
            params: [ commentId, userId ]
        })

        if ( results.list.length <= 0 ) {
            return null
        }

        return results.dictionary[results.list[0]]
    }

    async selectCommentReactions(query) {
        const where = query.where ? `WHERE ${query.where}` : ''
        const params = query.params ? [ ...query.params ] : []
        const order = query.order ? `ORDER BY ${query.order}` : `ORDER BY comment_reactions.created_date ASC`

        const sql = `
            SELECT
                ${this.getCommentReactionSelectionString()}
            FROM comment_reactions
            ${where}
            ${order}
        `

        const results = await this.core.database.query(sql, params)

        return this.hydrateCommentReactions(results.rows)
    }

    async insertCommentReactions(commentReactions) {
        await this.insert('CommentReaction', commentReactions)
    }

    async deleteCommentReaction(commentReaction) {
        await this.core.database.query(`
            DELETE FROM comment_reactions WHERE comment_reactions.comment_id = $1 AND comment_reactions.user_id = $2
        `, [ commentReaction.commentId, commentReaction.userId ])
    }
}
