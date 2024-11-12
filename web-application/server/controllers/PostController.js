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

const { PostDAO }  = require('@danielbingham/communities-backend')
const ControllerError = require('../errors/ControllerError')


module.exports = class PostController {

    constructor(core) {
        this.core = core

        this.postDAO = new PostDAO(core)
    }

    async getRelations(results, requestedRelations) {
        return {}
    }

    async getPosts(request, response) {

        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to retrieve posts.`,
                `You must be authenticated to retrieve posts.`)
        }

        const friendResults = await this.core.database.query(`
            SELECT
                user_id, friend_id
            FROM user_relationships
                WHERE user_id = $1 OR friend_id = $1
        `, [ currentUser.id ])

        const friendIds = friendResults.rows.map((r) => r.user_id == currentUser.id ? r.friend_id : r.user_id)

        console.log(friendIds)

        const query = {
            where: 'posts.user_id = $1 OR posts.user_id = ANY($2::uuid[])',
            params: [ currentUser.id, friendIds ],
            page: 1
        }
        const results = await this.postDAO.selectPosts(query)

        results.meta = await this.postDAO.getPostPageMeta(query)

        results.relationships = await this.getRelations(results)

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

    }

    async patchPost(request, response) {

    }

    async deletePost(request, response) {

    }

    async postPostReactions(request, response) {
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

}
