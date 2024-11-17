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

module.exports = class PostDAO extends DAO {

    constructor(core) {
        super(core)

        this.core = core

        this.entityMaps = {
            'Post': {
                table: 'posts',
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
                    'file_id': {
                        insert: allowed,
                        update: allowed,
                        select: always,
                        key: 'fileId'
                    },
                    'activity': {
                        insert: 'allowed',
                        insertDefault: function() {
                            return 1
                        },
                        update: 'allowed',
                        select: 'always',
                        key: 'activity'
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
                    },
                    'post_reactions': {
                        insert: 'denied',
                        update: 'denied',
                        select: 'override',
                        selectOverride: function(row) {
                            return []
                        },
                        key: 'reactions'
                    },
                    'post_comments': {
                        insert: 'denied',
                        update: 'denied',
                        select: 'override',
                        selectOverride: function(row) {
                            return []
                        },
                        key: 'comments'
                    },
                    'post_tags': {
                        insert: 'denied',
                        update: 'denied',
                        select: 'override',
                        selectOverride: function(row) {
                            return []
                        },
                        key: 'tags'
                    }
                }
            },
            'PostTag': {
                table: 'post_tags',
                fields: {
                    'post_id': {
                        insert: 'required',
                        update: 'primary',
                        select: 'never',
                        key: 'postId'
                    },
                    'tag_id': {
                        insert: 'required',
                        update: 'primary',
                        select: 'always',
                        key: 'tagId'
                    },
                    'created_date': {
                        insert: 'override',
                        insertOverride: 'now()',
                        update: 'denied',
                        select: 'never',
                        key: 'createdDate'
                    }
                }
            },
            'PostReaction': {
                table: 'post_reactions',
                fields: {
                    'post_id': {
                        insert: 'required',
                        update: 'primary',
                        select: 'always',
                        key: 'postId'
                    },
                    'user_id': {
                        insert: 'required',
                        update: 'primary',
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

    getPostSelectionString() {
        return this.getSelectionString('Post')
    }

    getPostTagSelectionString() {
        return this.getSelectionString('PostTag')
    }

    getPostReactionSelectionString() {
        return this.getSelectionString('PostReaction')
    }


    hydratePost(row) {
        return this.hydrate('Post', row)
    }

    hydratePostReaction(row) {
        return this.hydrate('PostReaction', row)
    }


    hydratePosts(rows) {
        const dictionary = {}
        const list = []

        const postTagDictionary = {}
        const postReactionDictionary = {}
        const postCommentDictionary = {}
        const postCommentReactionDictionary = {}

        for(const row of rows) {

            // Hydrate the post.
            if ( ! (row.Post_id in dictionary ) ) {
                dictionary[row.Post_id] = this.hydratePost(row)
                list.push(row.Post_id)
            }

            // Hydrate PostTags.
            if ( row.PostTag_tagId !== null && ! ( row.Post_id in postTagDictionary)) {
                postTagDictionary[row.Post_id] = {}
            }

            if ( row.PostTag_tagId !== null && ! (row.PostTag_tagId in postTagDictionary)) {
                dictionary[row.Post_id].tags.push(row.PostTag_tagId)
                postTagDictionary[row.Post_id][row.PostTag_tagId] = true
            }

            // Hydrate PostReactions.
            if ( row.PostReaction_postId !== null 
                && ! (row.PostReaction_postId in postReactionDictionary) ) 
            {
                postReactionDictionary[row.PostReaction_postId] = {}
            }

            if ( row.PostReaction_userId !== null 
                && ! (row.PostReaction_userId in postReactionDictionary[row.PostReaction_postId])) 
            {
                const reaction = this.hydratePostReaction(row)
                postReactionDictionary[reaction.postId][reaction.userId] = reaction
                dictionary[reaction.postId].reactions.push(reaction)
            }

            // Hydrate PostComments.
            if ( row.PostComment_id !== null && ! (row.PostComment_id in postCommentDictionary) ) {
                postCommentDictionary[row.PostComment_id] = true 
                dictionary[row.Post_id].comments.push(row.PostComment_id)
            }
        }

        return { dictionary: dictionary, list: list }
    }

    async selectPosts(query) {
        let where = query.where ? `WHERE ${query.where}` : ''
        let params = query.params ? query.params : []
        let page = query.page 
        let order = query.order ? `ORDER BY ${query.order}` : 
            `ORDER BY posts.activity/((EXTRACT(EPOCH from now()) - EXTRACT(EPOCH from posts.created_date))/(60*60)) DESC, post_comments.created_date ASC`

        if ( page ) {
            const postIds = await this.getPostPage(query)
            params.push(postIds)
            if ( where === '' ) {
                where = `WHERE posts.id = ANY($${params.length}::uuid[])`
            } else {
                where += ` AND posts.id = ANY($${params.length}::uuid[])`
            }
        }

        const sql = `
            SELECT
                ${this.getPostSelectionString()},
                ${this.getPostReactionSelectionString()},
                post_comments.id as "PostComment_id",
                ${this.getPostTagSelectionString()}
            FROM posts
                LEFT OUTER JOIN post_reactions ON posts.id = post_reactions.post_id
                LEFT OUTER JOIN post_comments ON posts.id = post_comments.post_id
                LEFT OUTER JOIN post_tags ON posts.id = post_tags.post_id
            ${where}
            ${order}
        `

        const results = await this.core.database.query(sql, params)

        if ( results.rows.length <= 0 ) {
            return { dictionary: {}, list: [] }
        }

        return this.hydratePosts(results.rows)
    }

    async getPostPageMeta(query) {
        let where = query.where ? '' : `WHERE ${query.where}`
        let params = query.params ? [] : query.params
        let page = query.page ? 1 : query.page

        const results = await this.core.database.query(`
                SELECT 
                    COUNT(*)
                FROM posts
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

    async getPostPage(query) {
        let where = query.where ? '' : `WHERE ${query.where}`
        let params = query.params ? [] : query.params
        let page = query.page ? 1 : query.page
        let order = query.order ? `ORDER BY ${query.order}` : `ORDER BY posts.activity DESC, posts.created_date DESC` 

        const results = await this.core.database.query(`
            SELECT 
                posts.id
            FROM posts
            ${where}
            ${order}
            LIMIT ${PAGE_SIZE}
            OFFSET ${PAGE_SIZE*(page-1)}
        `, params)

        return results.rows.map((r) => r.id)
    }

    async insertPosts(posts) {
        await this.insert('Post', posts)
    }

    async insertPostTags(postTags) {
        await this.insert('PostTag', postTags)
    }

    async insertPostReactions(postReactions) {
        await this.insert('PostReaction', postReactions)
    }


    async updatePost(post) {
        await this.update('Post', post)
    }

    async updatePostReaction(postReaction) {
        await this.update('PostReaction', postReaction)
    }


    async deletePost(post) {
        await this.core.database.query(`
            DELETE FROM posts WHERE posts.id = $1
        `, [ post.id])
    }

    async deletePostTag(postTag) {
        await this.core.database.query(`
            DELETE FROM post_tags WHERE post_tags.post_id = $1 AND post_tags.tag_id = $2
        `, [ postTag.postId, postTag.tagId ])
    }

    async deletePostReaction(postReaction) {
        await this.core.database.query(`
            DELETE FROM post_reactions WHERE post_reactions.post_id = $1 AND post_reactions.user_id = $2
        `, [ postReaction.postId, postReaction.userId])
    }

}
