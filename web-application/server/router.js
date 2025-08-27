/**************************************************************************************************
 *         API Router v0 
 *
 * This is the RESTful API router.  It contains all of our backend API routes.
 *
 * NOTE: This file is versioned and loaded on ``/api/0.0.0/``.  So ``/users`` is
 * really ``/api/0.0.0/users``.  This is so that we can load multiple versions
 * of the api as we make changes and leave past versions still accessible.
 **************************************************************************************************/
module.exports = function(core) {
    const express = require('express')
    const multer = require('multer')
    const backend = require('@communities/backend')

    const ControllerError = require('./errors/ControllerError')

    const router = express.Router()

    /******************************************************************************
     * Feature Flag Management and Migration Rest Routes
     *****************************************************************************/
    const FeatureController = require('./controllers/FeatureController')
    const featureController = new FeatureController(core)

    router.get('/features', function(request, response, next) {
        featureController.getFeatures(request, response).catch(function(error) {
            next(error)
        })
    })

    router.post('/features', function(request, response, next) {
        featureController.postFeatures(request, response).catch(function(error) {
            next(error)
        })
    })

    router.get('/feature/:name', function(request, response, next) {
        featureController.getFeature(request, response).catch(function(error) {
            next(error)
        })
    })

    router.patch('/feature/:name', function(request, response, next) {
        featureController.patchFeature(request, response).catch(function(error) {
            next(error)
        })
    })

    /**************************************************************************
     * Job REST Routes
     **************************************************************************/
    const JobController = require('./controllers/JobController')
    const jobController = new JobController(core)

    router.get('/jobs', function(request, response, next) {
        jobController.getJobs(request, response).catch(function(error) {
            next(error)
        })
    })

    router.post('/jobs', function(request, response, next) {
        jobController.postJob(request, response).catch(function(error) {
            next(error)
        })
    })

    router.get('/job/:id', function(request, response, next) {
        jobController.getJob(request, response).catch(function(error) {
            next(error)
        })
    })

    router.patch('/job/:id', function(request, response, next) {
        jobController.patchJob(request, response).catch(function(error) {
            next(error)
        })
    })

    router.delete('/job/:id', function(request, response, next) {
        jobController.deleteJob(request, response).catch(function(error) {
            next(error)
        })
    })

    /******************************************************************************
     *          File REST Routes
     ******************************************************************************/
    const FileController = require('./controllers/FileController')
    const fileController = new FileController(core)

    const upload = new multer({ dest: 'public/uploads/tmp' })

    router.post('/upload', upload.single('file'), function(request, response, next) {
        fileController.upload(request, response).catch(function(error) {
            next(error)
        })
    })

    router.get('/file/:id', function(request, response, next) {
        fileController.getFile(request, response).catch(function(error) {
            next(error)
        })
    })

    router.patch('/file/:id', function(request, response, next) {
        fileController.patchFile(request, response).catch(function(error) {
            next(error)
        })
    })

    router.delete('/file/:id', function(request, response, next) {
        fileController.deleteFile(request, response).catch(function(error) {
            next(error)
        })
    })

    /******************************************************************************
     *          User REST Routes
     ******************************************************************************/
    const UserController = require('./controllers/UserController')
    const userController = new UserController(core)

    // Get a list of all users.
    router.get('/users', function(request, response, next) {
        userController.getUsers(request, response).catch(function(error) {
            next(error)
        })
    })

    // Create a new user 
    router.post('/users', function(request, response, next) {
        userController.postUsers(request, response).catch(function(error) {
            next(error)
        })
    })

    // Get the details of a single user 
    router.get('/user/:id', function(request, response, next) {
        userController.getUser(request, response).catch(function(error) {
            next(error)
        })
    })

    // Edit an existing user with partial data.
    router.patch('/user/:id', function(request, response, next) {
        userController.patchUser(request, response).catch(function(error) {
            next(error)
        })
    })

    // Delete an existing user.
    router.delete('/user/:id', function(request, response, next) {
        userController.deleteUser(request, response).catch(function(error) {
            next(error)
        })
    })

    /******************************************************************************
     *          User Relationship REST Routes
     ******************************************************************************/
    const UserRelationshipController = require('./controllers/UserRelationshipController')
    const userRelationshipController = new UserRelationshipController(core)

    router.get('/user/:userId/relationships', function(request, response, next) {
        userRelationshipController.getUserRelationships(request, response).catch(function(error) {
            next(error)
        })
    })

    router.post('/user/:userId/relationships', function(request, response, next) {
        userRelationshipController.postUserRelationships(request, response).catch(function(error) {
            next(error)
        })
    })

    router.get('/user/:userId/relationship/:relationId', function(request, response, next) {
        userRelationshipController.getUserRelationship(request, response).catch(function(error) {
            next(error)
        })
    })

    router.patch('/user/:userId/relationship/:relationId', function(request, response, next) {
        userRelationshipController.patchUserRelationship(request, response).catch(function(error) {
            next(error)
        })
    })
    
    router.delete('/user/:userId/relationship/:relationId', function(request, response, next) {
        userRelationshipController.deleteUserRelationship(request, response).catch(function(error) {
            next(error)
        })
    })

    /**************************************************************************
     * Groups REST routes
     * ************************************************************************/
    const GroupController = require('./controllers/GroupController')
    const groupController = new GroupController(core)

    router.get('/groups', function(request, response, next) {
        groupController.getGroups(request, response).catch(function(error) {
            next(error)
        })
    })

    router.post('/groups', function(request, response, next) {
        groupController.postGroups(request, response).catch(function(error) {
            next(error)
        })
    })

    router.get('/group/:id', function(request, response, next) {
        groupController.getGroup(request, response).catch(function(error) {
            next(error)
        })
    })

    router.patch('/group/:id', function(request, response, next) {
        groupController.patchGroup(request, response).catch(function(error) {
            next(error)
        })
    })

    router.delete('/group/:id', function(request, response, next) {
        groupController.deleteGroup(request, response).catch(function(error) {
            next(error)
        })
    })

    /**************************************************************************
     * GroupMembers REST routes
     **************************************************************************/
    const GroupMemberController = require('./controllers/GroupMemberController')
    const groupMemberController = new GroupMemberController(core)

    router.get('/group/:groupId/members', function(request, response, next) {
        groupMemberController.getGroupMembers(request, response).catch(function(error) {
            next(error)
        })
    })

    router.post('/group/:groupId/members', function(request, response, next) {
        groupMemberController.postGroupMembers(request, response).catch(function(error) {
            next(error)
        })
    })

    router.get('/group/:groupId/member/:userId', function(request, response, next) {
        groupMemberController.getGroupMember(request, response).catch(function(error) {
            next(error)
        })
    })

    router.patch('/group/:groupId/member/:userId', function(request, response, next) {
        groupMemberController.patchGroupMember(request, response).catch(function(error) {
            next(error)
        })
    })

    router.delete('/group/:groupId/member/:userId', function(request, response, next) {
        groupMemberController.deleteGroupMember(request, response).catch(function(error) {
            next(error)
        })
    })

    /**************************************************************************
     * GroupModeration REST routes
     **************************************************************************/
    const GroupModerationController = require('./controllers/GroupModerationController')
    const groupModerationController = new GroupModerationController(core)

    router.get('/group/:groupId/moderations', function(request, response, next) {
        groupModerationController.getGroupModerations(request, response).catch(function(error) {
            next(error)
        })
    })

    router.post('/group/:groupId/moderations', function(request, response, next) {
        groupModerationController.postGroupModerations(request, response).catch(function(error) {
            next(error)
        })
    })

    router.get('/group/:groupId/moderation/:id', function(request, response, next) {
        groupModerationController.getGroupModeration(request, response).catch(function(error) {
            next(error)
        })
    })

    router.patch('/group/:groupId/moderation/:id', function(request, response, next) {
        groupModerationController.patchGroupModeration(request, response).catch(function(error) {
            next(error)
        })
    })

    router.delete('/group/:groupId/moderation/:id', function(request, response, next) {
        groupModerationController.deleteGroupModeration(request, response).catch(function(error) {
            next(error)
        })
    })

    /**************************************************************************
     * Link Preview REST Routes
     **************************************************************************/
    const LinkPreviewController = require('./controllers/LinkPreviewController')
    const linkPreviewController = new LinkPreviewController(core)

    router.get('/link-previews', function(request, response, next) {
        linkPreviewController.getLinkPreviews(request, response).catch(function(error) {
            next(error)
        })
    })

    router.post('/link-previews', function(request, response, next) {
        linkPreviewController.postLinkPreviews(request, response).catch(function(error) {
            next(error)
        })
    })

    router.get('/link-preview/:id', function(request, response, next) {
        linkPreviewController.getLinkPreview(request, response).catch(function(error) {
            next(error)
        })
    })

    router.patch('/link-preview/:id', function(request, response, next) {
        linkPreviewController.patchLinkPreview(request, response).catch(function(error) {
            next(error)
        })
    })

    /**************************************************************************
     * Post REST Routes
     **************************************************************************/
    const PostController = require('./controllers/PostController')
    const postController = new PostController(core)

    router.get('/posts', function(request, response, next) {
        postController.getPosts(request, response).catch(function(error) {
            next(error)
        })
    })

    router.post('/posts', function(request, response, next) {
        postController.postPosts(request, response).catch(function(error) {
            next(error)
        })
    })

    router.get('/post/:id', function(request, response, next) {
        postController.getPost(request, response).catch(function(error) {
            next(error)
        })
    })

    router.patch('/post/:id', function(request, response, next) {
        postController.patchPost(request, response).catch(function(error) {
            next(error)
        })
    })

    router.delete('/post/:id', function(request, response, next) {
        postController.deletePost(request, response).catch(function(error) {
            next(error)
        })
    })


    /**************************************************************************
     * PostReaction REST Routes
     **************************************************************************/

    const PostReactionController = require('./controllers/PostReactionController')
    const postReactionController = new PostReactionController(core)

    router.post('/post/:postId/reactions', function(request, response, next) {
        postReactionController.postPostReactions(request, response).catch(function(error) {
            next(error)
        })
    })

    router.patch('/post/:postId/reaction', function(request, response, next) {
        postReactionController.patchPostReaction(request, response).catch(function(error) {
            next(error)
        })
    })

    router.delete('/post/:postId/reaction', function(request, response, next) {
        postReactionController.deletePostReaction(request, response).catch(function(error) {
            next(error)
        })
    })

    /**************************************************************************
     * PostComment REST Routes
     **************************************************************************/
    const PostCommentController = require('./controllers/PostCommentController')
    const postCommentController = new PostCommentController(core)

    router.get('/post/:postId/comments', function(request, response, next) {
        postCommentController.getPostComments(request, response).catch(function(error) {
            next(error)
        })
    })
    
    router.post('/post/:postId/comments', function(request, response, next) {
        postCommentController.postPostComments(request, response).catch(function(error) {
            next(error)
        })
    })

    router.get('/post/:postId/comment/:id', function(request, response, next) {
        postCommentController.getPostComment(request, response).catch(function(error) {
            next(error)
        })
    })

    router.patch('/post/:postId/comment/:id', function(request, response, next) {
        postCommentController.patchPostComment(request, response).catch(function(error) {
            next(error)
        })
    })

    router.delete('/post/:postId/comment/:id', function(request, response, next) {
        postCommentController.deletePostComment(request, response).catch(function(error) {
            next(error)
        })
    })

    /**************************************************************************
     * PostSubscription REST Routes
     **************************************************************************/
    const PostSubscriptionController = require('./controllers/PostSubscriptionController')
    const postSubscriptionController = new PostSubscriptionController(core)

    router.post('/post/:postId/subscriptions', function(request, response, next) {
        postSubscriptionController.postPostSubscriptions(request, response).catch(function(error) {
            next(error)
        })
    })

    router.get('/post/:postId/subscription', function(request, response, next) {
        postSubscriptionController.getPostSubscription(request, response).catch(function(error) {
            next(error)
        })
    })

    router.delete('/post/:postId/subscription', function(request, response, next) {
        postSubscriptionController.deletePostSubscription(request, response).catch(function(error) {
            next(error)
        })
    })

    /**************************************************************************
     *      Notification REST Routes
     *************************************************************************/
    const NotificationController = require('./controllers/NotificationController')
    const notificationController = new NotificationController(core)

    router.get('/notifications', function(request, response, next) {
        notificationController.getNotifications(request, response).catch(function(error) {
            next(error)
        })

    })

    router.patch('/notifications', function(request, response, next) {
        notificationController.patchNotifications(request,response).catch(function(error) {
            next(error)
        })
    })

    router.patch('/notification/:id', function(request, response, next) {
        notificationController.patchNotification(request, response).catch(function(error) {
            next(error)
        })
    })

    /******************************************************************************
     *          Authentication REST Routes
     ******************************************************************************/
    const AuthenticationController = require('./controllers/AuthenticationController')
    const authenticationController = new AuthenticationController(core)

    router.post('/authentication', function(request, response, next) {
        authenticationController.postAuthentication(request, response).catch(function(error) {
            next(error)
        })
    })

    router.get('/authentication', function(request, response, next) {
        authenticationController.getAuthentication(request,response).catch(function(error) {
            next(error)
        })
    })

    router.delete('/authentication', function(request, response) {
        // Delete isn't async
        authenticationController.deleteAuthentication(request, response)
    })

    /**************************************************************************
     *      Device Tracking REST Routes
     **************************************************************************/
    const DeviceController = require('./controllers/DeviceController')
    const deviceController = new DeviceController(core)

    router.patch('/device', function(request, response, next) {
        deviceController.patchDevice(request, response).catch(function(error) {
            next(error)
        })
    })

    /**************************************************************************
     *      Token Handling REST Routes
     * ************************************************************************/
    const TokenController = require('./controllers/TokenController')
    const tokenController = new TokenController(core)

    router.get('/token/:token', function(request, response, next) {
        tokenController.getToken(request, response).catch(function(error) {
            next(error)
        })
    })

    router.post('/tokens', function(request, response, next) {
        tokenController.postToken(request, response).catch(function(error) {
            next(error)
        })
    })

    /**************************************************************************
     *      Moderation REST Routes
     * ************************************************************************/
    const SiteModerationController = require('./controllers/admin/SiteModerationController')
    const siteModerationController = new SiteModerationController(core)

    router.get('/admin/moderations', function(request, response, next) {
        siteModerationController.getSiteModerations(request, response).catch(function(error){
            next(error)
        })
    })

    router.post('/admin/moderations', function(request, response, next) {
        siteModerationController.postSiteModerations(request, response).catch(function(error) {
            next(error)
        })
    })

    router.get('/admin/moderation/:id', function(request, response, next) {
        siteModerationController.getSiteModeration(request, response).catch(function(error) {
            next(error)
        })
    })

    router.patch('/admin/moderation/:id', function(request, response, next) {
        siteModerationController.patchSiteModeration(request, response).catch(function(error) {
            next(error)
        })
    })

    router.delete('/admin/moderation/:id', function(request, response, next) {
        siteModerationController.deleteSiteModeration(request, response).catch(function(error) {
            next(error)
        })
    })

    /**************************************************************************
     * Blocklist REST Routes
     **************************************************************************/
    const BlocklistController = require('./controllers/admin/BlocklistController')
    const blocklistController = new BlocklistController(core)

    router.get('/admin/blocklists', function(request, response, next) {
        blocklistController.getBlocklists(request, response).catch(function(error){
            next(error)
        })
    })

    router.post('/admin/blocklists', function(request, response, next) {
        blocklistController.postBlocklists(request, response).catch(function(error) {
            next(error)
        })
    })

    router.get('/admin/blocklist/:id', function(request, response, next) {
        blocklistController.getBlocklist(request, response).catch(function(error) {
            next(error)
        })
    })

    router.patch('/admin/blocklist/:id', function(request, response, next) {
        blocklistController.patchBlocklist(request, response).catch(function(error) {
            next(error)
        })
    })

    router.delete('/admin/blocklist/:id', function(request, response, next) {
        blocklistController.deleteBlocklist(request, response).catch(function(error) {
            next(error)
        })
    })

    /**************************************************************************
     *      API 404 
     *************************************************************************/

    router.all('*any', function(request, response) {
        throw new ControllerError(404, 'no-resource', `Request for non-existent resource ${request.originalUrl}.`)
    })

    return router
}


