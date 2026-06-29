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
    MultifactorAuthenticationService,

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
        this.multifactorAuthentication = new MultifactorAuthenticationService(core)

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
                } else {
                    throw error
                }
            }
        } else if ( 'pendingUserId' in request.session && request.session.pendingUserId !== null && request.session.pendingUserId !== undefined ) {
            response.status(200).json({
                session: {
                    pendingUserId: request.session.pendingUserId 
                }
            })
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
                    `No user found with either email or token.`,
                    `Authentication failed.`)

            }

            const session = await this.auth.getSessionForUserId(userId)
            
            if ( session.user.authenticationMultifactorState === 'enabled' ) {
                request.session.pendingUserId = session.user.id

                response.status(200).json({
                    session: {
                        pendingUserId: session.user.id
                    }
                })
            } else {
                request.session.user = session.user
                request.session.file = session.file
                response.status(200).json({
                    session: session 
                })
            }

        } catch (error ) {
            request.logger.warn(error)
            if ( error instanceof ServiceError ) {
                if ( error.type == 'no-user' ) {
                    throw new ControllerError(403, 'authentication-failed', error.message, `Authentication failed.`)
                } else if ( error.type == 'multiple-users') {
                    throw new ControllerError(403, 'authentication-failed', error.message, `Authentication failed.`)
                } else if ( error.type == 'no-user-password' ) {
                    throw new ControllerError(403, 'authentication-failed', error.message, `Authentication failed.`)
                } else if ( error.type === 'banned' ) {
                    throw new ControllerError(403, 'authentication-failed', error.message, `Authentication failed.`)
                } else if ( error.type == 'no-credential-password' ) {
                    throw new ControllerError(400, 'password-required', error.message, `You must include your password to authenticate.`)
                } else if ( error.type == 'authentication-failed' ) {
                    throw new ControllerError(403, 'authentication-failed', error.message, `Authentication failed.`)
                } else if ( error.type == 'authentication-timeout' ) {
                    throw new ControllerError(429, 'authentication-timeout', error.message, `Too many attempts. Please wait 15 minutes before trying again.`)
                } else {
                    throw error
                }
            } else {
                throw error 
            }
        }
    }

    async patchAuthentication(request, response) {
        const currentUser = request.session.user

        if ( currentUser ) {
            if ( ! ( 'token' in request.body ) ) {
                throw new ControllerError(400, 'invalid',
                    `User attempting to verify authentication without a token.`,
                    `You must include a TOPT token to verify your authentication.`)
            }

            const token = request.body.token

            if ( currentUser.authenticationMultifactorState !== 'pending' ) {
                throw new ControllerError(403, 'not-authorized',
                    `Logged in User(${currentUser.id}) attempting to verify authentication.`,
                    `You are already logged in!`)
            }


            const verified = await this.multifactorAuthentication.verify(currentUser.id, token)

            if ( verified !== true ) {
                throw new ControllerError(404, 'not-found',
                    `User(${currentUser.id}) failed to validate their multifactor authentication.`,
                    `Authentication failed.`)
            }

            const codes = await this.multifactorAuthentication.generateRecoveryCodes(currentUser.id)

            const userPatch = {
                id: currentUser.id,
                authenticationMultifactorState: 'enabled'
            }
            await this.userDAO.updateUser(userPatch)

            const session = await this.auth.getSessionForUserId(currentUser.id)

            request.session.user = session.user
            request.session.file = session.file

            await this.notificationService.sendNotifications(
                session.user, 
                'User:update:mfa',
                {
                    userId: session.user.id,
                    state: 'Enabled'
                },
                { noWeb: true, noMobile: true  }
            )

            response.status(200).json({
                session: session,
                codes: codes
            })

            return
        } else {

            const pendingUserId = request.session.pendingUserId

            if ( ! pendingUserId ) {
                throw new ControllerError(401, 'not-authenticated',
                    `Attempt to validate authentication without pending authentication.`,
                    `You haven't logged in yet.  Log in before submitting an auth token.`)
            }

            if ( ! ( 'token' in request.body ) && ! ( 'recoveryCode' in request.body ) ) {
                throw new ControllerError(400, 'invalid',
                    `User attempting to verify authentication without a token or recovery code.`,
                    `You must include an TOPT token or recovery code to verify your authentication.`)
            }


            // If they've made more than 10 or more attempts in the last 30 seconds, then rate limit them.
            const shouldRateLimit = await this.multifactorAuthentication.shouldRateLimit(pendingUserId)
            if ( shouldRateLimit !== false ) {
                throw new ControllerError(429, 'too-many-attempts',
                    `User(${pendingUserId}) is being rate limited for too many MFA attempts.`,
                    `Too many attempts.  Please wait 30 seconds and try again.`)

            } 

            // If they provided a TOPT token, then use that to verify them.
            if ( 'token' in request.body ) {
                const token = request.body.token
                if ( token === null || token === undefined || ! ( typeof token === 'string' ) || token.length < 6 || token.length > 6 ) {
                    throw new ControllerError(400, 'invalid',
                        `User attempting to verify authentication with an invalid token.`,
                        `You must include an TOPT token to verify your authentication.`)
                }

                const verified = await this.multifactorAuthentication.verify(pendingUserId, token)
                if ( verified !== true ) {
                    await this.multifactorAuthentication.incrementRateLimit(pendingUserId)

                    throw new ControllerError(404, 'not-found',
                        `User(${pendingUserId}) failed to validate their multifactor authentication.`,
                        `Failed to validate your.`)
                } else {
                    await this.multifactorAuthentication.clearRateLimit(pendingUserId)
                }

                const session = await this.auth.getSessionForUserId(pendingUserId)

                request.session.user = session.user
                request.session.file = session.file

                response.status(200).json({
                    session: session
                })
                return
            } else if ( 'recoveryCode' in request.body ) {
                const code = request.body.recoveryCode
                if ( code === undefined || code === null || ! ( typeof code === 'string' ) ) {
                    throw new ControllerError(400, 'invalid',
                        `User attempting to verify authentication with an invalid recovery code.`,
                        `You must include a valid recovery code to verify your authentication.`)
                }

                const verified = await this.multifactorAuthentication.verifyRecoveryCode(pendingUserId, code)

                if ( verified !== true ) {
                    await this.multifactorAuthentication.incrementRateLimit(pendingUserId)

                    throw new ControllerError(404, 'not-found',
                        `User(${pendingUserId}) failed to validate their recovery code.`,
                        `Failed to validate your recovery code.`)
                } else {
                    await this.multifactorAuthentication.clearRateLimit(pendingUserId)
                }


                const session = await this.auth.getSessionForUserId(pendingUserId)

                request.session.user = session.user
                request.session.file = session.file

                await this.notificationService.sendNotifications(
                    session.user, 
                    'Authentication:update:recovery',
                    {
                        userId: pendingUserId 
                    },
                    { noWeb: true, noMobile: true } // Email only.
                )

                response.status(200).json({
                    session: session
                })

                return
            }
        
            throw new ControllerError(400, 'invalid',
                `User attempting to verify authentication without a token or recovery code.`,
                `You must include an TOPT token or recovery code to verify your authentication.`)
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

    postMultifactor(request, response) {

    }
}

