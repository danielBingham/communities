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

const { NewsService, PageMetadataService } = require('@communities/backend')
const { lib } = require('@communities/shared')

const BaseController = require('./BaseController')

/**
 * Serves the web application's pages: the index.html webpack builds, with
 * two things for the requested page rendered into its <head>:
 *
 *  - Its metadata (its title, description and social sharing tags).  The
 *    crawlers that build link previews don't run JavaScript, so the metadata
 *    has to be in the HTML we send.
 *
 *  - The entities we read to build the metadata, in a
 *    `<script type="application/json">`, shaped like an API response's
 *    relations.  The client loads them into its store when it starts (see
 *    `client/state/lib/preloadedEntities.js`), so it doesn't have to request
 *    them again.  We read a News post to build its metadata anyway.
 *
 * We don't render the React app on the server.  Every page is the same
 * index.html, and the client renders the page once it loads.
 *
 * `server/views/index.html` marks the metadata in its <head> with:
 *
 *      <!--! page-metadata:start -->
 *      ...the default metadata...
 *      <!--! page-metadata:end -->
 *
 * and we replace what's between the markers.  The markers are `<!--!`
 * comments because the production build's minifier removes ordinary comments
 * but keeps those.  What's between them in the file is only used when the
 * file is served as it is: by the mobile apps, which load it from their
 * bundle.
 *
 * Getting a page's data should never stop the page from loading.  If it fails
 * or takes too long, the page gets the default metadata and no preloaded
 * entities, and the client requests what it needs as usual.
 */
module.exports = class PageController extends BaseController {

    /**
     * Where webpack builds index.html, relative to the working directory.
     */
    static INDEX_PATH = 'public/dist/index.html'

    static START_MARKER = '<!--! page-metadata:start -->'
    static END_MARKER = '<!--! page-metadata:end -->'

    /**
     * How long to wait for a page's data, in milliseconds, before giving up
     * and sending the page with the default metadata.  Generous, because a
     * crawler that gets the defaults keeps them: Facebook holds on to a link
     * preview for weeks.  But not so long that a hung request to S3 holds up
     * the page.
     */
    static PAGE_DATA_TIMEOUT = 2000

    constructor(core) {
        super(core)

        this.newsService = new NewsService(core)
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
     * Render a page's preloaded entities as the <script> the client loads
     * them from.
     *
     * The JSON goes in as it is, so every `<` in it is escaped as `\u003c`.
     * JSON.parse() turns it back, and nothing in the JSON can end the
     * <script> (`</script>`) or confuse the HTML parser (`<!--`), even when
     * the content is someone's post.
     *
     * @param {Object} entities     The page's preloaded entities, shaped like
     * an API response's relations: `{ news: { <slug>: <entity> } }`.
     *
     * @return {string} The <script>, or '' when there aren't any entities.
     */
    renderPreloadedEntities(entities) {
        if ( Object.keys(entities).length === 0 ) {
            return ''
        }

        const json = JSON.stringify(entities).replace(/</g, '\\u003c')
        return `<script type="application/json" id="${lib.preloadedEntities.ELEMENT_ID}">${json}</script>\n`
    }

    /**
     * Send index.html with a page's metadata and preloaded entities.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} response Standard Express response object.
     * @param {function} getPageData    Gets what the page needs.  Returns (or
     * resolves to) `{ metadata, status, entities }`: the page's metadata,
     * the status to send it with (default 200) and its preloaded entities
     * (default none).  See renderPreloadedEntities().
     *
     * @returns {Promise}   Resolves to void.
     */
    async sendPage(request, response, getPageData) {
        const logger = request.logger ?? this.core.logger

        const index = await this.getIndex()

        let page = null
        try {
            page = await this.withTimeout(Promise.resolve().then(getPageData), PageController.PAGE_DATA_TIMEOUT)
        } catch (error) {
            logger.error(`Failed to get the data for page '${request.path}'.  Sending the default metadata.`)
            logger.error(error)
        }

        const metadata = page?.metadata ?? this.pageMetadataService.getDefaultMetadata()
        const status = page?.status ?? 200
        const entities = page?.entities ?? {}

        let html = index.before
        if ( index.after !== null ) {
            html = `${index.before}\n`
                + this.pageMetadataService.renderTags(metadata)
                + this.renderPreloadedEntities(entities)
                + index.after
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
        await this.sendPage(request, response, () => ({
            metadata: this.pageMetadataService.getRootMetadata()
        }))
    }

    /**
     * GET /about/news
     *
     * The list of News posts.  Its metadata doesn't depend on the posts, so
     * this doesn't read them.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getNewsList(request, response) {
        await this.sendPage(request, response, () => ({
            metadata: this.pageMetadataService.getNewsListMetadata()
        }))
    }

    /**
     * GET /about/news/:slug
     *
     * A News post: 404 when there's no such post.  The post is preloaded, so
     * the client doesn't request it.
     *
     * @param {Object} request  Standard Express request object.
     * @param {string} request.params.slug  The post's slug.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getNews(request, response) {
        await this.sendPage(request, response, async () => {
            const news = await this.newsService.getNews(request.params.slug)

            // The page doesn't exist.  The client will show that, but crawlers
            // should know it too.
            if ( news === null ) {
                return {
                    metadata: this.pageMetadataService.getDefaultMetadata(),
                    status: 404
                }
            }

            return {
                metadata: this.pageMetadataService.getNewsMetadata(news),
                entities: {
                    news: { [news.slug]: news }
                }
            }
        })
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
        await this.sendPage(request, response, () => ({
            metadata: this.pageMetadataService.getDefaultMetadata()
        }))
    }
}
