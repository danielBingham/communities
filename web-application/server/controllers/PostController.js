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

const { LinkPreviewService, PostDAO, PostCommentDAO, PostReactionDAO, PostSubscriptionDAO, UserDAO, FileDAO, GroupDAO }  = require('@communities/backend')
const ControllerError = require('../errors/ControllerError')


module.exports = class PostController {

    constructor(core) {
        this.core = core

        this.postDAO = new PostDAO(core)
        this.postCommentDAO = new PostCommentDAO(core)
        this.postReactionDAO = new PostReactionDAO(core)
        this.postSubscriptionDAO = new PostSubscriptionDAO(core)
        this.userDAO = new UserDAO(core)
        this.fileDAO = new FileDAO(core)
        this.groupDAO = new GroupDAO(core)

        this.linkPreviewService = new LinkPreviewService(core)
    }

    async getRelations(currentUser, results, requestedRelations) {
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

        const postSubscriptionResults = await this.postSubscriptionDAO.selectPostSubscriptions({
            where: `post_subscriptions.post_id = ANY($1::uuid[]) AND post_subscriptions.user_id = $2`,
            params: [ results.list, currentUser.id ]
        })


        const fileIds = []
        for(const postId of results.list) {
            const post = results.dictionary[postId]
            fileIds.push(post.fileId)
        }
        const postFileResults = await this.fileDAO.selectFiles(`WHERE files.id = ANY($1::uuid[])`, [ fileIds ])
        const fileDictionary = postFileResults.reduce((dictionary, file) => { dictionary[file.id] = file; return dictionary }, {})
        
        const groupIds = []
        for(const postId of results.list) {
            const post = results.dictionary[postId]
            groupIds.push(post.groupId)
        }
        const groupResults = await this.groupDAO.selectGroups({
            where: `groups.id = ANY($1::uuid[])`,
            params: [ groupIds ]
        })

        return {
            users: userResults.dictionary,
            postComments: postCommentResults.dictionary,
            postReactions: postReactionResults.dictionary,
            postSubscriptions: postSubscriptionResults.dictionary,
            files: fileDictionary,
            groups: groupResults.dictionary
        }
    }

    async createQuery(request) {
        const query = {
            where: '',
            params: [],
            page: 1,
            order: '( posts.activity/POWER(CEILING((EXTRACT(EPOCH from now()) - EXTRACT(EPOCH from posts.created_date))/(60*60)), 2)) DESC'
        }

        const currentUser = request.session.user

        // ========== Post Visibility ===================== 
       
        // Posts by friends
        const friendResults = await this.core.database.query(`
            SELECT
                user_id, friend_id
            FROM user_relationships
                WHERE (user_id = $1 OR friend_id = $1) AND status = 'confirmed'
        `, [ currentUser.id ])

        const friendIds = friendResults.rows.map((r) => r.user_id == currentUser.id ? r.friend_id : r.user_id)
        friendIds.push(currentUser.id)

        // Posts in groups
        const groupResults = await this.core.database.query(`
            SELECT group_id FROM group_members WHERE user_id = $1 AND status = 'member'
        `, [ currentUser.id ])

        const groupIds = groupResults.rows.map((r) => r.group_id)

        // Permissions 
        query.params.push(friendIds)
        query.params.push(groupIds)
        query.where += `((posts.user_id = ANY($${query.params.length-1}::uuid[]) AND posts.type = 'feed') OR (posts.type = 'group' AND posts.group_id = ANY($${query.params.length}::uuid[])))`

        if ( 'userId' in request.query ) {
            query.params.push(request.query.userId)
            const and = query.params.length > 1 ? ' AND ' : ''
            query.where += `${and}posts.user_id = $${query.params.length}`
        }

        if ( 'groupId' in request.query ) {
            query.params.push(request.query.groupId)
            const and = query.params.length > 1 ? ' AND ' : ''
            query.where += `${and}posts.group_id = $${query.params.length}`
        }

        if ( 'groupSlug' in request.query ) {
            const groupResult = await this.core.database.query(`SELECT id FROM groups WHERE slug = $1`, [ request.query.groupSlug ])
            if ( groupResult.rows.length <= 0 ) {
                query.page = -1 
                return query
            }

            const groupId = groupResult.rows[0].id

            query.params.push(groupId)
            const and = query.params.length > 1 ? ' AND ' : ''
            query.where += `${and}posts.group_id = $${query.params.length}`
        }

        if ( 'username' in request.query ) {
            const userResult = await this.core.database.query(`SELECT id FROM users WHERE username = $1`, [ request.query.username ])
            if ( userResult .rows.length <= 0 ) {
                query.page = -1
                return query
            }

            const userId = userResult.rows[0].id

            query.params.push(userId)
            const and = query.params.length > 1 ? ' AND ' : ''
            query.where += `${and}posts.user_id = $${query.params.length}`
        }

        if ( 'feed' in request.query )  {
            if ( request.query.feed == 'friends' ) {
                query.params.push(friendIds)
                const and = query.params.length > 1 ? ' AND ' : ''
                query.where += `${and} (posts.type = 'feed' AND posts.user_id = ANY($${query.params.length}::uuid[]))`
            }
        }

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

        // Empty result.
        if ( query.page === -1 ) {
            response.status(200).json({
                dictionary: {},
                list: [],
                meta: {
                    count: 0,
                    page: 1,
                    pageSize: 1,
                    numberOfPages: 1
                },
                relations: {}
            })
            return
        }

        const results = await this.postDAO.selectPosts(query)

        results.meta = await this.postDAO.getPostPageMeta(query)

        results.relations = await this.getRelations(currentUser, results)

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

        // Subscribe the author to their post.
        await this.postSubscriptionDAO.insertPostSubscriptions({
            postId: entity.id,
            userId: currentUser.id
        })

        const relations = await this.getRelations(currentUser, results)

        response.status(201).json({
            entity: results.dictionary[results.list[0]],
            relations: relations
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

        const relations = await this.getRelations(currentUser, postResults)

        response.status(200).json({
            entity: post,
            relations: relations 
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

        await this.postDAO.updatePost(post)

        const results = await this.postDAO.selectPosts({
            where: `posts.id = $1`,
            params: [ post.id ]
        })

        const entity = results.dictionary[post.id]

        const postVersion = {
            postId: entity.id,
            fileId: entity.fileId,
            content: entity.content
        }
        await this.postDAO.insertPostVersions(postVersion)

        const relations = await this.getRelations(currentUser, results)

        response.status(201).json({
            entity: results.dictionary[results.list[0]],
            relations: relations
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

    async postLinkPreview(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to generate a link preview.`,
                `You must must be authenticated to generate a link preview`)
        }

        const url = request.body.url

        const preview = await this.linkPreviewService.getPreview(url)

        response.status(200).json(preview)
    }

}
