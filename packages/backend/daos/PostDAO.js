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
            'group_id': {
                insert: 'allowed',
                update: 'denied',
                select: 'always',
                key: 'groupId'
            },
            'type': {
                insert: 'required',
                update: 'denied',
                select: 'always',
                key: 'type'
            },
            'visibility': {
                insert: 'required',
                update: 'allowed',
                select: 'always',
                key: 'visibility'
            },
            'file_id': {
                insert: 'allowed',
                update: 'allowed',
                select: 'always',
                key: 'fileId'
            },
            'link_preview_id': {
                insert: 'allowed',
                update: 'allowed',
                select: 'always',
                key: 'linkPreviewId'
            },
            'shared_post_id': {
                insert: 'allowed',
                update: 'denied',
                selected: 'always',
                key: 'sharedPostId'
            },
            'site_moderation_id': {
                insert: 'allowed',
                update: 'allowed',
                selected: 'always',
                key: 'siteModerationId'
            },
            'group_moderation_id': {
                insert: 'allowed',
                update: 'allowed',
                selected: 'always',
                key: 'groupModerationId'
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
            'post_files': {
                insert: 'denied',
                update: 'denied',
                select: 'override',
                selectOverride: function(row) {
                    return []
                },
                key: 'files'
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
            }
        }
    },
    'PostVersion': {
        table: 'post_versions',
        fields: {
            'id': {
                insert: 'primary',
                update: 'primary',
                select: 'always',
                key: 'id'
            },
            'post_id': {
                insert: 'allowed',
                update: 'allowed',
                select: 'always',
                key: 'postId'
            },
            'file_id': {
                insert: 'allowed',
                update: 'allowed',
                select: 'always',
                key: 'fileId'
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

module.exports = class PostDAO extends DAO {

    constructor(core) {
        super(core)

        this.core = core

        this.entityMaps = SCHEMA
    }

    getPostSelectionString() {
        return this.getSelectionString('Post')
    }

    hydratePost(row) {
        return this.hydrate('Post', row)
    }

    hydratePosts(rows) {
        const dictionary = {}
        const list = []

        const postReactionDictionary = {}
        const postCommentDictionary = {}
        const fileDictionary = {}

        for(const row of rows) {

            // Hydrate the post.
            if ( ! (row.Post_id in dictionary ) ) {
                dictionary[row.Post_id] = this.hydratePost(row)
                list.push(row.Post_id)
            }

            // Hydrate PostReactions.
            if ( row.PostReaction_id !== null && ! (row.PostReaction_id in postReactionDictionary) ) 
            {
                postReactionDictionary[row.PostReaction_id] = true
                dictionary[row.Post_id].reactions.push(row.PostReaction_id)
            }

            // Hydrate PostComments.
            if ( row.PostComment_id !== null && ! (row.PostComment_id in postCommentDictionary) ) {
                postCommentDictionary[row.PostComment_id] = true 
                dictionary[row.Post_id].comments.push(row.PostComment_id)
            }

            if ( this.core.features.has('feat-15-post-image-galleries') ) {
                // Hydate Files.
                if ( row.File_id !== null && ! ( row.File_id in fileDictionary )) {
                    fileDictionary[row.File_id] = true
                    dictionary[row.Post_id].files.push(row.File_id)
                }
            }
        }

        return { dictionary: dictionary, list: list }
    }

    async getPostById(id) {
        const results = await this.selectPosts({
            where: `posts.id = $1`,
            params: [ id ]
        })

        if ( results.list.length <= 0 || ! ( id in results.dictionary)) {
            return null
        }

        return results.dictionary[id]
    }

    async selectPosts(query) {
        let where = query.where ? `WHERE ${query.where}` : ''
        let params = query.params ? [ ...query.params ] : []
        let page = query.page 
        let order = query.order ? `${query.order}` : `posts.created_date DESC`

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
                post_comments.id as "PostComment_id",
                post_reactions.id as "PostReaction_id"
                ${ this.core.features.has('feat-15-post-image-galleries') ? ', post_files.file_id as "File_id"' : '' }
            FROM posts
                LEFT OUTER JOIN post_reactions ON posts.id = post_reactions.post_id
                LEFT OUTER JOIN post_comments ON posts.id = post_comments.post_id
                ${ this.core.features.has('feat-15-post-image-galleries') ? 'LEFT OUTER JOIN post_files ON posts.id = post_files.post_id' : '' }
                LEFT OUTER JOIN site_moderation ON posts.site_moderation_id = site_moderation.id
                LEFT OUTER JOIN group_moderation ON posts.group_moderation_id = group_moderation.id
            ${where}
            ORDER BY ${order}, post_comments.created_date ASC${ this.core.features.has('feat-15-post-image-galleries') ? ', post_files.position ASC' : '' }
        `
        const results = await this.core.database.query(sql, params)
        console.log(`Results: `, results)

        if ( results.rows.length <= 0 ) {
            return { dictionary: {}, list: [] }
        }

        return this.hydratePosts(results.rows)
    }

    async getPostPageMeta(query) {
        let where = query.where ? `WHERE ${query.where}` : ''
        let params = query.params ? [ ...query.params ] : []
        let page = query.page ? query.page : 1

        const results = await this.core.database.query(`
            SELECT 
                COUNT(*)
            FROM posts
                LEFT OUTER JOIN site_moderation on posts.site_moderation_id = site_moderation.id
                LEFT OUTER JOIN group_moderation on posts.group_moderation_id = group_moderation.id
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
        let where = query.where ? `WHERE ${query.where}` : ''
        let params = query.params ? [ ...query.params ] : []
        let page = query.page ? query.page : 1 
        let order = query.order ? `ORDER BY ${query.order}` : `ORDER BY posts.activity/((EXTRACT(EPOCH from now()) - EXTRACT(EPOCH from posts.created_date))/(60*60)) DESC` 

        const results = await this.core.database.query(`
            SELECT 
                posts.id
            FROM posts
                LEFT OUTER JOIN site_moderation on posts.site_moderation_id = site_moderation.id
                LEFT OUTER JOIN group_moderation on posts.group_moderation_id = group_moderation.id
            ${where}
            ${order}
            LIMIT ${PAGE_SIZE}
            OFFSET ${PAGE_SIZE*(page-1)}
        `, params)

        return results.rows.map((r) => r.id)
    }

    async insertPosts(posts) {
        await this.insert('Post', posts)

        if ( Array.isArray(posts) ) {
            for(const post of posts) {
                await this.insertPostFiles(post)
            }
        } else {
            await this.insertPostFiles(posts)
        }
    }

    async insertPostFiles(post) {
        if ( ! ('files' in post) || ! Array.isArray(post.files) || post.files.length <= 0 ) {
            return
        }

        let sql = `INSERT INTO post_files (post_id, file_id, position) VALUES `
        let params = []

        let counter = 1
        for(const fileId of post.files) {
            sql += `($${params.length+1}, $${params.length+2}, $${params.length+3}),`
            params.push(post.id, fileId, counter)
            counter = counter+1
        }

        // Strip off the final comma
        sql = sql.substring(0, sql.length-1)

        await this.core.database.query(sql, params)
    }

    async insertPostVersions(postVersions) {
        await this.insert('PostVersion', postVersions)
    }

    async updatePost(post) {
        await this.update('Post', post)

        await this.updatePostFiles(post)
    }

    async updatePostFiles(post) {
        await this.core.database.query(`DELETE FROM post_files WHERE post_id = $1`, [ post.id ])

        await this.insertPostFiles(post)
    }

    async updatePostVersion(postVersion) {
        await this.update('PostVersion', postVersion)
    }

    async deletePost(post) {
        await this.core.database.query(`
            DELETE FROM posts WHERE posts.id = $1
        `, [ post.id])
    }

}
