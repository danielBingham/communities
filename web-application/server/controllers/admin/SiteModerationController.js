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
    PermissionService,
    SiteModerationDAO, 
}  = require('@communities/backend')
const ControllerError = require('../errors/ControllerError')

module.exports = class SiteModerationController {

    constructor(core) {
        this.core = core

        this.siteModerationDAO = new SiteModerationDAO(core)
        this.permissionService = new PermissionService(core)
    }

    async getRelations(currentUser, results, requestedRelations) {
        return {} 
    }

    async createQuery(request) {
        const query = {
            where: '',
            params: [],
            page: 1,
            order: 'site_moderation.created_date ASC',
            relations: []
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

        const canModerateSite = await this.permissionService.can(currentUser, 'moderate', 'Site')
        if ( ! canModerateSite ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to moderate site without permissions.`,
                `You do not have permission to moderate Communities.`)
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

        const canModerateSite = await this.permissionService.can(currentUser, 'moderate', 'Site')
        if ( ! canModerateSite ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to moderate site without permissions.`,
                `You do not have permission to moderate Communities.`)
        }

        const moderation = request.body

        let existing = null
        if ( moderation.postId ) {
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

        const validationErrors = await this.validationService.validateModeration(currentUser, moderation, existing)
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
                `User must be authenticated to retrieve posts.`,
                `You must be authenticated to retrieve posts.`)
        }

        const groupId = request.params.id

        const results = await this.siteModerationDAO.selectSiteModerations({
            where: `groups.id = $1`,
            params: [groupId]
        })

        if ( results.list.length <= 0 || ! (groupId in results.dictionary)) {
            throw new ControllerError(404, 'not-found',
                `SiteModeration(${groupId}) not found for User(${currentUser.id}).`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }

        const group = results.dictionary[groupId]

        const canViewSiteModeration = await this.permissionService.can(currentUser, 'view', 'SiteModeration', { group: group })
        if ( ! canViewSiteModeration ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to view SiteModeration(${groupId}) without permission.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }
       
       
        const relations = await this.getRelations(currentUser, results)

        response.status(200).json({
            entity: group,
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

        const groupId = request.params.id
        const group = request.body

        if ( group.id !== groupId ) {
            throw new ControllerError(400, 'invalid', 
                `User(${currentUser.id}) submitted a group patch with the wrong id.`,
                `You used a different groupId in your patch and your route.  Ids must match.`)
        }

        const existing = await this.siteModerationDAO.getSiteModerationById(groupId)
        if ( ! existing ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to PATCH a group that doesn't exist.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }


        const canViewSiteModeration = await this.permissionService.can(currentUser, 'view', 'SiteModeration', { group:  existing})
        if ( ! canViewSiteModeration ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to PATCH a group they don't have permission to view.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }

        const canUpdateSiteModeration = await this.permissionService.can(currentUser, 'update', 'SiteModeration', { group: existing })
        if ( ! canUpdateSiteModeration ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to PATCH a group they don't have permission to edit.`,
                `You don't have permission to edit that group.`)
        }

        if ( 'slug' in group ) {
            group.slug = group.slug.toLower()
            if ( ! group.slug.match(/[a-z0-9\.\-_]/) ) {
                throw new ControllerError(400, 'invalid',
                    `User(${currentUser.id}) submitted a group with invalid slug '${group.slug}'.`,
                    `The URL you submitted is invalid. Only characters, numbers, '.', '-', and '_' are allowed.`)
            }

            const existingSlug = await this.siteModerationDAO.getSiteModerationBySlug(group.slug)

            if ( existingSlug !== null ) {
                throw new ControllerError(400, 'invalid',
                    `User(${currentUser.id}) submitted a group with a slug that's already in use.`,
                    `A group with that URL already exists.`)
            }
        }

        await this.siteModerationDAO.updateSiteModeration(group)

        const results = await this.siteModerationDAO.selectSiteModerations({
            where: `groups.id = $1`,
            params: [ groupId ]
        })

        const entity = results.dictionary[groupId]
        if ( ! entity ) {
            throw new ControllerError(500, 'server-error',
                `Failed to find SiteModeration(${groupId}) after update.`,
                `We hit an error in the server we were unable to recover from.  Please report as a bug!`)
        }

        const relations = this.getRelations(currentUser, results)

        response.status(201).json({
            entity: entity,
            relations: relations
        })
    }

    async deleteSiteModeration(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to edit a post.`,
                `You must must be authenticated to edit a post.`)
        }

        const groupId = request.params.id
        
        const existing = await this.siteModerationDAO.getSiteModerationById(groupId)

        if ( ! existing ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to DELETE a group that doesn't exist.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }

        const canViewSiteModeration = await this.permissionService.can(currentUser, 'view', 'SiteModeration', { group:  existing})
        if ( ! canViewSiteModeration ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to DELETE a group they don't have permission to view.`,
                `Either that group doesn't exist or you don't have permission to see it.`)
        }

        const canDeleteSiteModeration = await this.permissionService.can(currentUser, 'delete', 'SiteModeration', { group: existing })
        if ( ! canDeleteSiteModeration ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to DELETE a group they don't have permission to edit.`,
                `You don't have permission to edit that group.`)
        }

        await this.siteModerationDAO.deleteSiteModeration(existing)

        response.status(200).json({
            entity: existing,
            relations: {}
        })

    }
}
