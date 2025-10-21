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

const { LinkPreviewDAO, LinkPreviewService, ValidationService, PermissionService } = require('@communities/backend')
const { cleaning, validation } = require('@communities/shared')

const ControllerError = require('../errors/ControllerError')

module.exports = class LinkPreviewController {
    constructor(core) {
        this.core = core

        this.linkPreviewDAO = new LinkPreviewDAO(core)

        this.linkPreviewService = new LinkPreviewService(core)

        this.validationService = new ValidationService(core)
        this.permissionService = new PermissionService(core)
    }

    async getRelations(results, relations) {
        return {}
    }

    async createQuery(request) {
        const query = {
            where: '',
            params: [],
            page: 1,
            order: 'created_date DESC'
        }

        if ( request.query.url ) {
            query.params.push(request.query.url)
            query.where += `link_previews.url = $${query.params.length}`
        }

        return query
    }

    async getLinkPreviews(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to retrieve link previews.`,
                `You must be authenticated to retrieve link previews.`)
        }

        const query = await this.createQuery(request)

        const meta = await this.linkPreviewDAO.getLinkPreviewMeta(query)

        const results = await this.linkPreviewDAO.selectLinkPreviews(query)

        response.status(200).json({
            dictionary: results.dictionary,
            list: results.list,
            meta: meta,
            relations: await this.getRelations(results)
        })
    }

    async postLinkPreviews(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to create link previews.`,
                `You must be authenticated to create link previews.`)
        }

        let url = cleaning.LinkPreview.cleanUrl(request.body.url)

        const existing = await this.linkPreviewDAO.getLinkPreviewByUrl(url)
        // TODO Refectch existing LinkPreviews every so often (every hour? day?)
        if ( existing === null ) {
            let linkPreview = null
            try {
                // If we haven't fetched this LinkPreview, then fetch and validate it. 
                linkPreview = cleaning.LinkPreview.clean(await this.linkPreviewService.getPreview(url, request.headers))
            } catch (error ) {
                if ( 'type' in error && error.type === 'not-found' ) {
                    throw new ControllerError(404, 'not-found',
                        error.message,
                        `We did not find a site at that url.`)
                } else if ( 'type' in error && error.type === 'not-authorized' ) {
                    throw new ControllerError(404, 'not-found',
                        error.message,
                        `We were not allowed to scrape that site to generate a preview.`)
                } else {
                    throw new ControllerError(404, 'not-found',
                        error.message,
                        `We were not able to scrape that site to generate a preivew.`)
                }
            }

            const validationErrors = await this.validationService.validateLinkPreview(currentUser, linkPreview)
            if ( validationErrors.length > 0 ) {
                request.logger.warn(`Failed link preview: `, linkPreview)
                const logString = validationErrors.reduce((string, error) => `${string}\n${error.log}`, '')
                throw new ControllerError(500, 'server-error',
                    `LinkPreview failed to validate: ${logString}`,
                    `We were not able to successfully fetch a preview for that link.`)
            }

            await this.linkPreviewDAO.insertLinkPreviews(linkPreview)
        }

        const results = await this.linkPreviewDAO.selectLinkPreviews({
            where: `link_previews.url = $1`,
            params: [ url ]
        })

        if ( results.list.length <= 0 ) {
            throw new ControllerError(500, 'server-error',
                `LinkPreview for ${url} missing after insert.`,
                `We created a LinkPreview for ${url} but couldn't find it after it was created. 
                This is a bug.  Please report it.`)
        }

        const entity = results.dictionary[results.list[0]]
        const relations = this.getRelations(results)

        response.status(200).json({
            entity: entity,
            relations: relations 
        })
    }

    async getLinkPreview(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to create link previews.`,
                `You must be authenticated to create link previews.`)
        }

        const id = cleaning.LinkPreview.cleanId(request.params.id)

        const results = await this.linkPreviewDAO.selectLinkPreviews({
            where: `link_previews.id = $1`,
            params: [ id ]
        })

        if ( results.list.length < 0 ) {
            throw new ControllerError(404, 'not-found',
                `LinkPreview(${id}) not found.`,
                `LinkPreview(${id}) either doesn't exist or you don't have permision to view it.`)
        }

        const entity = results.dictionary[id]

        response.status(200).json({
            entity: entity,
            relations: await this.getRelations(results)
        })
    }

    async patchLinkPreview(request, response) {
        throw new ControllerError(501, 'not-implemented',
            `PATCH LinkPreview is not yet implemented.`,
            `PATCH LinkPreview is not yet implemented.`)
    }

}


