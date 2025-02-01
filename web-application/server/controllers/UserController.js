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
const backend = require('@communities/backend')

const ControllerError = require('../errors/ControllerError')

module.exports = class UserController {

    constructor(core) {
        this.core = core

        this.database = core.database
        this.logger = core.logger
        this.config = core.config

        this.auth = new backend.AuthenticationService(core)
        this.emailService = new backend.EmailService(core)
        this.notificationService = new backend.NotificationService(core)

        this.userDAO = new backend.UserDAO(core)
        this.userRelationshipsDAO = new backend.UserRelationshipDAO(core)
        this.tokenDAO = new backend.TokenDAO(core)
        this.fileDAO = new backend.FileDAO(core)
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
            where: `WHERE users.status != 'invited'`,
            params: [],
            page: 1,
            order: '',
            emptyResult: false,
            requestedRelations: query.relations ? query.relations : []
        }


        if ( query.name && query.name.length > 0) {
            result.params.push(query.name)
            result.where += ` AND SIMILARITY(users.name, $${result.params.length}) > 0`
            result.order = `SIMILARITY(users.name, $${result.params.length}) desc`
        }

        if ( query.username && query.username.length > 0 ) {
            result.params.push(query.username)
            result.where += ` AND users.username = $${result.params.length}`
        }

        if ( query.ids && query.ids.length > 0 ) {
            result.params.push(query.ids)
            result.where += ` AND users.id = ANY($${result.params.length}::uuid[])`
        }

        if ( query.page && ! options.ignorePage ) {
            result.page = query.page
        } else if ( ! options.ignorePage ) {
            result.page = 1
        }

        // If we haven't added anything to the where clause, then clear it.
        if ( result.where == 'WHERE') {
            result.where = ''
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
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * Anyone may call this endpoint.
         * 
         * **********************************************************/

        const { where, params, order, page, emptyResult, requestedRelations } = await this.parseQuery(request.session.user, request.query)

        if ( emptyResult ) {
            return response.status(200).json({
                meta: {
                    count: 0,
                    page: 1,
                    pageSize: 1,
                    numberOfPages: 1
                }, 
                result: []
            })
        }
        const meta = await this.userDAO.countUsers(where, params, page)
        const results = await this.userDAO.selectCleanUsers(where, params, order, page)

        results.meta = meta

        results.relations = await this.getRelations(request.session.user, results, requestedRelations) 

        return response.status(200).json(results)
    }

    /**
     * POST /users
     *
     * Create a new `user`.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} request.body The user definition.
     * @param {string} request.body.email   The user's email.
     * @param {string} request.body.name    The users's name.
     * @param {string} request.body.password    (Optional) The user's password.  Required if no user is logged in.
     * @param {string} request.body.institution (Optional) The user's institution.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async postUsers(request, response) {
        const user = request.body

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * There are two possible flows this endpoint can take, depending on
         * whether or not we have a logged in user already:
         *
         * 1. If no user is logged in, then we assume they are creating their
         * own user.  We'll send an email confirmation.
         * 2. If a user is logged in, then we assume they are inviting the user
         * they are creating.  We send an invitation email.
         *
         * Permissions: 
         * Anyone can call this endpoint.
         *
         * Validation:
         * 1. request.body.email must not already be attached to a user in the
         * database.
         * 2. Invitation => no password needed
         * 3. Registration => must include password
         * 4. request.body.name is required.
         * 5. request.body.email is required. 
         *
         * **********************************************************/

        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `Unauthenticated User attempting to create new User.`,
                `We're currently in invite-only beta, so you must recieve an invite to register. 
                Reach out to contact@communities.social if you'd like an invite.`)
        }

        user.email = user.email.toLowerCase().trim()

        if ( ! user.email.includes('@') ) {
            throw new ControllerError(400, 'invalid',
                `Attempt to create a user with an invalid email: ${user.email}`,
                `'${user.email}' is not a valid email.`)
        }

        // If a user already exists with that email, send a 409 Conflict
        // response.
        //
        const userExistsResults = await this.database.query(
            'SELECT id, username, email FROM users WHERE email=$1 OR username=$2',
            [ user.email, user.username ]
        )

        // 1. request.body.email must not already be attached to a user in the
        // database.
        if (userExistsResults.rowCount > 0) {
            throw new ControllerError(403, 'not-authorized', 
                `Attempting to create a User(${userExistsResults.rows[0].id}) that already exists!`,
                `That person has already been invited.`)
        }

        // If we're creating a user with a password, then this is just a normal
        // unconfirmed user creation.  However, if we're creating a user
        // without a password, then this is a user who is being invited.
        //
        // Corresponds to:
        // Validation: 2. Invitation => no password needed
        // Validation: 3. Registration => must include password
        if ( user.password && ! currentUser ) {
            user.password = this.auth.hashPassword(user.password)
            user.status = 'unconfirmed'
        } else if ( currentUser ) {
            if ( currentUser.invitations >= 1 ) {
                user.status = 'invited'
            } else {
                throw new ControllerError(403, 'not-authorized',
                    `User(${currentUser.id}) attempting to invite a user without any invitations.`,
                    `You are out of invitations for the time being. More invitations will be issued in the future.`)
            }
        } else {
            throw new ControllerError(400, 'invalid',
                `Users creating accounts must include a password!`,
                `You must include a password.`)
        }

        try {
            await this.userDAO.insertUsers(user)
        } catch ( error ) {
            if ( error instanceof backend.DAOError ) {
                // `insertUser()` check both of the following:
                // 4. request.body.name is required.
                // 5. request.body.email is required. 
                if ( error.type == 'name-missing' ) {
                    throw new ControllerError(400, 'invalid', 
                        error.message,
                        `You must include a name.`)
                } else if ( error.type == 'email-missing' ) {
                    throw new ControllerError(400, 'bad-data', 
                        error.message,
                        `You must include an email.`)
                } else {
                    throw error
                }
            } else {
                throw error
            }
        }

        const createdUserResults = await this.userDAO.selectUsers('WHERE users.id=$1', [user.id])

        if ( ! createdUserResults.dictionary[user.id] ) {
            throw new ControllerError(500, 'server-error', 
                `No user found after insertion. Looking for id ${user.id}.`,
                `We created the user, but couldn't find them after creation. Please report bug.`)
        }

        const createdUser = createdUserResults.dictionary[user.id]

        if ( currentUser ) {
            const token = this.tokenDAO.createToken('invitation')
            token.userId = createdUser.id
            token.creatorId = currentUser.id
            token.id = await this.tokenDAO.insertToken(token)

            await this.emailService.sendInvitation(currentUser, createdUser, token)

            // Update the current user and decrement their invitations.
            const userPatch = {
                id: currentUser.id,
                invitations: currentUser.invitations-1
            }
            await this.userDAO.updateUser(userPatch)

            // Since the user exists, go ahead and insert the friend
            // relationship.
            await this.userRelationshipsDAO.insertUserRelationships({ 
                userId: currentUser.id,
                relationId: createdUser.id,
                status: "confirmed"
            })
           
            // In the case of a user invitation, we don't actually want to
            // return the newly created user (it's basically empty).  We want
            // to return the updated currentUser who has less invitations now.
            currentUser.invitations = currentUser.invitations-1
            response.status(201).json({
                entity: currentUser,
                relations: {}
            })
            return
        } else {
            const token = this.tokenDAO.createToken('email-confirmation')
            token.userId = createdUser.id
            token.creatorId = createdUser.id
            token.id = await this.tokenDAO.insertToken(token)

            await this.emailService.sendEmailConfirmation(createdUser, token)
        }

        let results = null
        if ( currentUser && currentUser.id == user.id ) {
            results = await this.userDAO.selectUsers(`WHERE users.id = $1`, [ user.id ])
        } else {
            results = await this.userDAO.selectCleanUsers('WHERE users.id=$1', [ user.id ])
        }

        if (! results.dictionary[user.id] ) {
            throw new ControllerError(500, 'server-error', 
                `No user found after insertion. Looking for id ${user.id}.`,
                `We created the user, but couldn't find them after creation. Please report bug.`)
        }

        const relations = await this.getRelations(request.session.user, results)

        return response.status(201).json({ 
            entity: results.dictionary[user.id],
            relations: relations
        })
    }

    /**
     * GET /user/:id
     *
     * Get details for a single user in thethis.database.
     *
     * @param {Object} request  Standard Express request object.
     * @param {int} request.params.id   The id of the user we wish to retrieve.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getUser(request, response) {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * Anyone may call this endpoint.
         * 
         * **********************************************************/
        const currentUser = request.session.user

        let results = null
        if ( currentUser && currentUser.id == request.params.id ) {
            results = await this.userDAO.selectUsers(`WHERE users.id = $1 AND users.status != 'invited'`, [ request.params.id ])
        } else {
            results = await this.userDAO.selectCleanUsers(`WHERE users.id = $1 AND users.status != 'invited'`, [request.params.id])
        }

        if ( ! results.dictionary[ request.params.id] ) {
            throw new ControllerError(404, 'not-found', `User(${request.params.id}) not found.`)
        }

        const relations = await this.getRelations(currentUser, results)

        return response.status(200).json({ 
            entity: results.dictionary[request.params.id],
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

        // 1. User must be logged in unless they are using  token.
        if ( ! currentUser && ! ( 'token' in user) ) {
            throw new ControllerError(401, 'not-authenticated', 
                `Unauthenticated user attempting to update user(${user.id}).`,
                `You must be authenticated to update a user.`)
        } 

        // 2. User being patched must be the same as the logged in user.
        // 2a. :id must equal request.session.user.id
        //
        // NOTE: If this requirement changes (to allow admins to patch users,
        // for instance), then make sure to strip the email out of the returned
        // user at the botton of this function.  Or at least, spend some time
        // considering whether you need to.
        if ( currentUser && currentUser.id != id) {
            throw new ControllerError(403, 'not-authorized', 
                `User(${request.session.user.id}) attempted to update another user(${id}).`,
                `You may not update a user other than yourself.`)
        }

        // 2. User being patched must be the same as the logged in user.
        // 2b. :id must equal request.body.id
        if ( id != user.id ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${id}) attempted to update another User(${user.id}).`,
                `You may not update a user other than yourself.`)
        }
        const existingUsers = await this.userDAO.selectUsers(`WHERE users.id = $1`, [ id ] )

        // 3. User(:id) must exist.
        // If they don't exist, something is really, really wrong -- since they
        // are logged in and in the session!
        if ( ! existingUsers.dictionary[id] ) {
            throw new ControllerError(404, 'not-found',
                `Attempt to update a User(${id}) that doesn't exist.`,
                `Either that user doesn't exist or you don't have permissions to view them.`)
        }

        const existingUser = existingUsers.dictionary[id]

        let authentication = null 
        let token = null

        // If the user has a token, then they are authenticated and any change
        // they are making is valid. A reset password token allows change of
        // password and an invitation token allows a change of everything.
        //
        // TODO Should we prevent changing email with only a reset password token?
        if ( user.token ) {
            try {
                token = await this.tokenDAO.validateToken(user.token, [ 'reset-password', 'invitation' ])
            } catch (error ) {
                if ( error instanceof backend.DAOError ) {
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


            // If this was an invitation token, and they aren't including
            // an email, then go ahead and confirm the email in the database.
            // 
            // If they did include an email, we'll check it below.
            if ( token.type == 'invitation' ) {
                if ( ! ("email" in user)) { 
                    user.status = 'confirmed'
                }

            }


            // They've successfully authenticated with the token.
            authentication = token.type 

            // Token was valid.  Clean it off the user object before we use
            // it as a patch.
            delete user.token

            // Delete the token now that we're done with it.  We still
            // have it in local and can use it later, but we don't want to
            // leave it hanging if we hit a different error later.
            //
            // TODO Do we want to let the token hang?!
            await this.tokenDAO.deleteToken(token)
        } 

        
        // If they include the oldPassword, attempt to authenticate them with
        // that.
        else if ( user.oldPassword ) {
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
                authentication = 'password' 
            } catch (error ) {
                if ( error instanceof backend.ServiceError ) {
                    if ( error.type == 'authentication-failed' || error.type == 'no-user' || error.type == 'no-user-password' ) {
                        throw new ControllerError(403, 'not-authorized', error.message)
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

        // 4. If a password is included, then they need to be authenticated.
        //
        // Any of the authentication methods are valid: oldPassword, invitation
        // token, and reset-password token all allow changing the password.
        if( user.password ) {
            if ( authentication === null ) {
                throw new ControllerError(403, 'not-authorized',
                    `User(${user.id}) attempted to change their password with out reauthenticating.`)
            }

            user.password  = this.auth.hashPassword(user.password)
        }

        // 5. If an email is included, then they need to be authenticated.
        //
        // Only invitation and oldPassword authentications are valid.
        if ( user.email ) {
            if ( authentication === null ) {
                throw new ControllerError(403, 'not-authorized',
                    `User(${user.id}) attempted to change their email with out reauthenticating.`)
            } else if (authentication == 'reset-password') {
                throw new ControllerError(403, 'not-authorized'
                    `User(${user.id}) attempted to use a reset-password token to update email.`)
            }


            // If this is an invitation and they aren't changing their email, then go 
            // ahead and confirm it since the token they are using came from their email.
            if ( authentication == "invitation" && user.email == existingUser.email ) {
                user.status = 'confirmed'
            } else if ( user.email != existingUser.email ) {
                // First we need to make sure the new email is not in use.
                const existingEmailResults = await this.userDAO.selectUsers(`WHERE users.email = $1`, [ user.email ])

                if ( existingEmailResults.list.length > 0 ) {
                    throw new ControllerError(400, 'email-taken',
                        `User(${user.id}) attempted to change their email to one already in use.`,
                        `That email is already in use by another user.`)
                }


                // Otherwise, if we're about to change their email, then the
                // new email is unconfirmed. Make sure to update the status.
                user.status = 'unconfirmed'
            }
        }

        if ( existingUser.fileId && user.fileId !== undefined && existingUser.fileId != user.fileId ) {
            await this.fileDAO.deleteFile(existingUser.fileId)
        }

        await this.userDAO.updateUser(user)

        // Issue #132 - We're going to allow the user's email to be returned in this case,
        // because only authenticated users may call this endpoint and then
        // only on themselves.
        const results = await this.userDAO.selectUsers('WHERE users.id=$1', [user.id])

        if ( ! results.dictionary[user.id] ) {
            throw new ControllerError(500, 'server-error', `Failed to find user(${user.id}) after update!`)
        }

        // If we get to this point, we know the user being updated is the same
        // as the user in the session or is a new user registering from an
        // invite.  Update the session.  We don't need to pull the full
        // session, because if this is a registration, then the page will be
        // refreshed and GET /authentication will be called which will pull the
        // full session.
        //
        // TECHDEBT This isn't the cleanest flow, and it's probably going to
        // prove a bit brittle.
        request.session.user = results.dictionary[user.id] 

        // If we've changed the email, then we need to send out a new
        // confirmation token.
        if ( results.dictionary[user.id].email != existingUser.email ) {
            const token = this.tokenDAO.createToken('email-confirmation')
            token.userId = results.dictionary[user.id].id
            token.id = await this.tokenDAO.insertToken(token)

            await this.emailService.sendEmailConfirmation(results.dictionary[user.id], token)
        }


        const relations = await this.getRelations(request.session.user, results)

        return response.status(200).json({ 
            entity: results.dictionary[user.id],
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

        if ( userId !== currentUser.id ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to delete User(${userId}) without permission.`,
                `You may not delete another user, only yourself.`)
        }


        await this.userDAO.deleteUser(currentUser)

        request.session.destroy(function(error) {
            if (error) {
                console.error(error)
                response.status(500).json({error: 'server-error'})
            } else {
                response.status(200).json(null)
            }
        })
    }

} 
