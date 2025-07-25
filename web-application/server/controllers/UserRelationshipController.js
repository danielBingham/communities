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
    UserRelationshipDAO, 
    UserDAO, 

    NotificationService,
    PermissionService,
    ValidationService
} = require('@communities/backend')

const ControllerError = require('../errors/ControllerError')

module.exports = class UserRelationshipController {

    constructor(core) {
        this.core = core

        this.userRelationshipDAO = new UserRelationshipDAO(core)
        this.userDAO = new UserDAO(core)

        this.notificationService = new NotificationService(core)
        this.permissionService = new PermissionService(core)
        this.validationService = new ValidationService(core)
    }

    async getRelations(currentUser, userId, results, requestedRelations) { 
        const userIdDictionary = {} 
        for(const id of results.list) {
            const relationship = results.dictionary[id]
            userIdDictionary[relationship.userId] = true
            userIdDictionary[relationship.relationId] = true
        }

        const userIds = Object.keys(userIdDictionary)

        const userResults = await this.userDAO.selectUsers({ where: `users.id = ANY($1::uuid[])`, params: [ userIds ] })

        const invitations = await this.core.database.query(`
            SELECT user_id FROM tokens WHERE creator_id = $1
        `, [ userId ])

        const invitedUserIds = invitations.rows.map((row) => row.user_id)

        const invitationResults = await this.userDAO.selectUsers({ where: `users.id = ANY($1::uuid[])`, params: [ invitedUserIds ], fields: [ 'email' ] })

        return {
            users: { ...userResults.dictionary, ...invitationResults.dictionary }
        }
    }

    async createQuery(currentUser, userId, requestQuery) {
        const query = {
            where: '',
            params: [],
            page: 1,
            order: '',
            requestedRelations: requestQuery.relations ? requestQuery.relations : {}
        }

        // Only return those relationships where the user has confirmed.
/*        const confirmedUserResults = await this.core.database.query(`
            SELECT user_relationships.id FROM user_relationships
                LEFT OUTER JOIN users ON user_relationships.user_id = users.id
                LEFT OUTER JOIN users relation ON user_relationships.friend_id = relation.id
            WHERE users.status = 'confirmed' AND relation.status = 'confirmed' 
                AND (user_relationships.user_id = $1 OR user_relationships.friend_id = $1)
        `, [ userId ])

        query.params.push(confirmedUserResults.rows.map((r) => r.id))
        query.where += `user_relationships.id = ANY($${query.params.length}::uuid[])`*/

        query.params.push(userId)
        query.where += `(user_relationships.user_id = $1 OR user_relationships.friend_id = $1)`

        if ( requestQuery.status ) {
            query.params.push(requestQuery.status)
            query.where += ` AND user_relationships.status = $${query.params.length}`
        }

        if ( 'page' in requestQuery ) {
            query.page = parseInt(requestQuery.page)
        }

        return query
    }

    /**
     * GET /user/:userId/relationships
     *
     * Get the relationships for :userId.  
     */
    async getUserRelationships(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User is attempting to query relationships while not authenticated.`,
                `You must be authenticated to query relationships.`)
        }

        const userId = request.params.userId

        if ( currentUser.id !== userId ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to query relationships for User(${userId}). Denied.`,
                `You may not query the relationships of another user.`)
        }

        const query = await this.createQuery(currentUser, userId, request.query)

        const results = await this.userRelationshipDAO.selectUserRelationships(query)

        const meta = await this.userRelationshipDAO.getUserRelationshipPageMeta(query)

        const relations = await this.getRelations(currentUser, userId, results, query.requestedRelations)


        response.status(200).json({
            dictionary: results.dictionary,
            list: results.list,
            meta: meta,
            relations: relations
        })
    }

    /**
     * POST /user/:userId/relationship/:relationId
     *
     * Create a new relationship between :userId and :relationId, with :userId as
     * the requester and :relationId as the acceptor.
     */
    async postUserRelationships(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User attempting to submit friend request is not authenticated.`,
                `You may not submit a friend request without authenticating.`)
        }

        const userId = request.params.userId
        const relationId = request.body.relationId

        const canCreateUserRelationship = await this.permissionService.can(currentUser, 'create', 'UserRelationship', 
            { userId: userId, relationId: relationId })
        if ( canCreateUserRelationship !== true ) {
            throw new ControllerError(403, 'not-authorized',
                `User attempting to create a friend request on behalf of User(${userId}) without authorization.`,
                `You are not authorized to create friend requests for that User.`)
        }

        const existingResults = await this.userRelationshipDAO.selectUserRelationships({
            where: `(user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
            params: [ userId, relationId]
        })
      
        const existing = existingResults.list.length > 0 ? existingResults.dictionary[existingResults.list[0]] : null

        // If User(relationId) already sent User(userId) their own friend
        // request, then just confirm that relationship.
        if ( existing !== null && existing.userId == relationId) {
            const userRelationship = {
                id: existing.id,
                userId: relationId,
                relationId: userId,
                status: 'confirmed'
            }

            const validationErrors = await this.validationService.validateUserRelationship(currentUser, userRelationship, existing)
            if ( validationErrors.length > 0 ) {
                const errorString = validationErrors.reduce((string, error) => `${string}\n${error.message}`, '')
                const logString = validationErrors.reduce((string, error) => `${string}\n${error.log}`, '')
                throw new ControllerError(400, 'invalid',
                    `User submitted an invalid UserRelationship: ${logString}`,
                    errorString)
            }

            await this.userRelationshipDAO.updateUserRelationship(userRelationship)

            const results = await this.userRelationshipDAO.selectUserRelationships({
                where: `user_id = $1 AND friend_id = $2`,
                params: [ existing.userId, existing.relationId ]
            })

            if ( results.list.length <= 0 ) {
                throw new ControllerError(500, 'server-error',
                    `UserRelationship(${existing.id}) between User(${userId}) and User(${relationId}) missing after update.`,
                    `We couldn't find the friend relationship after updating it.  Please report this as a bug!`)
            }

            const entity = results.dictionary[results.list[0]]

            if ( ! entity ) {
                throw new ControllerError(500, 'server-error',
                    `UserRelationship(${userId}, ${relationId}) missing after update.`,
                    `We confirmed the relationship between you and ${relationId}, but it wasn't there when we queried it. Please report bug.`)
            }

            await this.notificationService.sendNotifications(
                currentUser, 
                'User:friend:update',
                {
                    userId: entity.userId,
                    relationId: entity.relationId 
                }
            )

            const relations = await this.getRelations(currentUser, userId, results)

            response.status(200).json({
                entity: entity,
                relations: relations
            })
        } else if ( existing !== null && existing.userId == userId ) {
            throw new ControllerError(400, 'request-exists',
                `User(${userId}) already sent User(${relationId}) a friend request.`,
                `You already sent User(${relationId}) a friend request.`)
        } else {
            const userRelationship = {
                userId: userId,
                relationId: relationId,
                status: 'pending'
            }

            const validationErrors = await this.validationService.validateUserRelationship(currentUser, userRelationship)
            if ( validationErrors.length > 0 ) {
                const errorString = validationErrors.reduce((string, error) => `${string}\n${error.message}`, '')
                const logString = validationErrors.reduce((string, error) => `${string}\n${error.log}`, '')
                throw new ControllerError(400, 'invalid',
                    `User submitted an invalid UserRelationship: ${logString}`,
                    errorString)
            }

            await this.userRelationshipDAO.insertUserRelationships(userRelationship)

            const results = await this.userRelationshipDAO.selectUserRelationships({
                where: `user_id = $1 AND friend_id = $2`,
                params: [ userId, relationId ]
            })

            const entity = results.dictionary[results.list[0]]

            if ( ! entity ) {
                throw new ControllerError(500, 'server-error',
                    `UserRelationship(${userId}, ${relationId}) missing after insert.`,
                    `We created the relationship between you and ${relationId}, but it wasn't there when we queried it. Please report bug.`)
            }
           
            await this.notificationService.sendNotifications(
                currentUser, 
                'User:friend:create',
                {
                    userId: userId,
                    relationId: relationId
                }
            )

            const relations = await this.getRelations(currentUser, userId, results)

            response.status(200).json({
                entity: entity,
                relations: relations
            })
        }
    }

    /**
     * GET /user/:userId/relationship/:relationId
     */
    async getUserRelationship(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User is attempting to query relationships while not authenticated.`,
                `You must be authenticated to query relationships.`)
        }

        const userId = request.params.userId
        const relationId = request.params.relationId

        const canViewUserRelationship = await this.permissionService.can(currentUser, 'view', 'UserRelationship', { userId: userId, relationId: relationId })
        if ( canViewUserRelationship !== true ) {
            throw new ControllerError(404, 'not-found',
                `User attempting to view relationship for User(${userId}) and User(${relationId}) without authorization.`,
                `Either that UserRelationship doesn't exist or you don't have permission to view it.`)
        }

        const results = await this.userRelationshipDAO.selectUserRelationships({
            where: `(user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
            params: [ userId, relationId ]
        })

        if ( results.list.length <= 0 ) {
            throw new ControllerError(404, 'not-found',
                `No relationship found for User(${userId}) and User(${relationId}).`,
                `No relationship found for User(${userId}) and User(${relationId}).`)
        }

        const entity = results.dictionary[results.list[0]]

        const relations = await this.getRelations(currentUser, userId, results)

        response.status(200).json({
            entity: entity,
            relations: relations
        })
    }

    /**
     * PATCH /user/:userId/relationship/:relationId
     *
     * Update a relationship between :userId and :relationId where :userId is the
     * user who requested the relationship and :relationId is the user who must
     * confirm it. Since we currently only use this endpoint to confirm
     * relationships, `currentUser` must be the same user as :relationId.
     */
    async patchUserRelationship(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User attempting to accept friend request is not authenticated.`,
                `You may not accept a friend request without authenticating.`)
        }

        const userId = request.params.userId
        const relationId = request.params.relationId

        const canUpdateUserRelationship = await this.permissionService.can(currentUser, 'update', 'UserRelationship', { userId: userId, relationId: relationId })
        if ( canUpdateUserRelationship !== true ) {
            throw new ControllerError(403, 'not-authorized',
                `User attempting to update UserRelationship(${userId}, ${relationId}) without authorization.`,
                `You are not authorized to update that UserRelationship.`)
        }

        const existing = await this.userRelationshipDAO.getUserRelationshipByUserAndRelation(userId, relationId)
        if ( existing === null) {
            throw new ControllerError(404, 'not-found',
                `No relationship exists between User(${userId}) and User(${relationId}).`,
                `No relationship exists between those users.  Please create a relationship first using POST.`)
        }

        const userRelationship = {
            id: existing.id,
            userId: userId,
            relationId: relationId,
            status: request.body.status 
        }

        const validationErrors = await this.validationService.validateUserRelationship(currentUser, userRelationship, existing)
        if ( validationErrors.length > 0 ) {
            const errorString = validationErrors.reduce((string, error) => `${string}\n${error.message}`, '')
            const logString = validationErrors.reduce((string, error) => `${string}\n${error.log}`, '')
            throw new ControllerError(400, 'invalid',
                `User submitted an invalid UserRelationship: ${logString}`,
                errorString)
        }

        await this.userRelationshipDAO.updateUserRelationship(userRelationship)

        const results = await this.userRelationshipDAO.selectUserRelationships({
            where: `user_id = $1 AND friend_id = $2`,
            params: [ userId, relationId ]
        })

        const entity = results.dictionary[results.list[0]]

        if ( ! entity ) {
            throw new ControllerError(500, 'server-error',
                `UserRelationship(${userId}, ${relationId}) missing after insert.`,
                `We created the relationship between you and ${relationId}, but it wasn't there when we queried it. Please report bug.`)
        }

        await this.notificationService.sendNotifications(
            currentUser, 
            'User:friend:update',
            {
                userId: entity.userId,
                relationId: entity.relationId
            }
        )

        const relations = await this.getRelations(currentUser, userId, results)

        response.status(200).json({
            entity: entity,
            relations: relations
        })
    }

    async deleteUserRelationship(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User attempting to remove friend is not authenticated.`,
                `You may not accept a friend request without authenticating.`)
        }

        const userId = request.params.userId
        const relationId = request.params.relationId

        const canDeleteUserRelationship = await this.permissionService.can(currentUser, 'delete', 'UserRelationship', 
            { userId: userId, relationId: relationId})
        if ( canDeleteUserRelationship !== true ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to delete relationship for User(${userId}) and User(${relationId}). Denied.`,
                `You are not authorized to delete that UserRelationship.`)
        }

        const existingResults = await this.userRelationshipDAO.selectUserRelationships({
            where: `(user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
            params: [ userId, relationId]
        })

        if ( existingResults.list.length <= 0 ) {
            throw new ControllerError(404, 'not-found',
                `No relationship exists between User(${userId}) and User(${relationId}).`,
                `No relationship exists between those users. Nothing to delete.`)
        }

        const existing = existingResults.dictionary[existingResults.list[0]]

        await this.userRelationshipDAO.deleteUserRelationship(existing)

        const relations = await this.getRelations(currentUser, userId, existingResults)

        response.status(200).json({
            entity: existing,
            relations: relations
        })
    }

}
