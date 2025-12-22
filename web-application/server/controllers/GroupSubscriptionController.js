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

const Uuid = require('uuid')

const {
    GroupDAO, 
    GroupMemberDAO,
    GroupSubscriptionDAO, 
    UserRelationshipDAO,

    PermissionService,
    ValidationService
} = require('@communities/backend')

const { schema } = require('@communities/shared')

const ControllerError = require('../errors/ControllerError')

module.exports = class GroupSubscriptionController {

    constructor(core) {
        this.core = core

        this.groupDAO = new GroupDAO(core)
        this.groupMemberDAO = new GroupMemberDAO(core)
        this.groupSubscriptionDAO = new GroupSubscriptionDAO(core)

        this.permissionService = new PermissionService(core)
        this.validationService = new ValidationService(core)

        this.schema = new schema.GroupSubscriptionSchema()
    }

    async getRelations(results, requestedRelations) { 
        return {}
    }

    async createQuery(request) { }

    async getGroupSubscriptions(request, response) { 
        throw new ControllerError(503, 'not-implemented',
            `User attempted to GET /group/:groupId/subscriptions which isn't implemented.`,
            `GET /group/:groupId/subscriptions is not implemented.`)
    }

    async postGroupSubscriptions(request, response) {
        throw new ControllerError(503, 'not-implemented',
            `User attempted to POST /group/:groupId/subscriptions which isn't implemented.`,
            `POST /group/:groupId/subscriptions is not implemented.`)
    }

    async getGroupSubscription(request, response) { 
        const currentUser = request.session.user
        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to subscribe to a group.`,
                `You must be authenticated to subscribe to a group.`)
        }

        const groupId = this.schema.properties.groupId.clean(request.params.groupId)
        const groupIdValidationErrors = this.schema.properties.groupId.validate(groupId)
        if ( groupIdValidationErrors.length > 0 ) {
            const errorString = validationErrors.reduce((string, error) => `${string}\n${error.message}`, '')
            const logString = validationErrors.reduce((string, error) => `${string}\n${error.log}`, '')
            throw new ControllerError(400, 'invalid',
                `Invalid groupId used used for GroupSubscription.getGroupSubscriptions: ${logString}`,
                errorString)
        }

        const canViewGroup = await this.permissionService.can(currentUser, 'view', 'Group', { groupId: groupId })
        if ( canViewGroup !== true ) {

            // If they've lost the ability to view the group, then unsubscribe them.
            await this.groupSubscriptionDAO.deleteGroupSubscription({ userId: currentUser.id, groupId: groupId })

            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempted to retrieve a subscription that doesn't exist.`,
                `That group either doesn't exist or you don't have permission to view it.`)
        }

        const entityResults = await this.groupSubscriptionDAO.selectGroupSubscriptions({
            where: 'group_subscriptions.user_id = $1 AND group_subscriptions.group_id = $2',
            params: [ currentUser.id, groupId ]
        })

        if ( entityResults.list.length <= 0 ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempted to retrieve a subscription that doesn't exist.`,
                `Either that GroupSubscription doesn't exist or you don't have permission to view it.`)
        }

        const entity = entityResults.dictionary[entityResults.list[0]]

        const relations = await this.getRelations(entityResults)

        response.status(200).json({
            entity: entity,
            relations: relations
        })
    }

    async patchGroupSubscription(request, response) {
        const currentUser = request.session.user
        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to subscribe to a group.`,
                `You must be authenticated to subscribe to a group.`)
        }

        const groupId = this.schema.properties.groupId.clean(request.params.groupId)
        const groupIdValidationErrors = this.schema.properties.groupId.validate(groupId)
        if ( groupIdValidationErrors.length > 0 ) {
            const errorString = validationErrors.reduce((string, error) => `${string}\n${error.message}`, '')
            const logString = validationErrors.reduce((string, error) => `${string}\n${error.log}`, '')
            throw new ControllerError(400, 'invalid',
                `Invalid groupId used used for GroupSubscription.patchGroupSubscriptions: ${logString}`,
                errorString)
        }

        const group = await this.groupDAO.getGroupById(groupId)
        const userMember = await this.groupMemberDAO.getGroupMemberByGroupAndUser(groupId, currentUser.id)

        const canViewGroup = await this.permissionService.can(currentUser, 'view', 'Group', { group: group, userMember: userMember })
        if ( canViewGroup !== true ) {

            // If they've lost the ability to view the group, then unsubscribe them.
            await this.groupSubscriptionDAO.deleteGroupSubscription({ userId: currentUser.id, groupId: groupId })

            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempted to retrieve a subscription that doesn't exist.`,
                `That group either doesn't exist or you don't have permission to view it.`)
        }

        const canViewGroupPost = await this.permissionService.can(currentUser, 'view', 'GroupPost', { group: group, userMember: userMember })
        if ( canViewGroupPost !== true ) {
            // If they've lost the ability to view the group, then unsubscribe them.
            await this.groupSubscriptionDAO.deleteGroupSubscription({ userId: currentUser.id, groupId: groupId })

            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempted to retrieve a subscription that doesn't exist.`,
                `That group either doesn't exist or you don't have permission to view it.`)
        }

        let existing = await this.groupSubscriptionDAO.getGroupSubscriptionByGroupAndUser(groupId, currentUser.id)
        if ( existing === null ) {
            // If they are a confirmed member of the group then they should have a subscription.
            if ( userMember !== null && userMember !== undefined && userMember.status === 'member' ) {
                await this.groupSubscriptionDAO.insertGroupSubscription({
                    userId: currentUser.id,
                    groupId: groupId
                })

                existing = await this.groupSubscriptionDAO.getGroupSubscriptionByGroupAndUser(groupId, currentUser.id)
                if ( existing === null ) {
                    throw new ControllerError(500, 'server-error',
                        `GroupSubscription doesn't exist after creation.  Something is wrong.`,
                        `Something went wrong on the backend in a way we haven't handled.  Please report a bug.`)
                }
            } else {
                // Otherwise, 404.
                throw new ControllerError(404, 'not-found',
                    `User(${currentUser.id}) attempted to retrieve a subscription that doesn't exist.`,
                    `You are not subscribed to that group you don't have permission to view it.`)
            }
        }

        const subscription = this.schema.clean(request.body)
        if ( subscription === null || subscription === undefined ) {
            throw new ControllerError(400, 'invalid', 
                `User(${currentUser.id}) provided an empty patch for GroupSubscription.`,
                `You must provide a body to PATCH a subscription.`)
        }

        if ( ! ( 'id' in subscription ) ) {
            subscription.id = existing.id
        }

        const validationErrors = this.validationService.validateGroupSubscription(currentUser, subscription, existing)
        if ( validationErrors.length > 0 ) {
            const errorString = validationErrors.reduce((string, error) => `${string}\n${error.message}`, '')
            const logString = validationErrors.reduce((string, error) => `${string}\n${error.log}`, '')
            throw new ControllerError(400, 'invalid',
                `Invalid subscription used used for GroupSubscription.patchGroupSubscriptions: ${logString}`,
                errorString)
        }

        await this.groupSubscriptionDAO.updateGroupSubscription(subscription)

        const entityResults = await this.groupSubscriptionDAO.selectGroupSubscriptions({
            where: 'group_subscriptions.user_id = $1 AND group_subscriptions.group_id = $2',
            params: [ currentUser.id, groupId ]
        })

        if ( entityResults.list.length <= 0 ) {
            throw new ControllerError(500, 'server-error',
                `GroupSubscription(${groupId}, ${currentUser.id}) doesn't exist after update.`,
                `We encountered a problem on the backend we weren't able to recover from.  Please report this as a bug!`)
        }

        const entity = entityResults.dictionary[entityResults.list[0]]

        const relations = await this.getRelations(entityResults)

        response.status(200).json({
            entity: entity,
            relations: relations
        })
    }

    async deleteGroupSubscription(request, response) {
        throw new ControllerError(503, 'not-implemented',
            `User attempted to DELETE a GroupSubscription, which isn't implemented.`,
            `DELETE is not implemented for GroupSubscription.`)
    }

}
