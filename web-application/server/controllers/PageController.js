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
const fs = require('fs')
const path = require('path')

const { PageMetadataService } = require('@communities/backend')

const BaseController = require('./BaseController')

/**
 * Serves the web application's pages: the index.html webpack builds, with
 * the requested page's metadata (its title, description and social sharing
 * tags) rendered into its <head>.
 *
 * We don't render the React app on the server.  Every page is the same
 * index.html, and the client renders the page once it loads.  But the
 * crawlers that build link previews don't run JavaScript, so the metadata has
 * to be in the HTML we send.
 *
 * `server/views/index.html` marks the metadata in its <head> with:
 *
 *      <!--! page-metadata:start -->
 *      ...the default metadata...
 *      <!--! page-metadata:end -->
 *
 * and we replace what's between the markers with the page's metadata, from
 * PageMetadataService.  The markers are `<!--!` comments because the
 * production build's minifier removes ordinary comments but keeps those.
 * What's between them in the file is only used when the file is served as
 * it is: by the mobile apps, which load it from their bundle.
 *
 * Getting a page's metadata should never stop the page from loading.  If it
 * fails or takes too long, the page gets the default metadata.
 */
module.exports = class PageController extends BaseController {

    /**
     * Where webpack builds index.html, relative to the working directory.
     */
    static INDEX_PATH = 'public/dist/index.html'

    static START_MARKER = '<!--! page-metadata:start -->'
    static END_MARKER = '<!--! page-metadata:end -->'

    /**
     * How long to wait for a page's metadata, in milliseconds, before giving
     * up and sending the page with the default metadata.  Generous, because
     * a crawler that gets the defaults keeps them: Facebook holds on to a
     * link preview for weeks.  But not so long that a hung request to S3
     * holds up the page.
     */
    static METADATA_TIMEOUT = 2000

    constructor(core) {
        super(core)

        this.pageMetadataService = new PageMetadataService(core)

        this.indexPath = path.join(process.cwd(), PageController.INDEX_PATH)

        /**
         * index.html, split around the metadata: `{ before, after }`.  When
         * the markers are missing, `after` is null and `before` is the whole
         * file.
         */
        this.index = null
    }

    /**
     * Get index.html, split around the metadata.
     *
     * In development, webpack rebuilds index.html (with new bundle names)
     * whenever the client changes, so we read it every time.  Everywhere
     * else, it's built once into the image, so we read it once.
     *
     * @return {Promise<Object>} `{ before, after }`.  See the constructor.
     */
    async getIndex() {
        if ( this.index !== null && this.core.config.environment !== 'development' ) {
            return this.index
        }

        const html = await fs.promises.readFile(this.indexPath, 'utf8')
        this.index = this.splitIndex(html)
        return this.index
    }

    /**
     * Split index.html around the metadata, keeping the markers.
     *
     * @param {string} html     index.html.
     *
     * @return {Object} `{ before, after }`.  See the constructor.
     */
    splitIndex(html) {
        const start = html.indexOf(PageController.START_MARKER)
        const end = start === -1 ? -1 : html.indexOf(PageController.END_MARKER, start)

        if ( start === -1 || end === -1 ) {
            this.core.logger.error(`'${PageController.INDEX_PATH}' doesn't have the page metadata markers, `
                + `so pages will be served without their metadata.  See server/views/index.html.`)
            return { before: html, after: null }
        }

        return {
            before: html.slice(0, start + PageController.START_MARKER.length),
            after: html.slice(end)
        }
    }

    /**
     * Wait for `promise`, but no longer than `milliseconds`.
     *
     * @param {Promise} promise     What to wait for.
     * @param {number} milliseconds How long to wait.
     *
     * @return {Promise} Settles as `promise` does, or rejects when it takes
     * too long.
     */
    async withTimeout(promise, milliseconds) {
        let timer = null
        const timeout = new Promise(function(resolve, reject) {
            timer = setTimeout(() => reject(new Error(`Timed out after ${milliseconds}ms.`)), milliseconds)
        })

        try {
            return await Promise.race([ promise, timeout ])
        } finally {
            clearTimeout(timer)
        }
    }

    /**
     * Send index.html with a page's metadata.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} response Standard Express response object.
     * @param {function} getMetadata    Gets the page's metadata: returns it
     * (or a Promise of it), or null when the page doesn't exist.
     *
     * @returns {Promise}   Resolves to void.
     */
    async sendPage(request, response, getMetadata) {
        const logger = request.logger ?? this.core.logger

        const index = await this.getIndex()

        let status = 200
        let metadata = null
        try {
            metadata = await this.withTimeout(Promise.resolve().then(getMetadata), PageController.METADATA_TIMEOUT)

            // The page doesn't exist.  The client will show that, but crawlers
            // should know it too.
            if ( metadata === null ) {
                status = 404
            }
        } catch (error) {
            logger.error(`Failed to get the metadata for page '${request.path}'.  Sending the default metadata.`)
            logger.error(error)
        }

        if ( metadata === null ) {
            metadata = this.pageMetadataService.getDefaultMetadata()
        }

        let html = index.before
        if ( index.after !== null ) {
            html = `${index.before}\n${this.pageMetadataService.renderTags(metadata)}${index.after}`
        }

        // What's in the page changes with its content, so make browsers check
        // rather than reuse a copy they have.  The ETag Express adds lets them
        // skip the download when nothing has changed.
        response.set('Cache-Control', 'no-cache')
        response.status(status).type('html').send(html)
    }

    /**
     * GET /
     *
     * The home page.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getRoot(request, response) {
        await this.sendPage(request, response, () => this.pageMetadataService.getRootMetadata())
    }

    /**
     * GET /about/news
     *
     * The list of News posts.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getNewsList(request, response) {
        await this.sendPage(request, response, () => this.pageMetadataService.getNewsListMetadata())
    }

    /**
     * GET /about/news/:slug
     *
     * A News post.  404 when there's no such post.
     *
     * @param {Object} request  Standard Express request object.
     * @param {string} request.params.slug  The post's slug.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getNews(request, response) {
        await this.sendPage(request, response, () => this.pageMetadataService.getNewsMetadata(request.params.slug))
    }

    /**
     * Any other page.  It gets the default metadata.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getPage(request, response) {
        await this.sendPage(request, response, () => this.pageMetadataService.getDefaultMetadata())
    }
}
