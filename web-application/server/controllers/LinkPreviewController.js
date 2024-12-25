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

const { LinkPreviewDAO, LinkPreviewService } = require('@danielbingham/communities-backend')

module.exports = class LinkPreviewController {
    constructor(core) {
        this.core = core

        this.linkPreviewDAO = new LinkPreviewDAO(core)

        this.linkPreviewService = new LinkPreviewService(core)
    }

    async getRelations(results, relations) {}

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

        const url = request.body.url

        console.log(url)
        const linkPreview = await this.linkPreviewService.getPreview(url)
        console.log(linkPreview)
        await this.linkPreviewDAO.insertLinkPreviews(linkPreview)

        const results = await this.linkPreviewDAO.selectLinkPreviews({
            where: `link_previews.url = $1`,
            params: [ linkPreview.url ]
        })

        console.log(results)
        if ( results.list.length < 0 ) {
            throw new ControllerError(500, 'server-error',
                `LinkPreview for ${url} missing after insert.`,
                `We created a LinkPreview for ${url} but couldn't find it after it was created. 
                This is a bug.  Please report it.`)
        }

        const entity = results.dictionary[results.list[0]]

        response.status(200).json({
            entity: entity,
            relations: await this.getRelations(results)
        })
    }

    async getLinkPreview(request, response) {
        const currentUser = request.session.user

        if ( ! currentUser ) {
            throw new ControllerError(401, 'not-authenticated',
                `User must be authenticated to create link previews.`,
                `You must be authenticated to create link previews.`)
        }

        const id = request.params.id

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
        throw new ControllerError(405, 'not-implemented',
            `PATCH LinkPreview is not yet implemented.`,
            `PATCH LinkPreview is not yet implemented.`)
    }

}


