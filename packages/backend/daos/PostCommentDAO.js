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

module.exports = class PostCommentDAO extends DAO {
    constructor(core) {
        super(core)

        this.core = core

        this.entityMaps = {
            'PostComment': {
                table: 'post_comments',
                fields: {
                    'id': {
                        insert: 'primary',
                        update: 'primary',
                        select: 'always',
                        key: 'id'
                    },
                    'user_id': {
                        insert: 'required',
                        update: 'denied',
                        select: 'always',
                        key: 'userId'
                    },
                    'post_id': {
                        insert: 'required',
                        update: 'denied',
                        select: 'always',
                        key: 'postId'
                    },
                    'status': {
                        insert: 'allowed',
                        insertDefault: function() {
                            return 'writing'
                        },
                        update: 'allowed',
                        select: 'always',
                        key: 'status'
                    },
                    'content': {
                        insert: 'required',
                        update: 'allowed',
                        select: 'always',
                        key: 'content'
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
            },
            'PostCommentVersion': {
                table: 'post_comment_versions',
                fields: {
                    'id': {
                        insert: 'primary',
                        update: 'primary',
                        select: 'always',
                        key: 'id'
                    },
                    'post_comment_id': {
                        insert: 'required',
                        update: 'denied',
                        select: 'always',
                        key: 'postCommentId'
                    },
                    'content': {
                        insert: 'allowed',
                        update: 'allowed',
                        select: 'always',
                        key: 'content'
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

    getPostCommentSelectionString() {
        return this.getSelectionString('PostComment')
    }

    hydratePostComment(row) {
        return this.hydrate('PostComment', row)
    }

    hydratePostComments(rows) {
        const dictionary = {}
        const list = []

        for(const row of rows) {
            if ( ! ( row.PostComment_id in dictionary) ) {
                dictionary[row.PostComment_id] = this.hydratePostComment(row)
                list.push(row.PostComment_id)
            }
        }

        return { dictionary: dictionary, list: list }
    }

    async selectPostComments(query) {
        let where = query.where ? `WHERE ${query.where}` : ''
        let params = query.params ? query.params : []
        let page = query.page 
        let order = query.order ? `ORDER BY ${query.order}` : `ORDER BY post_comments.created_date asc`

        if ( page ) {
            const commentIds = await this.getPostCommentPage(query)
            params.push(commentIds)
            if ( where === '' ) {
                where = `WHERE post_comments.id = ANY($${params.length}::uuid[])`
            } else {
                where += ` AND post_comments.id = ANY($${params.length}::uuid[])`
            }
        }

        const sql = `
        SELECT
            ${this.getPostCommentSelectionString()}
        FROM post_comments
        ${where}
        ${order}
        `
        const results = await this.core.database.query(sql, params)

        if ( results.rows.length <= 0 ) {
            return { dictionary: {}, list: [] }
        }

        return this.hydratePostComments(results.rows)
    }

    async getPostCommentPageMeta(query) {
        let where = query.where ? '' : `WHERE ${query.where}`
        let params = query.params ? [] : query.params
        let page = query.page ? 1 : query.page

        const results = await this.core.database.query(`
            SELECT
                COUNT(*)
            FROM post_comments
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

    async getPostCommentPage(query) {
        let where = query.where ? '' : `WHERE ${query.where}`
        let params = query.params ? [] : query.params
        let page = query.page ? 1 : query.page
        let order = query.order ? `ORDER BY ${query.order}` : `ORDER BY post_comments.created_date ASC` 

        const results = await this.core.database.query(`
            SELECT 
                post_comments.id
            FROM post_comments
            ${where}
            ${order}
            LIMIT ${PAGE_SIZE}
            OFFSET ${PAGE_SIZE*(page-1)}
        `, params)

        return results.rows.map((r) => r.id)
    }

    async insertPostComments(postComments) {
        await this.insert('PostComment', postComments)
    }

    async insertPostCommentVersions(postCommentVersions) {
        await this.insert('PostCommentVersion', postCommentVersions)
    }

    async updatePostComment(postComment) {
        await this.update('PostComment', postComment)
    }

    async updatePostCommentVersion(postCommentVersion) {
        await this.update('PostCommentVersion', postCommentVersion)
    }

    async deletePostComment(postComment) {
        await this.core.database.query(`
            DELETE FROM post_comments WHERE post_comments.id = $1
        `, [ postComment.id ])
    }
}
