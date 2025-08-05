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

    PostDAO,
    PostCommentDAO,
    SiteModerationDAO, 
    SiteModerationEventDAO
}  = require('@communities/backend')
const ControllerError = require('../../errors/ControllerError')

module.exports = class SiteModerationController {

    constructor(core) {
        this.core = core

        this.postDAO = new PostDAO(core)
        this.postCommentDAO = new PostCommentDAO(core)
        this.siteModerationDAO = new SiteModerationDAO(core)
        this.siteModerationEventDAO = new SiteModerationEventDAO(core)

        this.notificationService = new NotificationService(core)
        this.permissionService = new PermissionService(core)
        this.validationService = new ValidationService(core)
    }

    async getRelations(currentUser, results, requestedRelations) {

        const postResults = await this.postDAO.selectPosts({
            where: `posts.site_moderation_id = ANY($1::uuid[])`,
            params: [ results.list ]
        })

        const postCommentResults = await this.postCommentDAO.selectPostComments({
            where: `post_comments.site_moderation_id = ANY($1::uuid[])`,
            params: [ results.list ]
        })

        return {
            posts: postResults.dictionary,
            postComments: postCommentResults.dictionary
        } 
    }

    async createQuery(request) {
        const query = {
            where: '',
            params: [],
            page: 1,
            order: 'site_moderation.created_date ASC',
            relations: []
        }

        if ( 'status' in request.query && request.query.status !== undefined && request.query.status !== null ) {
            const and = query.params.length > 0 ? ' AND ' : ''
            query.params.push(request.query.status)
            query.where += `${and} site_moderation.status = $${query.params.length}`
        }

        if ( 'postId' in request.query && request.query.postId !== undefined && request.query.postId !== null ) {
            const and = query.params.length > 0 ? ' AND ' : ''
            query.params.push(request.query.postId)
            query.where +=  `${and} site_moderation.post_id = $${query.params.length}`

        }

        if ( 'postCommentId' in request.query && request.query.postCommentId !== undefined && request.query.postCommentId !== null ) {
            const and = query.params.length > 0 ? ' AND ' : ''
            query.params.push(request.query.postCommentId)
            query.where += `${and} site_moderation.post_comment_id = $${query.params.length}`
        }

        if ( 'relations' in request.query && Array.isArray(request.query.relations)) {
            query.relations = [ ...request.query.relations]
        }

        return query
    }

    async getSiteModerations(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to retrieve posts.`,
                `You must be authenticated to retrieve posts.`)
        }

        const query = await this.createQuery(request)
        const results = await this.siteModerationDAO.selectSiteModerations(query)
        const meta = await this.siteModerationDAO.getSiteModerationPageMeta(query)
        const relations = await this.getRelations(currentUser, results, query.relations)

        response.status(200).json({ 
            dictionary: results.dictionary,
            list: results.list,
            meta: meta,
            relations: relations
        })
    }

    async postSiteModerations(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to create a post.`,
                `You must must be authenticated to create a post.`)
        }

        const moderation = request.body

        const canModerateSite = await this.permissionService.can(currentUser, 'moderate', 'Site')
        if ( moderation.status !== 'flagged' && ! canModerateSite ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to moderate site without permissions.`,
                `You do not have permission to moderate Communities.`)
        }

        let existing = null
        if ( moderation.postId && ! moderation.postCommentId) {
            existing = await this.siteModerationDAO.getSiteModerationByPostId(moderation.postId)
        } else if ( moderation.postCommentId ) {
            existing = await this.siteModerationDAO.getSiteModerationByPostCommentId(moderation.postCommentId)
        } else {
            throw new ControllerError(400, 'invalid',
                `User(${currentUser.id}) posted an invalid moderation, nothing being moderated.`,
                `You must set either postId or postCommentId, otherwise you aren't moderating anything.`)
        }

        if ( existing !== null ) {
            throw new ControllerError(409, 'conflict',
                `SiteModeration(${existing.id}) already exists.`,
                `A SiteModeration already exists for that entity.  Please PATCH instead.`)
        }

        const validationErrors = await this.validationService.validateSiteModeration(currentUser, moderation, existing)
        if ( validationErrors.length > 0 ) {
            const errorString = validationErrors.reduce((string, error) => `${string}\n${error.message}`, '')
            const logString = validationErrors.reduce((string, error) => `${string}\n${error.log}`, '')
            throw new ControllerError(400, 'invalid',
                `User(${currentUser.id}) submitted an invalid moderation: ${logString}`,
                errorString)
        }

        await this.siteModerationDAO.insertSiteModerations(moderation)

        const entityResults = await this.siteModerationDAO.selectSiteModerations({
            where: `site_moderation.id = $1`,
            params: [ moderation.id ]
        })

        if ( entityResults.list.length <= 0 ) {
            throw new ControllerError(500, 'server-error',
                `Unable to find SiteModeration(${group.slug}) after creation.`,
                `We encountered a bug on the server that we were unable to recover from.  Please report this bug!`)
        }

        const entity = entityResults.dictionary[entityResults.list[0]]

        // Insert the event to track the moderation history.
        await this.siteModerationEventDAO.insertSiteModerationEvents(this.siteModerationEventDAO.createEventFromSiteModeration(entity))

        if ( entity.postId && entity.postCommentId === null ) {
            const postUpdate = {
                id: entity.postId,
                siteModerationId: entity.id
            }
            await this.postDAO.updatePost(postUpdate)
        } else if ( entity.postCommentId ) {
            const postCommentUpdate = {
                id: entity.postCommentId,
                siteModerationId: entity.id
            }
            await this.postCommentDAO.updatePostComment(postCommentUpdate)
        }

        const relations = await this.getRelations(currentUser, entityResults)

        response.status(201).json({
            entity: entity,
            relations: relations
        })
    }

    async getSiteModeration(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to retrieve SiteModeration.`,
                `You must be authenticated to retrieve SiteModeration.`)
        }

        const siteModerationId = request.params.id

        const results = await this.siteModerationDAO.selectSiteModerations({
            where: `site_moderation.id = $1`,
            params: [siteModerationId]
        })

        if ( results.list.length <= 0 || ! (siteModerationId in results.dictionary)) {
            throw new ControllerError(404, 'not-found',
                `SiteModeration(${siteModerationId}) not found for User(${currentUser.id}).`,
                `Either that siteModeration doesn't exist or you don't have permission to see it.`)
        }

        const siteModeration = results.dictionary[siteModerationId]
       
        const relations = await this.getRelations(currentUser, results)

        response.status(200).json({
            entity: siteModeration,
            relations: relations
        })
    }

    async patchSiteModeration(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to edit a post.`,
                `You must must be authenticated to edit a post.`)
        }

        const siteModerationId = request.params.id
        const siteModeration = request.body

        if ( siteModeration.id !== siteModerationId ) {
            throw new ControllerError(400, 'invalid', 
                `User(${currentUser.id}) submitted a SiteModeration patch with the wrong id.`,
                `You used a different SiteModeration.id in your patch and your route.  Ids must match.`)
        }

        const existing = await this.siteModerationDAO.getSiteModerationById(siteModerationId)
        if ( ! existing ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to PATCH a SiteModeration that doesn't exist.`,
                `Either that SiteModeration doesn't exist or you don't have permission to see it.`)
        }

        const canModerate = await this.permissionService.can(currentUser, 'moderate', 'Site', {})
        if ( ! canModerate ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to PATCH a SiteModeration they don't have permission to edit.`,
                `You don't have permission to edit that SiteModeration.`)
        }

        const validationErrors = await this.validationService.validateSiteModeration(currentUser, siteModeration, existing)
        if ( validationErrors.length > 0 ) {
            const errorString = validationErrors.reduce((string, error) => `${string}\n${error.message}`, '')
            const logString = validationErrors.reduce((string, error) => `${string}\n${error.log}`, '')
            throw new ControllerError(400, 'invalid',
                `User(${currentUser.id}) submitted an invalid moderation: ${logString}`,
                errorString)
        }

        await this.siteModerationDAO.updateSiteModeration(siteModeration)

        const results = await this.siteModerationDAO.selectSiteModerations({
            where: `site_moderation.id = $1`,
            params: [ siteModerationId ]
        })

        const entity = results.dictionary[siteModerationId]
        if ( ! entity ) {
            throw new ControllerError(500, 'server-error',
                `Failed to find SiteModeration(${siteModerationId}) after update.`,
                `We hit an error in the server we were unable to recover from.  Please report as a bug!`)
        }

        if ( entity.status === 'rejected' ) {
            if ( entity.postId !== null && entity.postCommentId === null) {
                await this.notificationService.sendNotifications(
                    currentUser,
                    'SiteModeration:update:post:status:rejected:author',
                    {
                        moderation: entity
                    }
                )
            } else if ( entity.postId !== null && entity.postCommentId !== null ) {
                await this.notificationService.sendNotifications(
                    currentUser,
                    'SiteModeration:update:comment:status:rejected:author',
                    {
                        moderation: entity
                    }
                )
            }
        }

        // Insert the event to track the moderation history.
        await this.siteModerationEventDAO.insertSiteModerationEvents(this.siteModerationEventDAO.createEventFromSiteModeration(entity))

        const relations = await this.getRelations(currentUser, results)

        response.status(201).json({
            entity: entity,
            relations: relations
        })
    }

    async deleteSiteModeration(request, response) {
        throw new ControllerError(501, 'not-implemented',
            `DELETE not implemented for entity SiteModeration.`,
            `You cannot DELETE a SiteModeration.`)
    }
}
