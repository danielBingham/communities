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
    AuthenticationService,

    UserDAO,
    TokenDAO,

    ServiceError
} = require('@communities/backend')

const ControllerError = require('../errors/ControllerError')


/**
 * Controller for the authentication resource.
 *
 * The authentication resource represents the user's authentication state,
 * whether they are logged in or not.
 */
module.exports = class AuthenticationController {

    constructor(core) {
        this.core = core

        this.database = core.database
        this.logger = core.logger
        this.config = core.config

        this.auth = new AuthenticationService(core)

        this.userDAO = new UserDAO(core)
        this.tokenDAO = new TokenDAO(core)
    }


    /**
     * GET /authentication
     *
     * Check the session and get the user (or null) and their settings.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getAuthentication(request, response) {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * Any user may call this endpoint.  It simply checks the session and
         * returns what it finds.
         * 
         * **********************************************************/
        if ('user' in request.session && request.session.user !== null && request.session.user !== undefined) {
            try { 
                const session = await this.auth.getSessionForUserId(request.session.user.id)

                if ( session.user && session.user.status === 'banned' ) {
                    // If they are banned, destroy the session.
                    request.session.destroy(function(error) {
                        if (error) {
                            console.error(error)
                            response.status(500).json({error: 'server-error'})
                        } else {
                            response.status(200).json({
                                session: null
                            })
                        }
                    })
                    return
                }

                request.session.user = session.user
                request.session.file = session.file


                response.status(200).json({
                    session:  session
                })
            } catch (error) {
                if ( error.type == 'no-user' ) {
                    request.session.destroy(function(error) {
                        if (error) {
                            console.error(error)
                            response.status(500).json({error: 'server-error'})
                        } else {
                            response.status(200).json({
                                session: null
                            })
                        }
                    })
                }
            }
        } else {
            response.status(200).json({
                session: null
            })
        }
    }

    /**
     * POST /authentication
     *
     * Used to authenticate a user using the credentials provided in the
     * request body, and logs them into the application, storing their user
     * object in the session.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} request.body The user's authentication credentials.
     * @param {string} request.body.email   The user's email.
     * @param {string} request.body.password    The user's password.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async postAuthentication(request, response) {
        const credentials = request.body

        /************************************************************
         *  This is the authentication endpoint, so anyone may call it.
         *  Authentication checks happen in
         *  AuthenticationService::authenticateUser()
         ************************************************************/
        try {
            let userId = null
            if ( 'email' in credentials) {
                credentials.email = credentials.email.trim().toLowerCase()
                userId = await this.auth.authenticateUser(credentials)
            } else if ( 'token' in credentials) {
                const token = await this.tokenDAO.validateToken(credentials.token, [ 'reset-password', 'email-confirmation', 'invitation'])
                userId = token.userId
            }

            if ( ! userId ) {
                throw new ControllerError(403, 'authentication-failed',
                    `No user found with either email or token.`)

            }

            const session = await this.auth.getSessionForUserId(userId)
            request.session.user = session.user
            request.session.file = session.file

            response.status(200).json({
                session: session
            })
        } catch (error ) {
            request.logger.warn(error)
            if ( error instanceof ServiceError ) {
                if ( error.type == 'no-user' ) {
                    throw new ControllerError(403, 'authentication-failed', error.message)
                } else if ( error.type == 'multiple-users') {
                    throw new ControllerError(403, 'authentication-failed', error.message)
                } else if ( error.type == 'no-user-password' ) {
                    throw new ControllerError(403, 'authentication-failed', error.message)
                } else if ( error.type === 'banned' ) {
                    throw new ControllerError(403, 'authentication-failed', error.message)
                } else if ( error.type == 'no-credential-password' ) {
                    throw new ControllerError(400, 'password-required', error.message)
                } else if ( error.type == 'authentication-failed' ) {
                    throw new ControllerError(403, 'authentication-failed', error.message)
                } else if ( error.type == 'authentication-timeout' ) {
                    throw new ControllerError(429, 'authentication-timeout', error.message)
                } else {
                    throw error
                }
            } else {
                throw error 
            }
        }
    }

    /**
     * DELETE /authentication
     *
     * Destroy the session and logout the user.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} response Standard Express response object.
     *
     * @returns {void} 
     */
    deleteAuthentication(request, response) {
        /**********************************************************************
         * This endpoint simply destroys the session, logging out the user.
         * Anyone may call it.
         **********************************************************************/

        request.session.regenerate(function(error) {
            if (error) {
                console.error(error)
                response.status(500).json({error: 'server-error'})
            } else {
                response.status(200).json(null)
            }
        })
    }
}

