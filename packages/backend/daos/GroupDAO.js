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
        table: 'posts',
        fields: {
            'id': {
                insert: 'primary',
                update: 'primary',
                select: 'always',
                key: 'id'
            },
            'title': {
                insert: 'required',
                update: 'allowed',
                select: 'always',
                key: 'title'
            },
            'slug': {
                insert: 'required',
                update: 'allowed',
                select: 'always',
                key: 'slug'
            },
            'about': {
                insert: 'alowed',
                update: 'allowed',
                select: 'always',
                key: 'about'
            },
            'file_id': {
                insert: 'allowed',
                update: 'allowed',
                select: 'always',
                key: 'fileId'
            },
            'is_discoverable': {
                insert: 'allowed',
                update: 'allowed',
                select: 'always',
                key: 'isDiscoverable'
            },
            'entrance_questions': {
                insert: 'allowed',
                update: 'allowed',
                select: 'always',
                key: 'entranceQuestions'
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

    getGroupTagSelectionString() {
        return this.getSelectionString('GroupTag')
    }

    hydrateGroup(row) {
        return this.hydrate('Group', row)
    }

    hydrateGroups(rows) {
        const dictionary = {}
        const list = []

        const postTagDictionary = {}
        const postReactionDictionary = {}
        const postCommentDictionary = {}

        for(const row of rows) {

            // Hydrate the post.
            if ( ! (row.Group_id in dictionary ) ) {
                dictionary[row.Group_id] = this.hydrateGroup(row)
                list.push(row.Group_id)
            }

            // Hydrate GroupTags.
            if ( row.GroupTag_tagId !== null && ! ( row.Group_id in postTagDictionary)) {
                postTagDictionary[row.Group_id] = {}
            }

            if ( row.GroupTag_tagId !== null && ! (row.GroupTag_tagId in postTagDictionary)) {
                dictionary[row.Group_id].tags.push(row.GroupTag_tagId)
                postTagDictionary[row.Group_id][row.GroupTag_tagId] = true
            }

            // Hydrate GroupReactions.
            if ( row.GroupReaction_id !== null && ! (row.GroupReaction_id in postReactionDictionary) ) 
            {
                postReactionDictionary[row.GroupReaction_id] = true
                dictionary[row.Group_id].reactions.push(row.GroupReaction_id)
            }

            // Hydrate GroupComments.
            if ( row.GroupComment_id !== null && ! (row.GroupComment_id in postCommentDictionary) ) {
                postCommentDictionary[row.GroupComment_id] = true 
                dictionary[row.Group_id].comments.push(row.GroupComment_id)
            }
        }

        return { dictionary: dictionary, list: list }
    }

    async getGroupById(id) {
        const results = await this.selectGroups({
            where: `posts.id = $1`,
            params: [ id ]
        })

        if ( results.list.length <= 0 || ! ( id in results.dictionary)) {
            return null
        }

        return results.dictionary[id]
    }

    async selectGroups(query) {
        let where = query.where ? `WHERE ${query.where}` : ''
        let params = query.params ? [ ...query.params ] : []
        let page = query.page 
        let order = query.order ? `${query.order}` : 
            `posts.activity/((EXTRACT(EPOCH from now()) - EXTRACT(EPOCH from posts.created_date))/(60*60)) DESC`

        if ( page ) {
            const postIds = await this.getGroupPage(query)
            params.push(postIds)
            if ( where === '' ) {
                where = `WHERE posts.id = ANY($${params.length}::uuid[])`
            } else {
                where += ` AND posts.id = ANY($${params.length}::uuid[])`
            }
        }

        const sql = `
            SELECT
                ${this.getGroupSelectionString()},
                ${this.getGroupTagSelectionString()},
                post_comments.id as "GroupComment_id",
                post_reactions.id as "GroupReaction_id"
            FROM posts
                LEFT OUTER JOIN post_reactions ON posts.id = post_reactions.post_id
                LEFT OUTER JOIN post_comments ON posts.id = post_comments.post_id
                LEFT OUTER JOIN post_tags ON posts.id = post_tags.post_id
            ${where}
            ORDER BY ${order}, post_comments.created_date ASC 
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

    async getGroupPage(query) {
        let where = query.where ? `WHERE ${query.where}` : ''
        let params = query.params ? [ ...query.params ] : []
        let page = query.page ? query.page : 1 
        let order = query.order ? `ORDER BY ${query.order}` : `ORDER BY posts.activity/((EXTRACT(EPOCH from now()) - EXTRACT(EPOCH from posts.created_date))/(60*60)) DESC` 

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

    async insertGroups(posts) {
        await this.insert('Group', posts)
    }

    async insertGroupTags(postTags) {
        await this.insert('GroupTag', postTags)
    }

    async insertGroupVersions(postVersions) {
        await this.insert('GroupVersion', postVersions)
    }

    async updateGroup(post) {
        await this.update('Group', post)
    }

    async updateGroupVersion(postVersion) {
        await this.update('GroupVersion', postVersion)
    }

    async deleteGroup(post) {
        await this.core.database.query(`
            DELETE FROM posts WHERE posts.id = $1
        `, [ post.id])
    }

    async deleteGroupTag(postTag) {
        await this.core.database.query(`
            DELETE FROM post_tags WHERE post_tags.post_id = $1 AND post_tags.tag_id = $2
        `, [ postTag.postId, postTag.tagId ])
    }

}
