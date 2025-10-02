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

const TokenDAO = require('../daos/TokenDAO')
const UserDAO = require('../daos/UserDAO')
const UserRelationshipDAO = require('../daos/UserRelationshipDAO')

const AuthenticationService = require('./AuthenticationService')
const EmailService = require('./EmailService')
const NotificationService = require('./NotificationService')
const TokenService = require('./TokenService')
const ValidationService = require('./ValidationService')

const ServiceError = require('../errors/ServiceError')

module.exports = class UserService { 
    constructor(core) {
        this.core = core

        this.tokenDAO = new TokenDAO(core)
        this.userDAO = new UserDAO(core)
        this.userRelationshipsDAO = new UserRelationshipDAO(core)

        this.auth = new AuthenticationService(core)
        this.emailService = new EmailService(core)
        this.notificationService = new NotificationService(core)
        this.tokenService = new TokenService(core)
        this.validationService = new ValidationService(core)
    }

    /**
     * Invite a single user or an array of users.  Create a relationship
     * between the current user and the invited user(s).
     *
     * @param {Object} currentUser  A User entity with all fields representing the currently logged in user.
     * @param {Object|Object[]} body         An object with a single 'email'
     * field or an array of objects with an 'email' field representing the
     * users to be invited.
     *
     * @return { [ Object, Object[] ] }   Return an array where the first
     * element is the User entity for the invited user and the second is an
     * array of Error objects.
     */
    async inviteUser(currentUser, body) {
        const errors = []
        if ( ! ( 'email' in body ) ) {
            errors.push({
                type: 'missing-email',
                log: `User cannot be invited without an email.`,
                message: `You cannot invite someone without their email.`
            })
            return [ null, errors ]
        }

        const user = {
            email: body.email.toLowerCase().trim()
        }

        if ( currentUser.email === user.email ) {
            errors.push({
                type: 'self-invite',
                log: `User cannot invite themselves.`,
                message: `You may not invite yourself.`,
                context: {
                    email: user.email
                }
            })
            return [ null, errors ]
        }

        // We only want to kick them out here if they are banned.  If they are confirmed, then 
        // we want to create a friend request below.
        let existingUser = await this.userDAO.getUserByEmail(user.email, 'all') 
        if ( existingUser && existingUser.status === 'banned' ) {
            errors.push({
                type: 'banned',
                log: `User may not re-invite a banned user.`,
                message: `You may not invite a banned user.`,
                context: {
                    email: user.email
                }
            })
            return [ null, errors ]
        }  

        // Only check the domain block for new invitations.  Existing
        // invitations may be re-invited.  They're grandfathered in (for now).
        if ( existingUser === null ) {
            // Check the email's domain in the domain blocklist.
            const domain = user.email.substring(user.email.indexOf('@')+1)

            const blocklistResults = await this.core.database.query(`
                SELECT id FROM blocklist WHERE domain = $1
            `, [ domain ])

            if ( blocklistResults.rows.length > 0 ) {
                errors.push({
                    type: 'blocked-domain',
                    log: `User may not register with an email from '${domain}'.`,
                    message: `You may not register with an email from '${domain}'.  That domain has been blocked.`,
                    context: {
                        email: user.email
                    }
                })
                return [ null, errors ]
            }
        }

        let type = null
        if ( ! existingUser ) {
            type = 'invitation'
        } else if ( existingUser ) {
            type = 'reinvitation'
        }

        // ================== Validation ======================================
        // Validate the `user` entity, based on the type, to ensure  we have a
        // valid user.
        
        const validationErrors = await this.validationService.validateUser(user, existingUser, type)
        if ( validationErrors.length > 0 ) {
            errors.push(...validationErrors)
            return [ null, errors ]
        }

        if ( type === 'reinvitation' ) {
            // If they are in an 'invited' state, meaning they've been invited,
            // but haven't accepted yet, send them a new invitation.
            if ( existingUser.status === 'invited' ) {
                const token = this.tokenDAO.createToken('invitation')
                token.userId = existingUser.id
                token.creatorId = currentUser.id
                token.id = await this.tokenDAO.insertToken(token)

                await this.emailService.sendInvitation(currentUser, existingUser, token)
            } 

            // If we haven't already added them as a friend, send them a friend
            // request.
            let existingRelationship = await this.userRelationshipsDAO.getUserRelationshipByUserAndRelation(currentUser.id, existingUser.id)

            if ( existingRelationship !== null && existingUser.status == 'confirmed' ) {
                errors.push({
                    type: 'duplicate',
                    log: `User already confirmed and friended.`,
                    message: `'${user.email}' has already registered and ${ existingRelationship.status === 'confirmed' ? 'you are already friends' : 'you have a pending request' }.`,
                    context: {
                        email: user.email
                    }
                })
                return [ existingUser, errors ]
            }

            if ( ! existingRelationship ) {
                await this.userRelationshipsDAO.insertUserRelationships({ 
                    userId: currentUser.id,
                    relationId: existingUser.id,
                    status: "pending"
                })

                await this.notificationService.sendNotifications(
                    currentUser, 
                    'UserRelationship:create',
                    {
                        userId: currentUser.id,
                        relationId:existingUser.id 
                    },
                    { noEmail: existingUser.status === 'invited' }
                )
            } 

            return [ existingUser, errors ]

        } else if ( type === 'invitation' ) {
            // ================== Invitation ========================================
            // We've validated the user.  Go ahead and invite them.
            //
           
            // Set their status here now that we've passed validation.
            user.status = 'invited'

            await this.userDAO.insertUsers(user)

            const createdUser = await this.userDAO.getUserByEmail(user.email, [ 'email', 'status' ])
            if ( createdUser === null ) {
                throw new ServiceError('server-error', `No user found after insertion. Looking for user with email: "${user.email}".`)
            }

            const token = this.tokenDAO.createToken('invitation')
            token.userId = createdUser.id
            token.creatorId = currentUser.id
            token.id = await this.tokenDAO.insertToken(token)

            await this.emailService.sendInvitation(currentUser, createdUser, token)

            // Since the user exists, go ahead and insert the friend
            // relationship.
            await this.userRelationshipsDAO.insertUserRelationships({ 
                userId: currentUser.id,
                relationId: createdUser.id,
                status: "pending"
            })

            await this.notificationService.sendNotifications(
                currentUser, 
                'UserRelationship:create',
                {
                    userId: currentUser.id,
                    relationId:createdUser.id 
                },
                { noEmail: true }
            )

            return [ createdUser, errors]
        }

        throw ServiceError('invalid-state', `We should not be able to reach the end of the inviteUser() function.`)
    }

    async registerUser(user) {
        const errors = []

        if ( ! ( 'email' in user) ) {
            errors.push({
                type: 'missing-email',
                log: `User cannot be registered without an email.`,
                message: `You cannot register without an email.`
            })
            return [ null, errors ]
        }

        user.email = user.email.toLowerCase().trim()

        let existingUser = await this.userDAO.getUserByEmail(user.email, 'all')
        if ( existingUser && existingUser.status === 'banned' ) {
            errors.push({
                type: 'banned',
                log: `User may not re-register a banned user.`,
                message: `You are banned.`,
                context: {
                    email: user.email
                }
            })
            return [ null, errors ]
        }

        if ( existingUser === null ) {
            // Check the email's domain in the domain blocklist.
            const domain = user.email.substring(user.email.indexOf('@')+1)

            const blocklistResults = await this.core.database.query(`
                SELECT id FROM blocklist WHERE domain = $1
            `, [ domain ])

            if ( blocklistResults.rows.length > 0 ) {
                errors.push({
                    type: 'blocked-domain',
                    log: `User may not register with an email from '${domain}'.`,
                    message: `You may not register with an email from '${domain}'.  That domain has been blocked.`,
                    context: {
                        email: user.email
                    }
                })
                return [ null, errors ]
            }
        }

        let type = null
        if ( ! existingUser ) {
            type = 'registration'
        } else if ( existingUser ) {
            if ( existingUser.status === 'invited' ) {
                type = 'invitation-overwrite'
                user.id = existingUser.id
            } else {
                errors.push({
                    type: 'conflict',
                    log: `User is already registered with that email.`,
                    message: `A User is already registered with that email.  Please log in.`,
                    context: {
                        email: user.email
                    }
                })
                return [ null, errors ]
            }
        }

        // ================== Validation ======================================
        // Validate the `user` entity, based on the type, to ensure  we have a
        // valid user.
        
        const validationErrors = await this.validationService.validateUser(user, existingUser, type)
        if ( validationErrors.length > 0 ) {
            errors.push(...validationErrors)
            return [ null, errors ]
        }

        // ================== Register ========================================
        // We've validated the user.  Go ahead and register them.

        user.status = 'unconfirmed'

        // By the time we get here, we've validated that the password exists.
        user.password = this.auth.hashPassword(user.password)

        if ( type === 'invitation-overwrite' ) {
            await this.userDAO.updateUser(user)
        } else {
            await this.userDAO.insertUsers(user)
        }

        const createdUser = await this.userDAO.getUserByEmail(user.email, [ 'email', 'status' ])
        if ( createdUser === null ) {
            throw new ServiceError('server-error', `No user found.  Email: ${user.email}.`)
        }

        const token = this.tokenDAO.createToken('email-confirmation')
        token.userId = createdUser.id
        token.creatorId = createdUser.id
        token.id = await this.tokenDAO.insertToken(token)

        await this.emailService.sendEmailConfirmation(createdUser, token)

        return [ createdUser, errors ]
    }
}
