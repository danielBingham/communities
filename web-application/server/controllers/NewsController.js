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

const { NewsService, PermissionService, ServiceError } = require('@communities/backend')
const { schema } = require('@communities/shared')

const BaseController = require('./BaseController')
const ControllerError = require('../errors/ControllerError')
const NotAuthenticatedError = require('../errors/NotAuthenticatedError')
const NotAuthorizedError = require('../errors/NotAuthorizedError')
const NotFoundError = require('../errors/NotFoundError')

/**
 * The posts on the News page (/about/news).
 *
 * News is kept in storage rather than the database (see NewsService).
 * Anyone may read it, including people without an account.  Only site admins
 * (`site_role` 'admin' or 'superadmin') may post, edit or delete it.
 */
module.exports = class NewsController extends BaseController {

    constructor(core) {
        super(core)

        this.newsService = new NewsService(core)
        this.permissionService = new PermissionService(core)

        this.newsSchema = new schema.NewsSchema()
    }

    /**
     * Make sure `currentUser` may change News.
     *
     * @param {Object} currentUser  The session's user, if there is one.
     * @param {string} action   What they're trying to do, for the messages.
     *
     * @throws {NotAuthenticatedError} When there's no user.
     * @throws {NotAuthorizedError} When the user isn't a site admin.
     */
    async ensureCanAdminNews(currentUser, action) {
        if ( ! currentUser ) {
            throw new NotAuthenticatedError(`Unauthenticated user attempting to ${action} News.`)
        }

        const canAdminSite = await this.permissionService.can(currentUser, 'admin', 'Site')
        if ( ! canAdminSite ) {
            throw new NotAuthorizedError(`User(${currentUser.id}) attempting to ${action} News without permission.`,
                `Only site admins may ${action} News.`)
        }
    }

    /**
     * GET /news
     *
     * Get a page of posts, newest first.  Public.
     *
     * @param {Object} request  Standard Express request object.
     * @param {string} request.query.page  (Optional) Which page of posts to
     * get, counting from 1.  Defaults to the first.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getNewsList(request, response) {
        let page = 1
        if ( 'page' in request.query && parseInt(request.query.page, 10) > 0 ) {
            page = parseInt(request.query.page, 10)
        }

        const results = await this.newsService.getNewsPage(page)

        response.status(200).json({
            dictionary: results.dictionary,
            list: results.list,
            meta: results.meta,
            relations: {}
        })
    }

    /**
     * POST /news
     *
     * Add a post.  Site admins only.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} request.body  The post: title, slug, date, author and
     * content.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async postNews(request, response) {
        const currentUser = request.session.user

        await this.ensureCanAdminNews(currentUser, 'post')

        const news = this.newsSchema.clean(request.body) ?? {}

        const errors = this.newsSchema.validate(news)
        if ( errors.all.length > 0 ) {
            return this.sendUserErrors(response, 400, errors.all)
        }

        let entity = null
        try {
            entity = await this.newsService.createNews(news)
        } catch (error) {
            if ( error instanceof ServiceError && error.type === 'conflict' ) {
                throw new ControllerError(409, 'conflict',
                    `User(${currentUser.id}) attempting to post News(${news.slug}), which already exists.`,
                    `There's already a post at that URL.  Change the title or date to get a different one.`)
            }
            throw error
        }

        response.status(201).json({
            entity: entity,
            relations: {}
        })
    }

    /**
     * GET /news/:slug
     *
     * Get one post.  Public.
     *
     * @param {Object} request  Standard Express request object.
     * @param {string} request.params.slug  The post's slug.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getNews(request, response) {
        const slug = request.params.slug

        const entity = await this.newsService.getNews(slug)
        if ( entity === null ) {
            throw new NotFoundError(`News(${slug}) not found.`)
        }

        response.status(200).json({
            entity: entity,
            relations: {}
        })
    }

    /**
     * PATCH /news/:slug
     *
     * Change some of a post's properties.  The slug can't be changed.  Site
     * admins only.
     *
     * @param {Object} request  Standard Express request object.
     * @param {string} request.params.slug  The post's slug.
     * @param {Object} request.body  The properties to change.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async patchNews(request, response) {
        const currentUser = request.session.user
        const slug = request.params.slug

        await this.ensureCanAdminNews(currentUser, 'edit')

        const existing = await this.newsService.getNews(slug)
        if ( existing === null ) {
            throw new NotFoundError(`User(${currentUser.id}) attempting to PATCH News(${slug}), which doesn't exist.`)
        }

        const news = this.newsSchema.clean(request.body) ?? {}

        const errors = this.newsSchema.validate(news, existing)
        if ( errors.all.length > 0 ) {
            return this.sendUserErrors(response, 400, errors.all)
        }

        let entity = null
        try {
            entity = await this.newsService.updateNews(slug, news)
        } catch (error) {
            // Deleted since we looked it up.
            if ( error instanceof ServiceError && error.type === 'not-found' ) {
                throw new NotFoundError(`User(${currentUser.id}) attempting to PATCH News(${slug}), which was deleted.`)
            }
            throw error
        }

        response.status(201).json({
            entity: entity,
            relations: {}
        })
    }

    /**
     * DELETE /news/:slug
     *
     * Remove a post.  Site admins only.
     *
     * @param {Object} request  Standard Express request object.
     * @param {string} request.params.slug  The post's slug.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async deleteNews(request, response) {
        const currentUser = request.session.user
        const slug = request.params.slug

        await this.ensureCanAdminNews(currentUser, 'delete')

        let entity = null
        try {
            entity = await this.newsService.deleteNews(slug)
        } catch (error) {
            if ( error instanceof ServiceError && error.type === 'not-found' ) {
                throw new NotFoundError(`User(${currentUser.id}) attempting to DELETE News(${slug}), which doesn't exist.`)
            }
            throw error
        }

        response.status(200).json({
            entity: entity,
            relations: {}
        })
    }
}
