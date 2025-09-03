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

const {
    LinkPreviewService,
    PermissionService,
    NotificationService,
    ValidationService,

    FileDAO,
    GroupDAO,
    GroupMemberDAO,
    GroupModerationDAO,
    GroupModerationEventDAO,
    LinkPreviewDAO,
    PostDAO,
    PostCommentDAO,
    PostReactionDAO,
    PostSubscriptionDAO,
    SiteModerationDAO,
    UserDAO
} = require('@communities/backend')

const { lib, cleaning, validation } = require('@communities/shared')

const ControllerError = require('../errors/ControllerError')


module.exports = class PostController {

    constructor(core) {
        this.core = core

        this.fileDAO = new FileDAO(core)
        this.groupDAO = new GroupDAO(core)
        this.groupMemberDAO = new GroupMemberDAO(core)
        this.groupModerationDAO = new GroupModerationDAO(core)
        this.groupModerationEventDAO = new GroupModerationEventDAO(core)
        this.linkPreviewDAO = new LinkPreviewDAO(core)
        this.postDAO = new PostDAO(core)
        this.postCommentDAO = new PostCommentDAO(core)
        this.postReactionDAO = new PostReactionDAO(core)
        this.postSubscriptionDAO = new PostSubscriptionDAO(core)
        this.siteModerationDAO = new SiteModerationDAO(core)
        this.userDAO = new UserDAO(core)

        this.linkPreviewService = new LinkPreviewService(core)
        this.notificationService = new NotificationService(core)
        this.permissionService = new PermissionService(core)
        this.validationService = new ValidationService(core)
    }

    async getRelations(currentUser, results, requestedRelations) {

        // We only need these for the initial posts.  These are not displayed on Shared Posts.
        //
        const postCommentResults = await this.postCommentDAO.selectPostComments({
            where: `post_comments.post_id = ANY($1::uuid[])`,
            params: [results.list]
        })

        const postReactionResults = await this.postReactionDAO.selectPostReactions({
            where: `post_reactions.post_id = ANY($1::uuid[])`,
            params: [results.list]
        })

        const postSubscriptionResults = await this.postSubscriptionDAO.selectPostSubscriptions({
            where: `post_subscriptions.post_id = ANY($1::uuid[]) AND post_subscriptions.user_id = $2`,
            params: [results.list, currentUser.id]
        })

        // Get the Shared Posts as relations.
        const sharedPostIds = []
        for(const postId of results.list) {
            const post = results.dictionary[postId]
            if ( post.sharedPostId !== null ) {
                sharedPostIds.push(post.sharedPostId)
            }
        }
        const sharedPostResults = await this.postDAO.selectPosts({
            where: `posts.id = ANY($1::uuid[])`,
            params: [ sharedPostIds ]
        })

        // These will be displayed on Shared Posts, so we need to retrieve them
        // both for the top level posts and the shared posts.
        const userIds = []
        for (const postId of results.list) {
            const post = results.dictionary[postId]

            userIds.push(post.userId)
        }
        for(const postId of sharedPostResults.list) {
            const post = sharedPostResults.dictionary[postId]
            userIds.push(post.userId)
        }

        const fileIds = []
        for (const postId of results.list) {
            const post = results.dictionary[postId]
            if ( post.fileId !== null ) {
                fileIds.push(post.fileId)
            }
        }
        for(const postId of sharedPostResults.list) {
            const post = sharedPostResults.dictionary[postId]
            if ( post.fileId !== null ) {
                fileIds.push(post.fileId)
            }
        }
        const postFileResults = await this.fileDAO.selectFiles(`WHERE files.id = ANY($1::uuid[])`, [fileIds])
        const fileDictionary = postFileResults.reduce((dictionary, file) => { dictionary[file.id] = file; return dictionary }, {})

        const linkPreviewIds = []
        for(const postId of results.list) {
            const post = results.dictionary[postId]
            if ( post.linkPreviewId !== null ) {
                linkPreviewIds.push(post.linkPreviewId)
            }
        }
        for(const postId of sharedPostResults.list) {
            const post = sharedPostResults.dictionary[postId]
            if ( post.linkPreviewId !== null ) {
                linkPreviewIds.push(post.linkPreviewId)
            }
        }
        const linkPreviewResults = await this.linkPreviewDAO.selectLinkPreviews({
            where: `link_previews.id = ANY($1::uuid[])`,
            params: [ linkPreviewIds ]
        })

        const userResults = await this.userDAO.selectUsers({ where: `users.id = ANY($1::uuid[])`, params: [userIds]})

        const relations = {
            files: fileDictionary,
            linkPreviews: linkPreviewResults.dictionary,
            posts: sharedPostResults.dictionary,
            postComments: postCommentResults.dictionary,
            postReactions: postReactionResults.dictionary,
            postSubscriptions: postSubscriptionResults.dictionary,
            users: userResults.dictionary
        }

        if ( this.core.features.has('19-private-groups') ) {
            const groupIds = []
            for (const postId of results.list) {
                const post = results.dictionary[postId]
                groupIds.push(post.groupId)
            }
            const groupResults = await this.groupDAO.selectGroups({
                where: `groups.id = ANY($1::uuid[])`,
                params: [groupIds]
            })

            relations.groups = groupResults.dictionary
        }

        if ( this.core.features.has('62-admin-moderation-controls') ) {
            const siteModerationResults = await this.siteModerationDAO.selectSiteModerations({
                where: `site_moderation.post_id = ANY($1::uuid[]) OR site_moderation.post_comment_id = ANY($2::uuid[])`,
                params: [ results.list, postCommentResults.list ]
            })

            relations.siteModerations = siteModerationResults.dictionary
        }

        if ( this.core.features.has('89-improved-moderation-for-group-posts') ) {
            const groupModerationResults = await this.groupModerationDAO.selectGroupModerations({
                where: `group_moderation.post_id = ANY($1::uuid[]) OR group_moderation.post_comment_id = ANY($2::uuid[])`, 
                params: [ results.list, postCommentResults.list ]
            })

            relations.groupModerations = groupModerationResults.dictionary
        }

        return relations
    }

    async createQuery(request) {
        const query = {
            where: '',
            params: [],
            page: 1,
            order: 'posts.created_date DESC'
        }

        const currentUser = request.session.user

        // ========== Post Visibility ===================== 

        // Posts by friends, we'll use this later.
        const friendResults = await this.core.database.query(`
            SELECT
                user_id, friend_id
            FROM user_relationships
                WHERE (user_id = $1 OR friend_id = $1) AND status = 'confirmed'
        `, [currentUser.id])

        const friendIds = friendResults.rows.map((r) => r.user_id == currentUser.id ? r.friend_id : r.user_id)
        friendIds.push(currentUser.id)

        const canModerateSite = await this.permissionService.can(currentUser, 'moderate', 'Site')
        // Moderators can view anything, everyone else is restricted.
        if ( ! canModerateSite ) {
            query.params.push(friendIds)

            // Posts in groups
            if ( this.core.features.has(`19-private-groups`) ) {
                const visibleGroupResults = await this.core.database.query(`
                    SELECT groups.id FROM groups LEFT OUTER JOIN group_members ON groups.id = group_members.group_id WHERE (group_members.user_id = $1 AND group_members.status = 'member') OR groups.type = 'open'
                `, [currentUser.id])

                const visibleGroupIds = visibleGroupResults.rows.map((r) => r.id)
                query.params.push(visibleGroupIds)
            }

            // Permissions control statements, this determines what is visible.
            if ( this.core.features.has('230-admin-announcements') ) {
                console.log(`HI`)
                const showAnnouncements = currentUser.settings.showAnnouncements || true
                const showInfo = currentUser.settings.showInfo || true
                query.where += `
                    ((posts.user_id = ANY($${query.params.length - 1}::uuid[]) AND posts.type = 'feed') 
                        ${ showAnnouncements ? `OR posts.type = 'announcement'` : ''}
                        ${ showInfo ? `OR posts.type = 'info'` : ''}
                        OR (posts.type = 'group' AND posts.group_id = ANY($${query.params.length}::uuid[])) OR posts.visibility = 'public')`
            } else {
                query.where += `((posts.user_id = ANY($${query.params.length - 1}::uuid[]) AND posts.type = 'feed') OR (posts.type = 'group' AND posts.group_id = ANY($${query.params.length}::uuid[])) OR posts.visibility = 'public')`
            }
        }

        const and = query.params.length > 0 ? ' AND ' : ''
        query.params.push(currentUser.id)
        query.where += `${and} (group_moderation.status IS NULL OR (group_moderation.status != 'rejected' AND group_moderation.status != 'pending') OR posts.user_id = $${query.params.length}) 
            AND (site_moderation.status IS NULL OR site_moderation.status != 'rejected' OR posts.user_id = $${query.params.length})`


        if ('userId' in request.query) {
            const and = query.params.length > 0 ? ' AND ' : ''
            query.params.push(request.query.userId)
            query.where += `${and}posts.user_id = $${query.params.length}`
        }

        // If we're query for a particular group's posts, only grab that group.
        if ('groupId' in request.query) {
            const canViewGroupPost = await this.permissionService.can(currentUser, 'view', 'GroupPost', { groupId: request.query.groupId })
            if ( canViewGroupPost !== true ) {
                throw new ControllerError(404, 'not-found',
                    `User attempting to view posts for a group without permission.`,
                    `Either those posts don't exit or you don't have permission to view them.`)
            }

            const and = query.params.length > 0 ? ' AND ' : ''
            query.params.push(request.query.groupId)
            query.where += `${and}posts.group_id = $${query.params.length}`
        } 

        // ...if we have the slug then we have to do a little extra work.
        if ('groupSlug' in request.query) {
            const groupResult = await this.core.database.query(`SELECT id FROM groups WHERE slug = $1`, [request.query.groupSlug])
            if (groupResult.rows.length <= 0) {
                query.page = -1
                return query
            }

            const groupId = groupResult.rows[0].id

            const canViewGroupPost = await this.permissionService.can(currentUser, 'view', 'GroupPost', { groupId: groupId })
            if ( canViewGroupPost !== true ) {
                throw new ControllerError(404, 'not-found',
                    `User attempting to view posts for a group without permission.`,
                    `Either those posts don't exit or you don't have permission to view them.`)
            }

            const and = query.params.length > 0 ? ' AND ' : ''
            query.params.push(groupId)
            query.where += `${and}posts.group_id = $${query.params.length}`
        }

        if ('username' in request.query) {
            const userResult = await this.core.database.query(`SELECT id FROM users WHERE username = $1`, [request.query.username])
            if (userResult.rows.length <= 0) {
                query.page = -1
                return query
            }

            const userId = userResult.rows[0].id

            const and = query.params.length > 0 ? ' AND ' : ''
            query.params.push(userId)
            query.where += `${and}posts.user_id = $${query.params.length}`
        }

        if ( 'type' in request.query ) {
            const and = query.params.length > 0 ? ' AND ' : ''
            query.params.push(request.query.type)
            query.where += `${and}posts.type = $${query.params.length}`
        }

        if ('feed' in request.query) {
            if (request.query.feed == 'friends') {
                const and = query.params.length > 0 ? ' AND ' : ''
                query.params.push(friendIds)
                query.where += `${and} (posts.type = 'feed' AND posts.user_id = ANY($${query.params.length}::uuid[]))`
            } else if (request.query.feed == 'everything') {
                const groupMembershipResults = await this.core.database.query(
                    `SELECT groups.id FROM groups LEFT OUTER JOIN group_members ON groups.id = group_members.group_id WHERE group_members.user_id = $1 AND group_members.status = 'member'`, 
                    [ currentUser.id ]
                )

                const groupMemberships = groupMembershipResults.rows.map((r) => r.id)

                const and = query.params.length > 0 ? ' AND ' : ''

                const showAnnouncements = currentUser.settings.showAnnouncements || true
                const showInfo = currentUser.settings.showInfo || true

                query.params.push(friendIds)
                query.params.push(groupMemberships)
                query.where += `${and} 
                    (
                        (posts.type = 'feed' and posts.user_id = ANY($${query.params.length-1}::uuid[])) 
                            ${ showAnnouncements ? `OR posts.type = 'announcement'` : ''}
                            ${ showInfo ? `OR posts.type = 'info'` : ''}
                            OR (posts.type = 'group' AND posts.group_id = ANY($${query.params.length}::uuid[]))
                    )`
            }
        }

        if ( 'since' in request.query ) {
            const since = request.query.since
            if ( since === 'day' ) {
                const and = query.params.length > 0 ? ' AND ' : ''
                query.where += `${and} posts.created_date > current_timestamp - interval '1 day'`
            } else if ( since === 'week' ) {
                const and = query.params.length > 0 ? ' AND ' : ''
                query.where += `${and} posts.created_date > current_timestamp - interval '7 days'`
            } else if ( since === 'month' ) {
                const and = query.params.length > 0 ? ' AND ' : ''
                query.where += `${and} posts.created_date > current_timestamp - interval '30 days'` 
            } 
        }

        if ('sort' in request.query) {
            const sort = request.query.sort
            if (sort === 'newest') {
                query.order = 'posts.created_date DESC'
            } else if ( sort === 'active' ) {
                query.order = 'posts.activity DESC, posts.updated_date DESC, posts.created_date DESC'
            } else if ( sort === 'recent' ) {
                query.order = 'posts.updated_date DESC, posts.created_date DESC'
            }
        }


        if ('page' in request.query) {
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

        const canQueryPosts = await this.permissionService.can(currentUser, PermissionService.ACTIONS.QUERY, 'Post')
        if ( canQueryPosts !== true ) {
            throw new ControllerError(403, 'not-authorized',
                `User attempting to query posts without authorization.`,
                `You are not authorized to query for posts.`)
        }

        const query = await this.createQuery(request)

        // Empty result.
        if (query.page === -1) {
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

        const post = cleaning.Post.clean(request.body)

        const canCreatePost = await this.permissionService.can(currentUser, 'create', 'Post', { post: post })
        if ( canCreatePost !== true ) {
            throw new ControllerError(403, 'not-authorized',
                `User not authorized to create a post.`,
                `You are not authorized to create that post.`)
        }

        const validationErrors = await this.validationService.validatePost(currentUser, post)
        if ( validationErrors.length > 0 ) {
            const errorString = validationErrors.reduce((string, error) => `${string}\n${error.message}`, '')
            const logString = validationErrors.reduce((string, error) => `${string}\n${error.log}`, '')
            throw new ControllerError(400, 'invalid',
                `User submitted an invalid post: ${logString}`,
                errorString)
        }

        await this.postDAO.insertPosts(post)

        const results = await this.postDAO.selectPosts({
            where: `posts.id = $1`,
            params: [post.id]
        })

        const entity = results.dictionary[post.id]
        if ( ! entity ) {
            throw new ControllerError(500, 'server-error',
                `Post(${post.id}) missing after creation.`,
                `Post(${post.id}) missing after being created.  Please report as a bug.`)
        }

        if ( entity.groupId ) {
            const group = await this.groupDAO.getGroupById(entity.groupId) 

            if ( group.postPermissions === 'approval' ) {
                const moderation = {
                    userId: currentUser.id,
                    groupId: entity.groupId,
                    status: 'pending',
                    postId: entity.id
                }

                await this.groupModerationDAO.insertGroupModerations(moderation)
                await this.groupModerationEventDAO.insertGroupModerationEvents(this.groupModerationEventDAO.createEventFromGroupModeration(moderation))

                const postPatch = {
                    id: entity.id,
                    groupModerationId: moderation.id
                }
                await this.postDAO.updatePost(postPatch)
            }
        }

        // Notify any mentioned users
        await this.notificationService.sendNotifications(
            currentUser,
            'Post:create',
            {
                post: entity
            }
        )

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

        if (!currentUser) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to retrieve posts.`,
                `You must be authenticated to retrieve posts.`)
        }

        const postId = request.params.id

        const postResults = await this.postDAO.selectPosts({
            where: `posts.id = $1`,
            params: [postId]
        })

        const post = postResults.dictionary[postId]
        if (!post) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to access Post(${postId}) that doesn't exist.`,
                `That post either doesn't exist or you don't have permission to access it.`)
        }

        const canViewPost = await this.permissionService.can(currentUser, 'view', 'Post', { post: post })
        if (canViewPost !== true ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to access Post(${postId}) without permission.`,
                `That post either doesn't exist or you don't have permission to access it.`)
        }

        const relations = await this.getRelations(currentUser, postResults)

        response.status(200).json({
            entity: post,
            relations: relations
        })
    }

    async patchPost(request, response) {
        const currentUser = request.session.user

        if (!currentUser) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to edit a post.`,
                `You must must be authenticated to edit a post.`)
        }

        const postId = request.params.id
        const post = request.body

        const existing = await this.postDAO.getPostById(postId)
        if ( ! existing ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to update a Post(${postId}) that doesn't exist.`,
                `You can't update a post that doesn't exist.`)
        }

        const canViewPost = await this.permissionService.can(currentUser, 'view', 'Post', { post: existing })
        if ( canViewPost !== true ) {
            throw new ControllerError(404, 'not-found',
                `User attempting to access Post(${postId}) without permission.`,
                `That post either doesn't exist or you don't have permission to access it.`)
        }

        const canUpdatePost = await this.permissionService.can(currentUser, 'update', 'Post', { post: existing })
        if ( canUpdatePost !== true ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to update a Post(${postId}) without permission.`,
                `You are not authorized to update that post.`)
        }

        const validationErrors = await this.validationService.validatePost(currentUser, post, existing)
        if ( validationErrors.length > 0 ) {
            const errorString = validationErrors.reduce((string, error) => `${string}\n${error.message}`, '')
            const logString = validationErrors.reduce((string, error) => `${string}\n${error.log}`, '')
            throw new ControllerError(400, 'invalid',
                `User submitted an invalid post: ${logString}`,
                errorString)
        }

        await this.postDAO.updatePost(post)

        const results = await this.postDAO.selectPosts({
            where: `posts.id = $1`,
            params: [post.id]
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

        const existing = await this.postDAO.getPostById(postId)
        if ( ! existing ) {
            throw new ControllerError(404, 'not-found',
                `User attempting to access Post(${postId}) that doesn't exist.`,
                `That post either doesn't exist or you don't have permission to access it.`)
        }

        const canViewPost = await this.permissionService.can(currentUser, 'view', 'Post', { post: existing })
        if ( canViewPost !== true ) {
            throw new ControllerError(404, 'not-found',
                `User attempting to access Post(${postId}) without permission.`,
                `That post either doesn't exist or you don't have permission to access it.`)
        }

        const canDeletePost = await this.permissionService.can(currentUser, 'delete', 'Post', { post: existing })
        if ( canDeletePost !== true ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to delete Post(${postId}) of User(${existing.userId}).`,
                `You are not authorized to delete that post.`)
        }

        await this.postDAO.deletePost(existing)

        response.status(201).json({})
    }

    async postLinkPreview(request, response) {
        const currentUser = request.session.user

        if (!currentUser) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to generate a link preview.`,
                `You must must be authenticated to generate a link preview`)
        }

        const url = request.body.url

        const preview = await this.linkPreviewService.getPreview(url)

        response.status(200).json(preview)
    }

}
