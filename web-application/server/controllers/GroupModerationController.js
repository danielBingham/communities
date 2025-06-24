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
    ValidationService,
    PermissionService,
    NotificationService,
    GroupModerationDAO, 
    GroupModerationEventDAO
}  = require('@communities/backend')

const { cleaning, validation } = require('@communities/shared')

const BaseController = require('./BaseController')
const ControllerError = require('../../errors/ControllerError')

module.exports = class GroupModerationController extends BaseController {

    constructor(core) {
        super(core)

        this.groupModerationDAO = new GroupModerationDAO(core)
        this.groupModerationEventDAO = new GroupModerationEventDAO(core)

        this.notificationService = new NotificationService(core)
        this.permissionService = new PermissionService(core)
        this.validationService = new ValidationService(core)
    }

    async getRelations(currentUser, results, requestedRelations) {
        return {} 
    }

    async createQuery(request) {
        const query = {
            where: '',
            params: [],
            page: 1,
            order: 'group_moderation.created_date ASC',
            relations: []
        }

        if ( 'status' in request.query && request.query.status !== undefined && request.query.status !== null ) {
            const and = query.params.length > 0 ? ' AND ' : ''
            query.params.push(request.query.status)
            query.where += `${and} group_moderation.status = $${query.params.length}`
        }

        if ( 'postId' in request.query && request.query.postId !== undefined && request.query.postId !== null ) {
            const and = query.params.length > 0 ? ' AND ' : ''
            query.params.push(request.query.postId)
            query.where +=  `${and} group_moderation.post_id = $${query.params.length}`

        }

        if ( 'postCommentId' in request.query && request.query.postCommentId !== undefined && request.query.postCommentId !== null ) {
            const and = query.params.length > 0 ? ' AND ' : ''
            query.params.push(request.query.postCommentId)
            query.where += `${and} group_moderation.post_comment_id = $${query.params.length}`
        }

        if ( 'relations' in request.query && Array.isArray(request.query.relations)) {
            query.relations = [ ...request.query.relations]
        }

        return query
    }

    async getGroupModerations(request, response) {
        const currentUser = request.session.user
        if ( ! currentUser ) {
            this.sendUserErrors(response, 401, {
                type: 'not-authenticated',
                log: `User must be authenticated.`,
                message: `You must be authenticated.`
            })
            return
        }

        const groupId = cleaning.GroupModeration.cleanGroupId(request.params.groupId)
        const groupIdValidationErrors = validation.GroupModeration.validateGroupId(groupId)
        if ( groupIdValidationErrors.length > 0 ) {
            this.sendUserErrors(response, 400, groupValidationErrors)
            return
        }

        const canModerateGroup = await this.permissionService.can(currentUser, 'moderate', 'Group', { groupId: groupId })
        if ( canModerateGroup !== true ) {
            this.sendUserErrors(response, 403, {
                type: 'not-authorized',
                log: `User not authorized to moderate Group(${groupId}).`,
                message: `You are not authorized to moderate that Group.`
            })
            return
        }

        const query = await this.createQuery(request)
        const results = await this.groupModerationDAO.selectGroupModerations(query)
        const meta = await this.groupModerationDAO.getGroupModerationPageMeta(query)
        const relations = await this.getRelations(currentUser, results, query.relations)

        response.status(200).json({ 
            dictionary: results.dictionary,
            list: results.list,
            meta: meta,
            relations: relations
        })
    }

    async postGroupModerations(request, response) {
        const currentUser = request.session.user
        if ( ! currentUser ) {
            return this.sendUserErrors(response, 401, {
                type: 'not-authenticated',
                log: `User must be authenticated.`,
                message: `You must be authenticated.`
            })
        }

        const groupId = cleaning.GroupModeration.cleanGroupId(request.params.groupId)
        const groupIdValidationErrors = validation.GroupModeration.validateGroupId(groupId)
        if ( groupIdValidationErrors.length > 0 ) {
            return this.sendUserErrors(response, 400, groupValidationErrors)
        }

        const groupModeration = cleaning.GroupModeration.clean(request.body)
        if ( groupModeration.groupId !== groupId ) {
            return this.sendUserErrors(response, 400, {
                type: 'groupId:invalid',
                log: `groupId in the route must match groupId in the body.`,
                message: `groupId in the route must match groupId in the body.`
            })
        }

        const validationErrors = await this.validationService.validateGroupModeration(currentUser, groupModeration)
        if ( validationErrors.length > 0 ) {
            return this.sendUserErrors(response, 400, validationErrors)
        }

        let existing = null
        if ( groupModeration.postId && ! groupModeration.postCommentId) {
            existing = await this.groupModerationDAO.getGroupModerationByPostId(groupModeration.postId)
        } else if ( groupModeration.postCommentId ) {
            existing = await this.groupModerationDAO.getGroupModerationByPostCommentId(groupModeration.postCommentId)
        } else {
            return this.sendUserErrors(response, 400, {
                type: 'invalid',
                log: `User(${currentUser.id}) posted an invalid moderation, nothing being moderated.`,
                message: `You must set either postId or postCommentId, otherwise you aren't moderating anything.`
            })
        }

        if ( existing !== null ) {
            return this.sendUserErrors(response, 409, {
                type: 'conflict',
                log: `GroupModeration(${existing.id}) already exists.`,
                message: `A GroupModeration already exists for that entity.  Please PATCH instead.`
            })
        }

        await this.groupModerationDAO.insertGroupModerations(groupModeration)

        const entityResults = await this.groupModerationDAO.selectGroupModerations({
            where: `group_moderation.id = $1`,
            params: [ groupModeration.id ]
        })

        if ( entityResults.list.length <= 0 ) {
            throw new Error(`Unable to find GroupModeration(${groupModeration.id}) after creation.`)
        }

        const entity = entityResults.dictionary[entityResults.list[0]]

        // Insert the event to track the moderation history.
        await this.groupModerationEventDAO.insertGroupModerationEvents(this.groupModerationEventDAO.createEventFromGroupModeration(entity))

        const relations = await this.getRelations(currentUser, entityResults)

        response.status(201).json({
            entity: entity,
            relations: relations
        })
    }

    async getGroupModeration(request, response) {
        const currentUser = request.session.user
        if ( ! currentUser ) {
            return this.sendUserErrors(response, 401, {
                type: 'not-authenticated',
                log: `User must be authenticated.`,
                message: `You must be authenticated.`
            })
        }

        const groupId = cleaning.GroupModeration.cleanGroupId(request.params.groupId)
        const groupIdValidationErrors = validation.GroupModeration.validateGroupId(groupId)
        if ( groupIdValidationErrors.length > 0 ) {
            return this.sendUserErrors(response, 400, groupValidationErrors)
        }

        const canViewGroup = await this.permissionService.can(currentUser, 'view', 'Group', { groupId: groupId })
        if ( canViewGroup !== true ) {
            return this.sendUserErrors(response, 404, {
                type: 'not-found',
                log: `GroupModeration(${id}) queried by User without authorization to view Group.`,
                message: `That doesn't exist or you don't have permission to see it.`
            })
        }

        const canViewGroupContent = await this.permissionService.can(currentUser, 'view', 'Group:content', { groupId: groupId })
        if ( canViewGroupContent !== true ) {
            return this.sendUserErrors(response, 404, {
                type: 'not-found',
                log: `GroupModeration(${id}) queried by User without authorization.`,
                message: `That doesn't exist or you don't have permission to see it.`
            })
        }

        const id = cleaning.GroupModeration.cleanId(request.params.id)
        const idValidationErrors = validation.GroupModeration.validateId(id)
        if ( idValidationErrors.length > 0 ) {
            return this.sendUserErrors(response, 400, idValidationErrors)
        }

        const results = await this.groupModerationDAO.selectGroupModerations({
            where: `groupModerations.id = $1`,
            params: [ id ]
        })

        if ( results.list.length <= 0 || ! (id in results.dictionary)) {
            return this.sendUserErrors(response, 404, {
                type: 'not-found',
                log: `GroupModeration(${id}) not found.`,
                message: `That doesn't exist or you don't have permission to see it.`
            })
        }

        const entity = results.dictionary[id]

        if ( groupId !== entity.groupId ) {
            return this.endUserErrors(response, 404, {
                type: 'not-found',
                log: `GroupModeration(${id}) queried with different groupId.`,
                message: `That doesn't exist or you don't have permission to see it.`
            })
        }
       
        const relations = await this.getRelations(currentUser, results)

        response.status(200).json({
            entity: entity,
            relations: relations
        })
    }

    async patchGroupModeration(request, response) {
        const currentUser = request.session.user
        if ( ! currentUser ) {
            return this.sendUserErrors(response, 401, {
                type: 'not-authenticated',
                log: `User must be authenticated.`,
                message: `You must be authenticated.`
            })
        }

        const groupId = cleaning.GroupModeration.cleanGroupId(request.params.groupId)
        const groupIdValidationErrors = validation.GroupModeration.validateGroupId(groupId)
        if ( groupIdValidationErrors.length > 0 ) {
            return this.sendUserErrors(response, 400, groupValidationErrors)
        }

        const canViewGroup = await this.permissionService.can(currentUser, 'view', 'Group', { groupId: groupId })
        if ( canViewGroup !== true ) {
            return this.sendUserErrors(response, 404, {
                type: 'not-found',
                log: `GroupModeration(${id}) patched by User without authorization to view Group.`,
                message: `That doesn't exist or you don't have permission to see it.`
            })
        }

        const canViewGroupContent = await this.permissionService.can(currentUser, 'view', 'Group:content', { groupId: groupId })
        if ( canViewGroupContent !== true ) {
            return this.sendUserErrors(response, 404, {
                type: 'not-found',
                log: `GroupModeration(${id}) patched by User without authorization.`,
                message: `That doesn't exist or you don't have permission to see it.`
            })
        }

        const canModerateGroup = await this.permissionService.can(currentUser, 'moderate', 'Group', { groupId: groupId })
        if ( canModerateGroup !== true ) {
            return this.sendUserErrors(response, 403, {
                type: 'not-authorized',
                log: `User attempting to PATCH a GroupModeration they don't have permission to update.`,
                message: `You don't have permission to update that GroupModeration.`
            })
        }

        const id = cleaning.GroupModeration.cleanId(request.params.id)
        const idValidationErrors = validation.GroupModeration.validateId(id)
        if ( idValidationErrors.length > 0 ) {
            return this.sendUserErrors(response, 400, idValidationErrors)
        }

        const existing = await this.groupModerationDAO.getGroupModerationById(id)
        if ( existing === null ) {
            return this.sendUserErrors(response, 400, {
                type: 'not-found',
                log: `User attempting to PATCH a GroupModeration that doesn't exist.`,
                message: `That doesn't exist or you don't have permission to see it.`
            })
        }

        const groupModeration = cleaning.GroupModeration.clean(request.body)
        if ( groupModeration.id !== id) {
            return this.sendUserErrors(response, 400, {
                type: 'invalid',
                log: `User(${currentUser.id}) submitted a GroupModeration patch with the wrong id.`,
                message: `You used a different GroupModeration.id in your patch and your route.  Ids must match.`
            })
        }

        const validationErrors = await this.validationService.validateGroupModeration(currentUser, groupModeration, existing)
        if ( validationErrors.length > 0 ) {
            return this.sendUserErrors(response, 400, validationErrors)
        }

        await this.groupModerationDAO.updateGroupModeration(groupModeration)

        const results = await this.groupModerationDAO.selectGroupModerations({
            where: `group_moderation.id = $1`,
            params: [ id ]
        })

        const entity = results.dictionary[id]
        if ( ! entity ) {
            throw new Error(`Failed to find GroupModeration(${id}) after update.`)
        }

        /* TODO Notifications for GroupModeration
         * if ( entity.status === 'rejected' ) {
            if ( entity.postId !== null && entity.postCommentId === null) {
                await this.notificationService.sendNotifications(
                    currentUser,
                    'Post:moderation:rejected',
                    {
                        moderation: entity
                    }
                )
            } else if ( entity.postId !== null && entity.postCommentId !== null ) {
                await this.notificationService.sendNotifications(
                    currentUser,
                    'Post:comment:moderation:rejected',
                    {
                        moderation: entity
                    }
                )
            }
        }*/

        // Insert the event to track the moderation history.
        await this.groupModerationEventDAO.insertGroupModerationEvents(this.groupModerationEventDAO.createEventFromGroupModeration(entity))

        const relations = this.getRelations(currentUser, results)

        response.status(201).json({
            entity: entity,
            relations: relations
        })
    }

    async deleteGroupModeration(request, response) {
        throw new ControllerError(501, 'not-implemented',
            `DELETE not implemented for entity GroupModeration.`,
            `You cannot DELETE a GroupModeration.`)
    }
}
