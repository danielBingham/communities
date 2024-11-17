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

const { PostDAO, PostCommentDAO, UserDAO }  = require('@danielbingham/communities-backend')
const ControllerError = require('../errors/ControllerError')


module.exports = class PostController {

    constructor(core) {
        this.core = core

        this.postDAO = new PostDAO(core)
        this.postCommentDAO = new PostCommentDAO(core)
        this.userDAO = new UserDAO(core)
    }

    async getRelations(results, requestedRelations) {
        const userIds = []
        for(const postId of results.list) {
            const post = results.dictionary[postId]

            userIds.push(post.userId)
        }
        const userResults = await this.userDAO.selectUsers(`WHERE users.id = ANY($1::uuid[])`, [ userIds ])

        const postCommentIds = []
        for(const postId of results.list) {
            const post = results.dictionary[postId]

            postCommentIds.push(...post.comments)
        }
        const postCommentResults = await this.postCommentDAO.selectPostComments({
            where: `post_comments.id = ANY($1::uuid[])`,
            params: [ postCommentIds ]
        })

        return {
            users: userResults.dictionary,
            postComments: postCommentResults.dictionary
        }
    }

    async createQuery(request) {
        const query = {
            where: '',
            params: [],
            page: 1
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

        await this.postDAO.insertPosts(post)
        const tags = post.tags.map((tagId) => { return { postId: post.id, tagId: tagId }})
        await this.postDAO.insertPostTags(tags)

        const results = await this.postDAO.selectPosts({
            where: `posts.id = $1`,
            params: [ post.id ]
        })

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
                `That post either doesn't exist or you don't have permission to see it.`)
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

    }

    async deletePost(request, response) {

    }

    async postPostReaction(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to react to a post.`,
                `You must be authenticated to reaction to a post.`)
        }

        const postId = request.params.postId
       

        const results = await this.core.database.query(`
            SELECT posts.activity FROM posts WHERE posts.id = $1
        `, [ postId ])

        if ( results.rows.length <= 0 ) {
            throw new ControllerError(404, 'not-found',
                `Post(${postId}) was not found by User(${currentUser.id}) attempting to react.`,
                `That post either doesn't exist or you don't have permission to see it.`)
        }

        const existing = await this.core.database.query(`
            SELECT reaction FROM post_reactions WHERE post_reactions.post_id = $1 AND post_reactions.user_id = $2
        `, [ postId, currentUser.id])

        if ( existing.rows.length > 0 ) {
            throw new ControllerError(400, 'invalid',
                `User(${currentUser.id}) attempted to react to Post(${postId}) twice.`,
                `You can only react to a post once.`)
        }

        const reaction = {
            postId: postId,
            userId: currentUser.id,
            reaction: request.body.reaction
        }

        await this.postDAO.insertPostReactions(reaction)

        let activity = results.rows[0].activity
        if ( reaction.reaction == 'block' ) {
            activity -= 1
        } else {
            activity += 1
        }

        const post = {
            id: postId,
            activity: activity
        }

        await this.postDAO.updatePost(post)

        const postResult = await this.postDAO.selectPosts({
            where: `posts.id = $1`,
            params: [ postId ]
        })

        const entity = postResult.dictionary[postId]

        if ( ! entity ) {
            throw new ControllerError(500, 'server-error',
                `Post(${postId}) missing after update.`,
                `Post missing after being updated.  Please report as a bug.`)
        }

        response.status(201).json({
            entity: entity,
            relations: await this.getRelations(postResult)
        })
    }

    async patchPostReaction(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to react to a post.`,
                `You must be authenticated to reaction to a post.`)
        }

        const postId = request.params.postId

        const existingPostResults = await this.core.database.query(`
            SELECT posts.activity FROM posts WHERE posts.id = $1
        `, [ postId ])

        if ( existingPostResults.rows.length <= 0 ) {
            throw new ControllerError(404, 'not-found',
                `Post(${postId}) was not found by User(${currentUser.id}) attempting to react.`,
                `That post either doesn't exist or you don't have permission to see it.`)
        }

        const existing = await this.core.database.query(`
            SELECT user_id, reaction FROM post_reactions WHERE post_reactions.post_id = $1 AND post_reactions.user_id = $2
        `, [ postId, currentUser.id])

        if ( existing.rows.length <= 0 ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempted to patch reaction to Post(${postId}) but not existed.`,
                `You can't patch a reaction that doesn't exist.  Try POST to create a reaction.`)
        }

        const reaction = {
            postId: postId,
            userId: currentUser.id,
            reaction: request.body.reaction
        }

        await this.postDAO.updatePostReaction(reaction)

        let activity = existingPostResults.rows[0].activity
        let existingReaction = existing.rows[0].reaction
        if ( existingReaction != 'block' && reaction.reaction == 'block' ) {
            activity -= 2
        } else if ( existingReaction == 'block' && reaction.reaction != 'block') {
            activity += 2
        }

        const post = {
            id: postId,
            activity: activity
        }

        await this.postDAO.updatePost(post)

        const postResult = await this.postDAO.selectPosts({
            where: `posts.id = $1`,
            params: [ postId ]
        })

        const entity = postResult.dictionary[postId]

        if ( ! entity ) {
            throw new ControllerError(500, 'server-error',
                `Post(${postId}) missing after update.`,
                `Post missing after being updated.  Please report as a bug.`)
        }

        response.status(201).json({
            entity: entity,
            relations: await this.getRelations(postResult)
        })
    }

    async deletePostReaction(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to react to a post.`,
                `You must be authenticated to reaction to a post.`)
        }

        const postId = request.params.postId

        const existingPostResults = await this.core.database.query(`
            SELECT posts.activity FROM posts WHERE posts.id = $1
        `, [ postId ])

        if ( existingPostResults.rows.length <= 0 ) {
            throw new ControllerError(404, 'not-found',
                `Post(${postId}) was not found by User(${currentUser.id}) attempting to react.`,
                `That post either doesn't exist or you don't have permission to see it.`)
        }

        const existing = await this.core.database.query(`
            SELECT user_id, reaction FROM post_reactions WHERE post_reactions.post_id = $1 AND post_reactions.user_id = $2
        `, [ postId, currentUser.id])

        if ( existing.rows.length <= 0 ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempted to delete reaction to Post(${postId}) but no reaction found.`,
                `You can't delete a reaction that doesn't exist.`)
        }

        const reaction = {
            postId: postId,
            userId: currentUser.id,
        }

        await this.postDAO.deletePostReaction(reaction)

        let activity = existingPostResults.rows[0].activity
        let existingReaction = existing.rows[0].reaction

        if ( existingReaction == 'block')  {
            activity += 1
        } else {
            activity -= 1
        }

        const post = {
            id: postId,
            activity: activity
        }

        await this.postDAO.updatePost(post)

        const postResult = await this.postDAO.selectPosts({
            where: `posts.id = $1`,
            params: [ postId ]
        })

        const entity = postResult.dictionary[postId]

        if ( ! entity ) {
            throw new ControllerError(500, 'server-error',
                `Post(${postId}) missing after update.`,
                `Post missing after being updated.  Please report as a bug.`)
        }

        response.status(201).json({
            entity: entity,
            relations: await this.getRelations(postResult)
        })
    }

}
