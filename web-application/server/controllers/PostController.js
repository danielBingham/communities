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

const { PostDAO, PostCommentDAO, PostReactionDAO, UserDAO, FileDAO }  = require('@danielbingham/communities-backend')
const ControllerError = require('../errors/ControllerError')


module.exports = class PostController {

    constructor(core) {
        this.core = core

        this.postDAO = new PostDAO(core)
        this.postCommentDAO = new PostCommentDAO(core)
        this.postReactionDAO = new PostReactionDAO(core)
        this.userDAO = new UserDAO(core)
        this.fileDAO = new FileDAO(core)
    }

    async getRelations(results, requestedRelations) {
        const userIds = []
        for(const postId of results.list) {
            const post = results.dictionary[postId]

            userIds.push(post.userId)
        }
        const userResults = await this.userDAO.selectUsers(`WHERE users.id = ANY($1::uuid[])`, [ userIds ])

        const postCommentResults = await this.postCommentDAO.selectPostComments({
            where: `post_comments.post_id = ANY($1::uuid[])`,
            params: [ results.list]
        })

        const postReactionResults = await this.postReactionDAO.selectPostReactions({
            where: `post_reactions.post_id = ANY($1::uuid[])`,
            params: [ results.list ]
        })

        const fileIds = []
        for(const postId of results.list) {
            const post = results.dictionary[postId]
            fileIds.push(post.fileId)
        }
        const postFileResults = await this.fileDAO.selectFiles(`WHERE files.id = ANY($1::uuid[])`, [ fileIds ])
        const fileDictionary = postFileResults.reduce((dictionary, file) => { dictionary[file.id] = file; return dictionary }, {})

        return {
            users: userResults.dictionary,
            postComments: postCommentResults.dictionary,
            postReactions: postReactionResults.dictionary,
            files: fileDictionary 
        }
    }

    async createQuery(request) {
        console.log(request.query)
        const query = {
            where: '',
            params: [],
            page: 1,
            order: 'posts.activity/((EXTRACT(EPOCH from now()) - EXTRACT(EPOCH from posts.created_date))/(60*60)) DESC'
        }

        const currentUser = request.session.user

        if ( 'userId' in request.query ) {
            query.params.push(request.query.userId)
            const and = query.params.length > 1 ? ' AND ' : ''
            query.where += `${and}posts.user_id = $${query.params.length}`
        }

        // Visible posts
        const friendResults = await this.core.database.query(`
            SELECT
                user_id, friend_id
            FROM user_relationships
                WHERE user_id = $1 OR friend_id = $1
        `, [ currentUser.id ])

        const friendIds = friendResults.rows.map((r) => r.user_id == currentUser.id ? r.friend_id : r.user_id)
        friendIds.push(currentUser.id)

        query.params.push(friendIds)
        query.where += `${ query.params.length > 1 ? ' AND ' : ''}posts.user_id = ANY($${query.params.length}::uuid[])`

        if ( 'sort' in request.query ) {
            const sort = request.query.sort
            if ( sort == 'newest' ) {
                query.order = 'posts.created_date DESC'
            } 
        }

        if ( 'page' in request.query) {
            query.page = request.query.page
        }

        return query
    }

    async getPosts(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to retrieve posts.`,
                `You must be authenticated to retrieve posts.`)
        }

        const query = await this.createQuery(request)

        const results = await this.postDAO.selectPosts(query)

        results.meta = await this.postDAO.getPostPageMeta(query)

        results.relations = await this.getRelations(results)

        response.status(200).json(results)
    }

    async postPosts(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to create a post.`,
                `You must must be authenticated to create a post.`)
        }

        const post = request.body

        if ( post.content && post.content.length > 10000 ) {
            throw new ControllerError(400, 'invalid',
                `Post too long.`,
                `Your post was too long.  Please keep posts to 10,000 characters or under.`)
        }

        await this.postDAO.insertPosts(post)

        const results = await this.postDAO.selectPosts({
            where: `posts.id = $1`,
            params: [ post.id ]
        })

        const entity = results.dictionary[post.id]

        if ( ! entity ) {
            throw new ControllerError(500, 'server-error',
                `Post(${post.id}) missing after creation.`,
                `Post(${post.id}) missing after being created.  Please report as a bug.`)
        }

        const postVersion = {
            postId: entity.id,
            fileId: entity.fileId,
            content: entity.content
        }
        await this.postDAO.insertPostVersions(postVersion)

        const relations = await this.getRelations(results)

        response.status(201).json({
            entity: results.dictionary[results.list[0]],
            relationships: relations
        })
    }

    async getPost(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to retrieve posts.`,
                `You must be authenticated to retrieve posts.`)
        }

        const postId = request.params.id

        const postResults = await this.postDAO.selectPosts({
            where: `posts.id = $1`,
            params: [ postId ]
        })

        const post = postResults.dictionary[postId]

        if ( ! post ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to access Post(${postId}) that doesn't exist.`,
                `That post either doesn't exist or you don't have permission to access it.`)
        }

        if ( currentUser.id !== post.userId && post.status !== 'posted' ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to access Post(${postId}) not posted.`,
                `That post either doesn't exist or you don't have permission to access it.`)
        }

        const friendResults = await this.core.database.query(`
            SELECT
                user_id, friend_id
            FROM user_relationships
                WHERE user_id = $1 OR friend_id = $1
        `, [ post.userId ])

        const isFriend = friendResults.rows.find((r) => r.user_id == currentUser.id || r.friend_id == currentUser.id)
        if ( ! isFriend && currentUser.id != post.userId ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to access Post(${postId}) without permission.`,
                `That post either doesn't exist or you don't have permission to see it.`)
        }

        const relationships = await this.getRelations(postResults)

        response.status(200).json({
            entity: post,
            relations: relationships
        })
    }

    async patchPost(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to edit a post.`,
                `You must must be authenticated to edit a post.`)
        }

        const post = request.body

        if ( post.content && post.content.length > 10000 ) {
            throw new ControllerError(400, 'invalid',
                `Post too long.`,
                `Your post was too long.  Please keep posts to 10,000 characters or under.`)
        }

        if ( post.status == 'writing' || post.status == 'editing' || post.status == 'posted') {
            await this.postDAO.updatePost(post)
        } else if ( post.status == 'reverting' ) {
            const previousResults = await this.core.database.query(`
                SELECT file_id, content 
                    FROM post_versions
                    WHERE post_id = $1 
                    ORDER BY created_date DESC
                    LIMIT 1
            `, [ post.id ])

            const previous = previousResults.rows[0]

            const postRevert = {
                id: post.id,
                fileId: previous.file_id,
                content: previous.content
            }
            await this.postDAO.updatePost(postRevert)
        }

        const results = await this.postDAO.selectPosts({
            where: `posts.id = $1`,
            params: [ post.id ]
        })

        const entity = results.dictionary[post.id]

        if ( post.status == 'posted' ) {
            const postVersion = {
                postId: entity.id,
                fileId: entity.fileId,
                content: entity.content
            }
            await this.postDAO.insertPostVersions(postVersion)
        }

        const relations = await this.getRelations(results)

        response.status(201).json({
            entity: results.dictionary[results.list[0]],
            relationships: relations
        })

    }

    async deletePost(request, response) {
        const currentUser = request.session.user
        const postId = request.params.id

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to edit a post.`,
                `You must must be authenticated to edit a post.`)
        }


        const existingResults = await this.postDAO.selectPosts({
            where: `posts.id = $1`,
            params: [ postId ]
        })

        const existing = existingResults.dictionary[postId]

        if ( existing.userId !== currentUser.id ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to delete Post(${postId}) of User(${existing.userId}).`,
                `You may not delete another user's posts.`)
        }

        await this.postDAO.deletePost(existing)

        response.status(201).json({})

    }

}
