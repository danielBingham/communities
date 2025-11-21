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
/******************************************************************************
 *      UserController
 *
 * Restful routes for manipulating users.
 *
 ******************************************************************************/
const {
    AuthenticationService,
    EmailService,
    NotificationService,
    PermissionService,
    UserService,
    ValidationService,

    UserDAO,
    UserRelationshipDAO,
    GroupMemberDAO,
    TokenDAO,
    FileDAO,
    PostDAO,

    DAOError,
    ServiceError
} = require('@communities/backend')

const BaseController = require('./BaseController')
const ControllerError = require('../errors/ControllerError')

module.exports = class UserController extends BaseController{

    constructor(core) {
        super(core)

        this.database = core.database
        this.logger = core.logger
        this.config = core.config

        this.auth = new AuthenticationService(core)
        this.emailService = new EmailService(core)
        this.notificationService = new NotificationService(core)
        this.permissionService = new PermissionService(core)
        this.userService = new UserService(core)
        this.validationService = new ValidationService(core)

        this.userDAO = new UserDAO(core)
        this.userRelationshipsDAO = new UserRelationshipDAO(core)
        this.groupMemberDAO = new GroupMemberDAO(core)
        this.tokenDAO = new TokenDAO(core)
        this.fileDAO = new FileDAO(core)
        this.postDAO = new PostDAO(core)
    }

    async getRelations(currentUser, results, requestedRelations) {
        
        // Profile pictures
        const fileIds = []
        for(const userId of results.list) {
            const user = results.dictionary[userId]
            fileIds.push(user.fileId)
        }
        const fileResults = await this.fileDAO.selectFiles(`WHERE files.id = ANY($1::uuid[])`, [ fileIds ])
        const fileDictionary = {}
        for(const file of fileResults) {
            fileDictionary[file.id] = file
        }

        // Relationships
        let userRelationshipDictionary = {}
        if ( currentUser ) {
            const userRelationshipResults = await this.userRelationshipsDAO.selectUserRelationships({
                where: `(user_id = $1 AND friend_id = ANY($2::uuid[])) OR (user_id = ANY($2::uuid[]) AND friend_id = $1)`,
                params: [ currentUser.id, results.list]
            })

            userRelationshipDictionary = userRelationshipResults.dictionary
        }

        return {
            files: fileDictionary,
            userRelationships: userRelationshipDictionary
        }
    }

    /**
     * Parse a query string from the `GET /users` endpoint for use with both
     * `UsersDAO::selectUsers()` and `UsersDAO::countUsers()`.
     *
     * @param {Object} query    The query string (from `request.query`) that we
     * wish to parse.
     * @param {string} query.name   (Optional) A string to compare to user's names for
     * matches.  Compared using trigram matching.
     * @param {int} quer.page    (Optional) A page number indicating which page of
     * results we want.  
     * @param {string} query.sort (Optional) A sort parameter describing how we want
     * to sort users.
     * @param {Object} options  A dictionary of options that adjust how we
     * parse it.
     * @param {boolean} options.ignorePage  Skip the page parameter.  It will
     * still be in the result object and will default to `1`.
     *
     * @return {Object} A result object with the results in a form
     * understandable to `selectUsers()` and `countUsers()`.  Of the following
     * format:
     * ```
     * { 
     *  where: 'WHERE ...', // An SQL where statement.
     *  params: [], // An array of paramters matching the $1,$2, parameterization of `where`
     *  page: 1, // A page parameter, to select which page of results we want.
     *  order: '', // An SQL order statement.
     *  emptyResult: false // When `true` we can skip the selectUsers() call,
     *  // because we know we have no results to return.
     * }
     * ```
     */
    async parseQuery(currentUser, query, options) {
        options = options || {
            ignorePage: false
        }

        if ( ! query) {
            return
        }

        const result = {
            where: ``,
            params: [],
            page: 1,
            order: '',
            fields: [],
            emptyResult: false,
            requestedRelations: query.relations ? query.relations : []
        }

        // ====================================================================
        // Permissions
        // ====================================================================
        if ( currentUser ) {
            const blockResults = await this.core.database.query(`
                SElECT user_id 
                    FROM user_relationships
                        WHERE friend_id = $1 AND status = 'blocked'
            `, [currentUser.id])
            const blockIds = blockResults.rows.map((r) => r.user_id )

            // You can't see users who have blocked you.
            result.params.push(blockIds)
            result.where += `users.id != ALL($${result.params.length}::uuid[])`
        }
        // ====================================================================
        // END Permissions
        // ====================================================================


        if ( 'name' in query && query.name.length > 0) {
            const and = result.params.length > 0 ? ' AND ' : ''
            result.params.push(query.name)
            result.where += `${and} SIMILARITY(users.name, $${result.params.length}) > 0.15`
            result.order = `SIMILARITY(users.name, $${result.params.length}) desc`
        }

        if ( 'username' in query && query.username.length > 0 ) {
            const and = result.params.length > 0 ? ' AND ' : ''
            result.params.push(query.username)
            result.where += `${and} users.username = $${result.params.length}`
        }

        if ( 'mention' in query && query.mention.length > 0 ) {
            const and = result.params.length > 0 ? ' AND ' : ''
            result.params.push(query.mention)
            result.where += `${and} SIMILARITY(users.name, $${result.params.length}) > 0.15`
            result.order = `SIMILARITY(users.name, $${result.params.length}) desc`

            if ( 'postId' in query && 'groupId' in query) {
                // If they are commenting on a group post, limit the search to
                // their friends, people who've interacted with the post, and
                // group members.
                let postUserIds = []
                const post = await this.postDAO.getPostById(query.postId)
                const canViewPost = await this.permissionService.can(currentUser, 'view', 'Post', { post: post })
                if ( canViewPost === true ) {
                    const postResults = await this.core.database.query(`
                        SELECT user_id FROM post_comments WHERE post_id = $1
                    `, [ query.postId ])
                    postUserIds = postResults.rows.map((row) => row.user_id)
                    postUserIds.push(post.userId)
                }

                let memberUserIds = []
                const canViewGroup = await this.permissionService.can(currentUser, 'view', 'Group', { groupId: query.groupId})
                if ( canViewGroup === true ) {
                    const groupMembers = await this.groupMemberDAO.getGroupMembers(query.groupId)
                    memberUserIds = groupMembers.map((member) => member.userId)
                }

                const relationships = await this.userRelationshipsDAO.getUserRelationshipsForUser(currentUser.id)
                const friendIds = relationships.map((r) => r.userId == currentUser.id ? r.relationId : r.userId)

                let userIds = [ ...postUserIds, ...memberUserIds, ...friendIds ]

                const blockResults = await this.core.database.query(`
                    SElECT user_id, friend_id
                        FROM user_relationships
                            WHERE (user_id = $1 OR friend_id = $1) AND status = 'blocked'
                `, [currentUser.id])

                const blockIds = blockResults.rows.map((r) => r.user_id == currentUser.id ? r.friend_id : r.user_id)

                // TECHDEBT O(n^2) :: It would be better to do this filtering
                // in each of the three SQL queries we're running here, but
                // that's a problem for future us.  It's going to be a while
                // before anyone has enough friends and blocks that this is
                // actually a problem.
                userIds = userIds.filter((id) => ! blockIds.includes(id))

                const and = result.params.length > 0 ? ' AND ' : ''
                result.params.push(userIds)
                result.where += `${and} users.id = ANY($${result.params.length}::uuid[])`
            } else if ( 'postId' in query ) {
                // If they are commenting in a post, limit the search to their
                // friends and people who've interacted with the post.
                let postUserIds = [] 
                const post = await this.postDAO.getPostById(query.postId)
                const canViewPost = await this.permissionService.can(currentUser, 'view', 'Post', { post: post })
                if ( canViewPost === true ) {
                    const postResults = await this.core.database.query(`
                        SELECT user_id FROM post_comments WHERE post_id = $1
                    `, [ query.postId ])
                    postUserIds = postResults.rows.map((row) => row.user_id)
                    postUserIds.push(post.userId)
                }

                const relationships = await this.userRelationshipsDAO.getUserRelationshipsForUser(currentUser.id)
                const friendIds = relationships.map((r) => r.userId == currentUser.id ? r.relationId : r.userId)

               let userIds = [ ...postUserIds, ...friendIds ]

                const blockResults = await this.core.database.query(`
                    SElECT user_id, friend_id
                        FROM user_relationships
                            WHERE (user_id = $1 OR friend_id = $1) AND status = 'blocked'
                `, [currentUser.id])

                const blockIds = blockResults.rows.map((r) => r.user_id == currentUser.id ? r.friend_id : r.user_id)

                // TECHDEBT O(n^2) :: It would be better to do this filtering
                // in each of the three SQL queries we're running here, but
                // that's a problem for future us.  It's going to be a while
                // before anyone has enough friends and blocks that this is
                // actually a problem.
                userIds = userIds.filter((id) => ! blockIds.includes(id))
                
                const and = result.params.length > 0 ? ' AND ' : ''
                result.params.push(userIds)
                result.where += `${and} users.id = ANY($${result.params.length}::uuid[])`
            } else if ( 'groupId' in query ) {
                // If they are posting in a group, limit the search to group
                // members and their friends.
                let memberUserIds = [] 
                const canViewGroup = await this.permissionService.can(currentUser, 'view', 'Group', { groupId: query.groupId})
                if ( canViewGroup === true ) {
                    const groupMembers = await this.groupMemberDAO.getGroupMembers(query.groupId)
                    memberUserIds = groupMembers.map((member) => member.userId)
                }

                const relationships = await this.userRelationshipsDAO.getUserRelationshipsForUser(currentUser.id)
                const friendIds = relationships.map((r) => r.userId == currentUser.id ? r.relationId : r.userId)

                let userIds = [ ...friendIds, ...memberUserIds ]

                const blockResults = await this.core.database.query(`
                    SElECT user_id, friend_id
                        FROM user_relationships
                            WHERE (user_id = $1 OR friend_id = $1) AND status = 'blocked'
                `, [currentUser.id])

                const blockIds = blockResults.rows.map((r) => r.user_id == currentUser.id ? r.friend_id : r.user_id)

                // TECHDEBT O(n^2) :: It would be better to do this filtering
                // in each of the three SQL queries we're running here, but
                // that's a problem for future us.  It's going to be a while
                // before anyone has enough friends and blocks that this is
                // actually a problem.
                userIds = userIds.filter((id) => ! blockIds.includes(id))

                const and = result.params.length > 0 ? ' AND ' : ''
                result.params.push(userIds)
                result.where += `${and} users.id = ANY($${result.params.length}::uuid[])`
            } else {
                // Limit the search to their friends.
                let relationships = await this.userRelationshipsDAO.getUserRelationshipsForUser(currentUser.id)
                relationships = relationships.filter((r) => r.status !== 'blocked')
                const friendIds = relationships.map((r) => r.userId == currentUser.id ? r.relationId : r.userId)

                const and = result.params.length > 0 ? ' AND ' : ''
                result.params.push(friendIds)
                result.where += `${and} users.id = ANY($${result.params.length}::uuid[])`
            }
        }

        if ( 'ids' in query && query.ids.length > 0 ) {
            const and = result.params.length > 0 ? ' AND ' : ''
            result.params.push(query.ids)
            result.where += `${and} users.id = ANY($${result.params.length}::uuid[])`
        }

        if ( 'isFriend' in query && query.isFriend ) {
            const and = result.params.length > 0 ? ' AND ' : ''
            const relationships = await this.userRelationshipsDAO.getUserRelationshipsForUser(currentUser.id)
            const friendIds = relationships.map((r) => r.userId == currentUser.id ? r.relationId : r.userId)

            result.params.push(friendIds)
            result.where += `${and} users.id = ANY($${result.params.length}::uuid[])`
        }

        if ( 'isGroupMember' in query ) {
            const and = result.params.length > 0 ? ' AND ' : ''
            const groupId = query.isGroupMember

            const members = await this.groupMemberDAO.getGroupMembers(groupId)
            const memberUserIds = members.map((member) => member.userId)

            result.params.push(memberUserIds)
            result.where += `${and} users.id = ANY($${result.params.length}::uuid[])`
        }

        if ( 'isNotGroupMember' in query ) {
            const and = result.params.length > 0 ? ' AND ' : ''
            const groupId = query.isNotGroupMember

            const members = await this.groupMemberDAO.getGroupMembers(groupId)
            const memberUserIds = members.map((member) => member.userId)

            result.params.push(memberUserIds)
            result.where += `${and} users.id != ALL($${result.params.length}::uuid[])`
        }

        if ( 'admin' in query && query.admin === 'true') {
            if ( currentUser.siteRole === 'admin' || currentUser.siteRole === 'superadmin' ) {
                result.fields = 'all'
            } else {
                throw new ControllerError(403, 'not-authorized',
                    `User(${currentUser.id}) not authorized to admin.`,
                    `You are not authorized to admin this platform.`)
            }
        } else {
            const and = result.params.length > 0 ? ' AND ' : ''
            result.where += `${and} users.status != 'banned' AND users.status != 'invited'`
        }

        if ( query.page && ! options.ignorePage ) {
            result.page = query.page
        } else if ( ! options.ignorePage ) {
            result.page = 1
        }

        return result

    }

    /**
     * GET /users
     *
     * Respond with a list of `users` matching the query in the meta/result
     * format.
     *
     * @param {Object} request  Standard Express request object.
     * @param {string} request.query.name   (Optional) A string to compare to
     * user's names for matches.  Compared using trigram matching.
     * @param {int} request.query.page    (Optional) A page number indicating
     * which page of results we want.  
     * @param {string} request.query.sort (Optional) A sort parameter
     * describing how we want to sort users.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getUsers(request, response) {
        const query = await this.parseQuery(request.session.user, request.query)

        if ( query.emptyResult ) {
            return response.status(200).json({
                meta: {
                    count: 0,
                    page: 1,
                    pageSize: 1,
                    numberOfPages: 1
                }, 
                relations: {},
                dictionary: {},
                list: []
            })
        }
        const meta = await this.userDAO.countUsers(query)
        const results = await this.userDAO.selectUsers(query)
        const relations = await this.getRelations(request.session.user, results, query.requestedRelations) 

        return response.status(200).json({ 
            dictionary: results.dictionary,
            list: results.list,
            meta: meta,
            relations: relations
        })
    }

    /**
     * POST /users
     *
     * Create a new `user`.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async postUsers(request, response) {
        const currentUser = request.session.user

        let userErrors = []
        let resultingUsers = [] 

        // This is an invitation.
        if ( currentUser ) {
            if ( Array.isArray(request.body) ) {
                for(const user of request.body) {
                    const [invitedUser, errors] = await this.userService.inviteUser(currentUser, user)
                    if ( errors.length > 0 ) {
                        userErrors.push(...errors)
                    } 
                    if ( invitedUser !== null ) {
                        resultingUsers.push(invitedUser)
                    }
                }
            } else {
                const [invitedUser, errors] = await this.userService.inviteUser(currentUser, request.body)
                if ( errors.length > 0 ) {
                    userErrors.push(...errors)
                } 
                if ( invitedUser !== null ) {
                    resultingUsers.push(invitedUser)
                }
            }
        } 
        // This is a registration.
        else {
            const [registeredUser, errors] = await this.userService.registerUser(request.body)
            if ( errors.length > 0 ) {
                userErrors.push(...errors)
            } 
            if ( registeredUser !== null ) {
                resultingUsers.push(registeredUser)
                request.session.user = registeredUser
            }
        }

        if ( userErrors.length > 0 ) {
            return this.sendUserErrors(response, 400, userErrors)
        }

        const userIds  = resultingUsers.map((u) => u.id)
        const results = await this.userDAO.selectUsers({
            where: `users.id = ANY($1::uuid[])`,
            params: [ userIds ]
        })

        const relations = await this.getRelations(request.session.user, results)
        relations.users = results.dictionary

        response.status(201).json({ 
            entity: request.session.user,
            relations: relations
        })
    }

    /**
     * GET /user/:id
     *
     * Get details for a single user.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.id   The id of the user we wish to retrieve.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getUser(request, response) {
        const currentUser = request.session.user
        const userId = request.params.id

        if ( currentUser && currentUser.id !== userId) {
            const relationship = await this.userRelationshipsDAO.getUserRelationshipByUserAndRelation(currentUser.id, userId)
            if ( relationship?.status === 'blocked' && currentUser.id === relationship?.relationId) {
                throw new ControllerError(404, 'not-found', 
                    `User(${currentUser.id}) attempting to view User(${userId}) who blocked them.`,
                    `Either that user doesn't exist or you don't have permissions to view them.`)
            }
        }

        let results = null
        if ( currentUser && currentUser.id === userId) {
            results = await this.userDAO.selectUsers({ where: `users.id = $1 AND users.status != 'invited'`, params: [ userId ], fields: 'all' })
        } else {
            results = await this.userDAO.selectUsers({ where: `users.id = $1 AND users.status != 'invited'`, params: [ userId ]})
        }

        if ( ! results.dictionary[userId] ) {
            throw new ControllerError(404, 'not-found', `User(${userId}) not found.`)
        }

        const relations = await this.getRelations(currentUser, results)

        return response.status(200).json({ 
            entity: results.dictionary[userId],
            relations: relations
        })
    }

    /**
     * PATCH /user/:id
     *
     * Update an existing user from a patch.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.id   The id of the user we wish to update.
     * @param {Object} request.body The patch we wish to user to update the
     * user.  May include any fields from the `user` object.  Some fields come
     * with additional requirements, noted below.
     * @param {string} request.body.password    (Optional) If this field is
     * included then the body must also include either an `oldPassword` field
     * or a `token` corresponding to either a valid 'reset-password' token or a
     * valid 'invitation' token.
     * @param {string} request.body.token Required if `request.body.password`
     * is included and `request.body.oldPassword` is not.
     * @param {string} request.body.oldPassword Required if
     * `request.body.password` is included and `request.body.token` is not.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async patchUser(request, response) {
        const user = request.body
        const id = request.params.id

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * Permissions:
         * 1. User must be logged in.
         * 2. User being patched must be the same as the logged in user.
         * 2a. :id must equal request.session.user.id
         * 2b. :id must equal request.body.id
         * 3. User(:id) must exist.
         * 4. If a password is included, then oldPassword or a valid token are
         * required.
         * 5. If an email is included, then oldPassword is required.
         * 
         * **********************************************************/

        const currentUser = request.session.user

        // ================= Initial Validation ===============================
        // Do some basic initial validation before we determine what type of 
        // PATCH is taking place. Ensure the user is authenticated or has
        // a token.  Make sure the route and body match.  Make sure we're
        // PATCHing a user that actually exists.  

        // 1. User must be logged in unless they are using  token.
        if ( ! currentUser && ! ( 'token' in user) ) {
            throw new ControllerError(401, 'not-authenticated', 
                `Unauthenticated user attempting to update user(${user.id}).`,
                `You must be authenticated to update a user.`)
        } 

        // 2b. :id must equal request.body.id
        if ( id != user.id ) {
            throw new ControllerError(403, 'not-authorized',
                `Route User(${id}) does not match body User(${user.id}).`,
                `Route and body must match.`)
        }

        const existingUsers = await this.userDAO.selectUsers({ where: `users.id = $1`, params: [ id ], fields: 'all' })

        // 3. User(:id) must exist.
        if ( ! existingUsers.dictionary[id] ) {
            throw new ControllerError(404, 'not-found',
                `Attempt to update a User(${id}) that doesn't exist.`,
                `Either that user doesn't exist or you don't have permissions to view them.`)
        }

        const existingUser = existingUsers.dictionary[id]

        // ======== PATCH Type Determination and Authentication ===============
        // There are a number of circumstances where the User can be PATCHed,
        // with different requirements for the level of authentication and
        // different restrictions for what can be updated.  We need to
        // determine which one this is.
        //
        // Determine what type of patch is taking place:
        // - password-reset: The user is reseting their own password using a
        //      token.
        // - invitation-acceptance: The user is accepting an invite using a
        //      token.
        // - edit: The user is editing their profile without authenticating.
        // - authenticated-edit: The user has reauthenticated to in order to
        //      edit sensitive parts of their profile.
        // - admin-edit: An admin is editing the user in some way.

        let type = null
        let token = null

        // First, check their token authentication. This checks two types:
        //
        // - password-reset
        // - invitation-acceptance
        //
        if ( user.token ) {
            try {
                token = await this.tokenDAO.validateToken(user.token, [ 'reset-password', 'invitation' ])
            } catch (error ) {
                if ( error instanceof DAOError ) {
                    throw new ControllerError(403, 'not-authorized', error.message, `Invalid token.`)
                } else {
                    throw error
                }
            }

            if ( currentUser && token.userId !== currentUser.id ) {
                throw new ControllerError(400, 'logged-in',
                    `User(${currentUser.id}) attempted to use token for User(${token.userId}).`,
                    `You are currently logged in with another user.  Please log out first.`)
            }
            
            if ( token.userId != user.id ) {
                throw new ControllerError(403, 'not-authorized',
                    `User(${user.id}) attempted to change their password with a valid token that wasn't theirs!`,
                    `Invalid token.`)
            }

            // Set the type based on the token type.
            if ( token.type === 'reset-password' ) {
                type = 'password-reset'
            } else if ( token.type === 'invitation' ) {
                type = 'invitation-acceptance'
            } else {
                throw new ControllerError(400, 'invalid',
                    `Attempt to PATCH with an invalid token type: ${token.type}.`,
                    `Invalid token.`)
            }

            // Token was valid.  Clean it off the user object before we use
            // it as a patch.
            delete user.token
        } 

        // Next check to see if they sent their password.  If they did and the
        // authentication is successful, then this is:
        //
        // - authenticated-edit
        //
        else if ( user.oldPassword) {
            try {
                const existingUserId = await this.auth.authenticateUser({ 
                    email: request.session.user.email, 
                    password: user.oldPassword
                })

                if ( existingUserId != user.id) {
                    throw new ControllerError(403, 'not-authorized',
                        `User(${user.id}) gave credentials that matched User(${existingUserId})!`)
                }

                // OldPassword was valid and the user successfully
                // authenticated. Now clean it off the user object before
                // we use it as a patch.
                delete user.oldPassword


                // They've successfully authenticated with old password.
                type = 'authenticated-edit'
            } catch (error ) {
                if ( error instanceof ServiceError ) {
                    if ( error.type == 'authentication-failed' || error.type == 'no-user' || error.type == 'no-user-password' ) {
                        throw new ControllerError(403, 'not-authorized', 
                            error.message, 
                            'Your password was incorrect.')
                    } else if ( error.type == 'multiple-users' ) {
                        throw new ControllerError(500, 'server-error', 
                            error.message,
                            'Multiple users found for your credentials. This is a bug, please report it!')
                    } else if ( error.type == 'no-credential-password' ) {
                        throw new ControllerError(400, 'invalid', 
                            error.message,
                            `Your current password is required.`)
                    } else {
                        throw error
                    }
                } else {
                    throw error
                }
            }
        }

        // If the current user isn't the user being edited, but is an admin or
        // superadmin, then this is an:
        //
        // - admin-edit
        //
        else if ( currentUser.id !== existingUser.id 
            && (currentUser.siteRole === 'admin' || currentUser.siteRole === 'superadmin')) 
        {
            type = 'admin-edit'
        }

        // Otherwise this is an:
        //
        // - edit
        //
        else {
            type = 'edit'
        }

        // ================== Validation ======================================
        // Now that we know what we're doing, we need to validate the PATCH
        // that has been sent to us.

        // 2. User being patched must be the same as the logged in user or the
        // logged in user must be an admin.
        if ( type !== 'admin-edit' && currentUser && currentUser.id != id) {
            throw new ControllerError(403, 'not-authorized', 
                `User(${request.session.user.id}) attempted to update another user(${id}).`,
                `You may not update a user other than yourself.`)
        }

        // General user validation.
        const validationErrors = await this.validationService.validateUser(user, existingUser, type)
        if ( validationErrors.length > 0 ) {
            const errorString = validationErrors.reduce((string, error) => `${string}\n${error.message}`, '')
            const logString = validationErrors.reduce((string, error) => `${string}\n${error.log}`, '')
            throw new ControllerError(400, 'invalid',
                `User submitted an invalid user: ${logString}`,
                errorString)
        }

        // ================== Update ==========================================
        // Execute the update, making any changes to the PATCH that we need to.

        // If they included their password, hash it before we put it in the
        // database.
        if( user.password ) {
            user.password  = this.auth.hashPassword(user.password)
        }

        // If they included an email, determine whether we need to change their status.
        if ( user.email ) {
            // If this is an invitation and they aren't changing their email, then go 
            // ahead and confirm it since the token they are using came from their email.
            if ( type === 'invitation-acceptance' && user.email === existingUser.email ) {
                user.status = 'confirmed'
            } else if ( user.email != existingUser.email ) {
                // Otherwise, if we're about to change their email, then the
                // new email is unconfirmed. Make sure to update the status.
                user.status = 'unconfirmed'
            }
        }

        if ( existingUser.fileId && user.fileId !== undefined && existingUser.fileId != user.fileId ) {
            await this.fileDAO.deleteFile(existingUser.fileId)
        }

        await this.userDAO.updateUser(user)

        // ================== Follow Up =======================================
        // We've finished the update, now we need to do any follow up: sending
        // notifications, cleaning up, setting tokens, etc.
        
        // Issue #132 - We're going to allow the user's email to be returned in this case,
        // because only authenticated users or admins may call this endpoint. 
        const results = await this.userDAO.selectUsers({ where: 'users.id=$1', params: [user.id], fields: 'all' })

        if ( ! results.dictionary[user.id] ) {
            throw new ControllerError(500, 'server-error', `Failed to find user(${user.id}) after update!`)
        }

        const entity = results.dictionary[user.id]

        // If we get to this point, we know the user being updated is the same
        // as the user in the session or is a new user registering from an
        // invite.  Update the session.  We don't need to pull the full
        // session, because if this is a registration, then the page will be
        // refreshed and GET /authentication will be called which will pull the
        // full session.
        //
        // TECHDEBT This isn't the cleanest flow, and it's probably going to
        // prove a bit brittle.
        if ( (currentUser && currentUser.id === entity.id )
            || ( type === 'password-reset' || type === 'invitation-acceptance')) 
        {
            request.session.user = entity 
        }

        // If the user's status has been set to 'banned', then we need to
        // destroy their sessions and log them out.
        if ( entity.status === 'banned' ) {
            await this.core.database.query(`
                DELETE FROM session WHERE sess->'user'->>'id' = $1
            `, [ entity.id ])
        }

        // If we've changed the email, then we need to send out a new
        // confirmation token.
        if ( entity.email != existingUser.email ) {
            const token = this.tokenDAO.createToken('email-confirmation')
            token.userId = entity.id
            token.id = await this.tokenDAO.insertToken(token)

            await this.emailService.sendEmailConfirmation(entity, token)
        }

        if ( type === 'invitation-acceptance' || type === 'password-reset' ) {
            // Delete the token now that we're done with it.
            await this.tokenDAO.deleteToken(token)
        }

        const relations = await this.getRelations(currentUser, results)

        return response.status(200).json({ 
            entity: entity,
            relations: relations
        })
    }

    /**
     * DELETE /user/:id
     *
     * Delete an existing user.
     */
    async deleteUser(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User attempting to submit friend request is not authenticated.`,
                `You may not submit a friend request without authenticating.`)
        }

        const userId = request.params.id

        const canAdminSite = await this.permissionService.can(currentUser, 'admin', 'Site')
        if ( userId !== currentUser.id && canAdminSite !== true ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to delete User(${userId}) without permission.`,
                `You may not delete another user, only yourself.`)
        }

        if ( currentUser.status === 'banned' && canAdminSite !== true) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to delete themselves, but they are banned.`,
                `You are banned, you may not delete yourself.`)
        }


        await this.userDAO.deleteUser({ id: userId })

        if ( userId === currentUser.id ) {
            request.session.destroy(function(error) {
                if (error) {
                    console.error(error)
                    response.status(500).json({error: 'server-error'})
                } else {
                    response.status(200).json(null)
                }
            })
        } else {
            response.status(200).json(null)
        }
    }

} 
