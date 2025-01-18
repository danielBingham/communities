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

const { UserRelationshipDAO, NotificationService } = require('@communities/backend')

const ControllerError = require('../errors/ControllerError')

module.exports = class FriendController {

    constructor(core) {
        this.core = core

        this.userRelationshipDAO = new UserRelationshipDAO(core)

        this.notificationService = new NotificationService(core)
    }

    async getRelations(results, requestedRelations) { 
        return {}
    }

    async createQuery(request) {}

    async postFriends(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User attempting to submit friend request is not authenticated.`,
                `You may not submit a friend request without authenticating.`)
        }

        const userId = request.params.userId
        const friendId = request.body.friendId

        if ( currentUser.id !== userId ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to submit friend request on behalf of User(${userId}). Denied.`,
                `You may not submit a friend request for another user.`)
        }

        const existingResults = await this.userRelationshipDAO.selectUserRelationships({
            where: `(user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
            params: [ userId, friendId]
        })
        
        const existing = existingResults.list.length > 0 ? existingResults[existingResults.list[0]] : null

        // If User(friendId) already sent User(userId) their own friend
        // request, then just confirm that relationship.
        if ( existing !== null && existing.userId == friendId) {
            const userRelationship = {
                userId: friendId,
                friendId: userId,
                status: 'confirmed'
            }

            await this.userRelationshipDAO.updateUserRelationship(userRelationship)

            const results = this.userRelationshipDAO.selectUserRelationships({
                where: `user_id = $1 AND friend_id = $2`,
                params: [ userId, friendId ]
            })

            const entity = results.dictionary[results.list[0]]

            if ( ! entity ) {
                throw new ControllerError(500, 'server-error',
                    `UserRelationship(${userId}, ${friendId}) missing after update.`,
                    `We confirmed the relationship between you and ${friendId}, but it wasn't there when we queried it. Please report bug.`)
            }

            await this.notificationService.sendNotifications(
                currentUser, 
                'User:friend:update',
                {
                    userId: entity.userId,
                    friendId: entity.friendId 
                }
            )

            const relations = await this.getRelations()

            response.status(200).json({
                entity: entity,
                relations: relations
            })
        } else if ( existing !== null && existing.userId == userId ) {
            throw new ControllerError(400, 'request-exists',
                `User(${userId}) already sent User(${friendId}) a friend request.`,
                `You already sent User(${friendId}) a friend request.`)
        } else {
            const userRelationship = {
                userId: userId,
                friendId: friendId,
                status: 'pending'
            }

            await this.userRelationshipDAO.insertUserRelationships(userRelationship)

            const results = this.userRelationshipDAO.selectUserRelationships({
                where: `user_id = $1 AND friend_id = $2`,
                params: [ userId, friendId ]
            })

            const entity = results.dictionary[results.list[0]]

            if ( ! entity ) {
                throw new ControllerError(500, 'server-error',
                    `UserRelationship(${userId}, ${friendId}) missing after insert.`,
                    `We created the relationship between you and ${friendId}, but it wasn't there when we queried it. Please report bug.`)
            }
           
            await this.notificationService.sendNotifications(
                currentUser, 
                'User:friend:create',
                {
                    userId: userId,
                    friendId: friendId
                }
            )

            const relations = await this.getRelations(results)

            response.status(200).json({
                entity: entity,
                relations: relations
            })
        }
    }

    /**
     * PATCH /user/:userId/friend/:friendId
     *
     * Update a relationship between :userId and :friendId where :userId is the
     * user who requested the relationship and :friendId is the user who must
     * confirm it. Since we currently only use this endpoint to confirm
     * relationships, `currentUser` must be the same user as :friendId.
     */
    async patchFriend(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User attempting to accept friend request is not authenticated.`,
                `You may not accept a friend request without authenticating.`)
        }

        const userId = request.params.userId
        const friendId = request.params.friendId

        if ( currentUser.id !== friendId ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to accept friend request on behalf of User(${friendId}). Denied.`,
                `You may not accept a friend request for another user.`)
        }

        if ( request.body.status !== 'confirmed' ) {
            throw new ControllerError(400, 'invalid',
                `User(${currentUser.id}) provided wrong status when confirming friend request.`,
                `You may only provide 'confirmed' as status to PATCH.  If you want to reject the request, use DELETE.`)
        }

        const existingResults = await this.userRelationshipDAO.selectUserRelationships({
            where: `(user_id = $1 AND friend_id = $2))`,
            params: [ userId, friendId]
        })

        if ( existingResults.list.length <= 0 ) {
            throw new ControllerError(404, 'not-found',
                `No relationship exists between User(${userId}) and User(${friendId}).`,
                `No relationship exists between those users.  Please create a relationship first using POST.`)
        }

        const existing = existingResults.dictionary[existingResults.list[0]]

        if ( existing.status != 'pending' ) {
            throw new ControllerError(400, 'invalid',
                `User(${friendId}) attempting to confirm a relationship with User(${userId}) that is in status: ${existing.status}.`,
                `You can only confirm a pending relationship.`)
        }

        const userRelationship = {
            userId: userId,
            friendId: friendId,
            status: request.body.status 
        }

        await this.userRelationshipDAO.updateUserRelationship(userRelationship)

        const results = this.userRelationshipDAO.selectUserRelationships({
            where: `user_id = $1 AND friend_id = $2`,
            params: [ userId, friendId ]
        })
        const entity = results.dictionary[results.list[0]]

        if ( ! entity ) {
            throw new ControllerError(500, 'server-error',
                `UserRelationship(${userId}, ${friendId}) missing after insert.`,
                `We created the relationship between you and ${friendId}, but it wasn't there when we queried it. Please report bug.`)
        }

        await this.notificationService.sendNotifications(
            currentUser, 
            'User:friend:update',
            {
                userId: entity.userId,
                friendId: entity.friendId
            }
        )

        const relations = await this.getRelations(results)

        response.status(200).json({
            entity: entity,
            relations: relations
        })
    }

    async deleteFriend(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User attempting to remove friend is not authenticated.`,
                `You may not accept a friend request without authenticating.`)
        }

        const userId = request.params.userId
        const friendId = request.params.friendId

        if ( currentUser.id !== userId && currentUser.id !== friendId ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to delete relationship for User(${userId}) and User(${friendId}). Denied.`,
                `You may not delete other user's friends.`)
        }

        const existingResults = await this.userRelationshipDAO.selectUserRelationships({
            where: `(user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
            params: [ userId, friendId]
        })

        if ( existingResults.list.length <= 0 ) {
            throw new ControllerError(400, 'invalid',
                `No relationship exists between User(${userId}) and User(${friendId}).`,
                `No relationship exists between those users. Nothing to delete.`)
        }

        const existing = existingResults.dictionary[existingResults.list[0]]

        await this.userDAO.deleteUserRelationship(existing)

        const relations = await this.getRelations(existingResults)

        response.status(200).json({
            entity: entity,
            relations: relations
        })
    }

}
