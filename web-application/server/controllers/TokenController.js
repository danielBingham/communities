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
const backend = require('@communities/backend')
const { validation } = require('@communities/shared')

const BaseController = require('./BaseController')

const ControllerError = require('../errors/ControllerError')

const rateLimits = {
    [BaseController.METHODS.QUERY]: {
        period: 60 * 1000,
        numberOfRequests: 20
    },
    [BaseController.METHODS.GET]: {
        period: 60 * 1000,
        numberOfRequests: 20
    },
    [BaseController.METHODS.POST]: {
        period: 60 * 1000,
        numberOfRequests: 20
    },
    [BaseController.METHODS.PATCH]: {
        period: 60 * 1000,
        numberOfRequests: 20
    },
    [BaseController.METHODS.DELETE]: {
        period: 60 * 1000,
        numberOfRequests: 20
    }
}

module.exports = class TokenController extends BaseController {

    constructor(core) {
        super(core, 'Token', rateLimits)

        this.database = core.database
        this.logger = core.logger
        this.config = core.config

        this.authenticationService = new backend.AuthenticationService(core)
        this.emailService = new backend.EmailService(core)

        this.tokenDAO = new backend.TokenDAO(core)
        this.userDAO = new backend.UserDAO(core)
    }

    /**
     * GET /token/:token
     *
     * Validate a token sent to a user.
     *
     * @param {Object} request  Standard Express request object.
     * @param {string} request.params.token The token we want to validate.
     * @param {string} request.query.type   The type of token we are trying to
     * validate.  Must match what's in the database for :token.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getToken(request, response) {

        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * Permissions:
         * No permissions for this endpoint.  Anyone can hit it, the
         * permissions come from the token and its validation.
         *
         * Validation:
         * 1. :token must be included.
         * 2. request.query.type must be included
         * 3. Token(:token) must be exist
         * 4. Token(:token) must have type equal to request.query.type 
         * 
         * **********************************************************/

        const shouldRateLimit = await this.shouldRateLimit(BaseController.METHODS.GET, request) 
        if ( shouldRateLimit === true ) {
            throw new ControllerError(429, 'too-many-requests',
                `Ip Address '${request.ip}' being rate limited`,
                `You are submitting too many requests.  Only ${rateLimits[BaseController.METHODS.GET].numberOfRequests} allowed per ${rateLimits[BaseController.METHODS.GET].period/1000} seconds.`)
        }

        const currentUser = request.session.user

        // 1. :token must be included.
        if ( ! ('token' in request.params) || request.params.token === undefined || request.params.token === null ) {
            throw new ControllerError(400, 'no-token',
                `Attempt to redeem a token with no token!`,
                `You must provide a token in order to redeem it.`)
        }

        // 2. request.query.type must be included
        if ( ! ( 'type' in request.query) || request.query.type === undefined || request.query.type === null ) {
            throw new ControllerError(403, 'not-authorized',
                `User failed to specify a type when attempting to redeem a token.`,
                `Your token is invalid.`)
        }
        
        const tokenErrors = validation.Token.validateToken(request.params.token)
        if ( tokenErrors.length > 0 ) {
            const logString = tokenErrors.reduce((string, error) => `${string}\n${error.log}`, '')
            throw new ControllerError(403, 'not-authorized',
                `Invalid token: ${ logString }`,
                `Your token is invalid.`)
        }

        const typeErrors = validation.Token.validateType(request.query.type)
        if ( typeErrors.length > 0 ) { 
            const logString = typeErrors.reduce((string, error) => `${string}\n${error.log}`, '')
            throw new ControllerError(403, 'not-authorized',
                `Invalid token: ${ logString }`,
                `Your token is invalid.`)
        }

        let token = null
        try {
            // TokenDAO::validateToken() checks both of the following:
            // 3. Token(:token) must be exist
            // 4. Token(:token) must have type equal to request.query.type 
            token = await this.tokenDAO.validateToken(request.params.token, [ request.query.type ])
        } catch (error) {
            if ( error instanceof backend.DAOError ) {
                throw new ControllerError(403, 'not-authorized', 
                    error.message,
                    `Your token is invalid.`)
            } else {
                throw error
            }
        }

        if ( token === null ) {
            throw new ControllerError(403, 'not-authorized',
                `Invalid token not found.`,
                `Your token is invalid.`)
        }

        if ( currentUser && token.userId !== currentUser.id ) {
            throw new ControllerError(409, 'logged-in',
                `User(${currentUser.id}) currently logged in when attempting to validate a token.`,
                `You cannot validate a token while logged in to another user.`)
        }

        // For the email-confirmation flow, we do log the user in.
        if ( token.type == 'email-confirmation' ) {
            // Mark their user record as confirmed.

            const userUpdate = {
                id: token.userId,
                status: 'confirmed'
            }
            await this.userDAO.updateUser(userUpdate)
            // TODO better to hang on to it and mark it as used?
            await this.tokenDAO.deleteToken(token)

            const session = await this.authenticationService.getSessionForUserId(token.userId)

            // Log the user in.
            request.session.user = session.user
            request.session.file = session.file

            response.status(200).json({
                session: session
            })
        } 
        
        // For reset-password and invitation tokens, we don't log the user in
        // when we validate the token because those flows have multiple steps.
        // The user will be logged in at a later step.
        else if ( token.type == 'reset-password' || token.type == 'invitation') {

            const session = await this.authenticationService.getSessionForUserId(token.userId)
            response.status(200).json({
                user: session.user,
                file: session.file
            })
        }
    }

    /**
     * POST /tokens
     *
     * Create a new token.  Currently `reset-password` and 'email-confirmation'
     * tokens are the only types supported by this endpoint, since invitation
     * tokens are created on the backend.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} request.body The parameters used to create the
     * token.
     * @param {string} request.body.type    The type of token we wish to
     * create.  Currently only 'reset-password' is supported.
     * @param {string} request.body.email   The email for which we are creating
     * a password reset token.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async postToken(request, response) {
        /*************************************************************
         * Permissions Checking and Input Validation
         *
         * Permissions:
         * Anyone may hit this endpoint to create a reset password token.
         *
         * Validation:
         * 1. A User with request.body.email must exist.
         * 2. request.body.type must be 'reset-password' or 'email-confirmation'
         *
         * **********************************************************/

        const shouldRateLimit = await this.shouldRateLimit(BaseController.METHODS.POST, request) 
        if ( shouldRateLimit === true ) {
            throw new ControllerError(429, 'too-many-requests',
                `Ip Address '${req.ip}' being rate limited`,
                `You are submitting too many requests.  Only ${rateLimits[BaseController.METHODS.POST].numberOfRequests} allowed per ${rateLimits[BaseController.METHODS.POST].period/1000} seconds.`)
        }
        
        const tokenParams  = request.body
        if ( tokenParams.email ) {
            tokenParams.email = tokenParams.email.toLowerCase().trim()
        }

        const typeErrors = validation.Token.validateType(tokenParams.type)
        if ( typeErrors.length > 0 ) { 
            const logString = typeErrors.reduce((string, error) => `${string}\n${error.log}`, '')
            throw new ControllerError(400, 'invalid',
                `Invalid token request: ${ logString }`,
                `Your token request is invalid.`)
        }

        const emailErrors = validation.User.validateEmail(tokenParams.email)
        if ( emailErrors.length > 0 ) { 
            const logString = emailErrors.reduce((string, error) => `${string}\n${error.log}`, '')
            throw new ControllerError(400, 'invalid',
                `Invalid token request: ${ logString }`,
                `Your token request is invalid.`)
        }

        // Validation: 2. request.body.type must be 'reset-password'
        if ( tokenParams.type == 'reset-password' ) {
            // Validation: 1. A User with request.body.email must exist.
            const userResults = await this.userDAO.selectUsers({ where: 'email=$1', params: [ tokenParams.email ], fields: 'all' })

            if ( userResults.list.length <= 0) {
                return response.status(200).json(null)
            }
            const user = userResults.dictionary[userResults.list[0]]

            const token = this.tokenDAO.createToken(tokenParams.type)
            token.userId = user.id
            token.creatorId = null
            token.id = await this.tokenDAO.insertToken(token)

            await this.emailService.sendPasswordReset(user, token)

            response.status(200).json(null)
        } else if (tokenParams.type == 'email-confirmation' ) {
            const currentUser = request.session.user

            if ( ! currentUser ) {
                throw new ControllerError(401, 'not-authenticated',
                    `An unauthenticated user is attempting to request an email confirmation token.`,
                    `You must be authenticated to do that.`)
            }

            const userResults = await this.userDAO.selectUsers({ where: 'email=$1', params: [ tokenParams.email ], fields: 'all' })

            if ( userResults.list.length <= 0) {
                return response.status(200).json(null)
            }
            const user = userResults.dictionary[userResults.list[0]]

            if ( user.id !== currentUser.id ) {
                throw new ControllerError(403, 'not-authorized',
                    `User(${currentUser.id}) attempting to require email confirmation for User(${user.id}).`,
                    `You may only request an email confirmation for yourself.`)
            }

            if ( user.status != 'unconfirmed' ) {
                throw new ControllerError(403, 'not-authorized',
                    `User(${user.id}) attempting to send new email confirmation when they are confirmed.`,
                    `You are already confirmed!`)
            }

            const token = this.tokenDAO.createToken('email-confirmation')
            token.userId = user.id
            token.id = await this.tokenDAO.insertToken(token)

            await this.emailService.sendEmailConfirmation(user, token)
            response.status(200).json(null)
        } else {
            throw new ControllerError(400, 'invalid-token',
                `Attempt to create an invalid token type.`)
        }

    }
}
