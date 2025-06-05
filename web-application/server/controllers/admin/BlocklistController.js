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
    BlocklistDAO, 
}  = require('@communities/backend')
const ControllerError = require('../../errors/ControllerError')

module.exports = class BlocklistController {

    constructor(core) {
        this.core = core

        this.blocklistDAO = new BlocklistDAO(core)

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
            order: 'blocklist.created_date ASC',
            relations: []
        }

        if ( 'relations' in request.query && Array.isArray(request.query.relations)) {
            query.relations = [ ...request.query.relations]
        }

        return query
    }

    async getBlocklists(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to retrieve posts.`,
                `You must be authenticated to retrieve posts.`)
        }

        const canAdminSite = await this.permissionService.can(currentUser, 'admin', 'Site')
        if ( ! canAdminSite ) {
            throw new ControllerError(403, 'not-authorized',
                `Only admin users may list Blocklists.`,
                `You do not have permission to administrate Communities.`)
        }

        const query = await this.createQuery(request)
        const results = await this.blocklistDAO.selectBlocklists(query)
        const meta = await this.blocklistDAO.getBlocklistPageMeta(query)
        const relations = await this.getRelations(currentUser, results, query.relations)

        response.status(200).json({ 
            dictionary: results.dictionary,
            list: results.list,
            meta: meta,
            relations: relations
        })
    }

    async postBlocklists(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to create a post.`,
                `You must must be authenticated to create a post.`)
        }

        const blocklist = request.body

        const canAdminSite = await this.permissionService.can(currentUser, 'admin', 'Site')
        if ( ! canAdminSite ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to administrate site without permissions.`,
                `You do not have permission to administrate Communities.`)
        }

        const validationErrors = await this.validationService.validateBlocklist(currentUser, blocklist, null)
        if ( validationErrors.length > 0 ) {
            const errorString = validationErrors.reduce((string, error) => `${string}\n${error.message}`, '')
            const logString = validationErrors.reduce((string, error) => `${string}\n${error.log}`, '')
            throw new ControllerError(400, 'invalid',
                `User(${currentUser.id}) submitted an invalid blocklist: ${logString}`,
                errorString)
        }

        await this.blocklistDAO.insertBlocklists(blocklist)

        const entityResults = await this.blocklistDAO.selectBlocklists({
            where: `blocklist.id = $1`,
            params: [ blocklist.id ]
        })

        if ( entityResults.list.length <= 0 ) {
            throw new ControllerError(500, 'server-error',
                `Unable to find Blocklist(${group.slug}) after creation.`,
                `We encountered a bug on the server that we were unable to recover from.  Please report this bug!`)
        }

        const entity = entityResults.dictionary[entityResults.list[0]]

        const relations = await this.getRelations(currentUser, entityResults)

        response.status(201).json({
            entity: entity,
            relations: relations
        })
    }

    async getBlocklist(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to retrieve Blocklist.`,
                `You must be authenticated to retrieve Blocklist.`)
        }

        const canAdminSite = await this.permissionService.can(currentUser, 'admin', 'Site')
        if ( ! canAdminSite ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to GET a Blocklist without permission.`,
                `You do not have permission to admnistrate Communities.`)
        }

        const blocklistId = request.params.id

        const results = await this.blocklistDAO.selectBlocklists({
            where: `blocklist.id = $1`,
            params: [blocklistId]
        })

        if ( results.list.length <= 0 || ! (blocklistId in results.dictionary)) {
            throw new ControllerError(404, 'not-found',
                `Blocklist(${blocklistId}) not found for User(${currentUser.id}).`,
                `Either that blocklist doesn't exist or you don't have permission to see it.`)
        }

        const blocklist = results.dictionary[blocklistId]
       
        const relations = await this.getRelations(currentUser, results)

        response.status(200).json({
            entity: blocklist,
            relations: relations
        })
    }

    async patchBlocklist(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to edit a post.`,
                `You must must be authenticated to edit a post.`)
        }

        const canAdminSite = await this.permissionService.can(currentUser, 'admin', 'Site')
        if ( ! canAdminSite ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting patch a Blocklist without permission.`,
                `You do not have permission to administrate Communities.`)
        }

        const blocklistId = request.params.id
        const blocklist = request.body

        if ( blocklist.id !== blocklistId ) {
            throw new ControllerError(400, 'invalid', 
                `User(${currentUser.id}) submitted a Blocklist patch with the wrong id.`,
                `You used a different Blocklist.id in your patch and your route.  Ids must match.`)
        }

        const existing = await this.blocklistDAO.getBlocklistById(blocklistId)
        if ( ! existing ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to PATCH a Blocklist that doesn't exist.`,
                `Either that Blocklist doesn't exist or you don't have permission to see it.`)
        }


        const validationErrors = await this.validationService.validateBlocklist(currentUser, blocklist, existing)
        if ( validationErrors.length > 0 ) {
            const errorString = validationErrors.reduce((string, error) => `${string}\n${error.message}`, '')
            const logString = validationErrors.reduce((string, error) => `${string}\n${error.log}`, '')
            throw new ControllerError(400, 'invalid',
                `User(${currentUser.id}) submitted an invalid blocklist: ${logString}`,
                errorString)
        }

        await this.blocklistDAO.updateBlocklist(blocklist)

        const results = await this.blocklistDAO.selectBlocklists({
            where: `blocklist.id = $1`,
            params: [ blocklistId ]
        })

        const entity = results.dictionary[blocklistId]
        if ( ! entity ) {
            throw new ControllerError(500, 'server-error',
                `Failed to find Blocklist(${blocklistId}) after update.`,
                `We hit an error in the server we were unable to recover from.  Please report as a bug!`)
        }

        const relations = this.getRelations(currentUser, results)

        response.status(201).json({
            entity: entity,
            relations: relations
        })
    }

    async deleteBlocklist(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to edit a post.`,
                `You must must be authenticated to edit a post.`)
        }

        const canAdminSite = await this.permissionService.can(currentUser, 'admin', 'Site')
        if ( ! canAdminSite ) {
            throw new ControllerError(403, 'not-authorized',
                `User(${currentUser.id}) attempting to delete Blocklist without permissions.`,
                `You do not have permission to administrate Communities.`)
        }

        const blocklistId = request.params.id
        
        const existing = await this.blocklistDAO.getBlocklistById(blocklistId)

        if ( ! existing ) {
            throw new ControllerError(404, 'not-found',
                `User(${currentUser.id}) attempting to DELETE a blocklist that doesn't exist.`,
                `Either that blocklist doesn't exist or you don't have permission to see it.`)
        }

        await this.blocklistDAO.deleteBlocklist(existing)

        response.status(200).json({
            entity: existing,
            relations: {}
        })
    }
}
