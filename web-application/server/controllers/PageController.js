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
const NotFoundError = require('../errors/NotFoundError')
const { getControllerErrorBody } = require('../errors.js')

/**
 * Serves the web application's pages: the index.html webpack builds, with
 * two things for the requested page rendered into its <head>:
 *
 *  - Its metadata (its title, description and social sharing tags).  The
 *    crawlers that build link previews don't run JavaScript, so the metadata
 *    has to be in the HTML we send.
 *
 *  - The API responses for the requests the page makes as it loads, when we
 *    already have what's in them, in a `<script type="application/json">`.
 *    The client's makeRequest() answers those requests from them instead of
 *    the network (see `client/state/lib/preloadedResponses.js`).  We read a
 *    News post to build its metadata anyway, so the client shouldn't have to
 *    ask for it again.
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
 * responses, and the client makes its requests as usual.
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
     * Add a response to a page's preloaded responses.
     *
     * The response must be exactly what the API sends for that request, and
     * should be built the same way the API's controller builds it.
     *
     * @param {Object} responses    The page's preloaded responses.
     * @param {string} method   The request's method.
     * @param {string} endpoint The request's endpoint, relative to the API's
     * root, exactly as the client's thunk requests it.
     * @param {number} status   The response's status.
     * @param {Object} body     The response's body.
     */
    addPreloadedResponse(responses, method, endpoint, status, body) {
        responses[lib.preloadedResponses.getPreloadedResponseKey(method, endpoint)] = {
            status: status,
            body: body
        }
    }

    /**
     * Render a page's preloaded responses as the <script> the client reads
     * them from.
     *
     * The JSON goes in as it is, so every `<` in it is escaped as `<`.
     * JSON.parse() turns it back, and nothing in the JSON can end the
     * <script> (`</script>`) or confuse the HTML parser (`<!--`), even when
     * the content is someone's post.
     *
     * @param {Object} responses    The page's preloaded responses.
     *
     * @return {string} The <script>, or '' when there aren't any responses.
     */
    renderPreloadedResponses(responses) {
        if ( Object.keys(responses).length === 0 ) {
            return ''
        }

        const json = JSON.stringify(responses).replace(/</g, '\\u003c')
        return `<script type="application/json" id="${lib.preloadedResponses.ELEMENT_ID}">${json}</script>\n`
    }

    /**
     * Send index.html with a page's metadata and preloaded responses.
     *
     * @param {Object} request  Standard Express request object.
     * @param {Object} response Standard Express response object.
     * @param {function} getPageData    Gets what the page needs.  Returns (or
     * resolves to) `{ metadata, status, responses }`: the page's metadata,
     * the status to send it with (default 200) and its preloaded responses
     * (default none).  See addPreloadedResponse().
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
        const responses = page?.responses ?? {}

        let html = index.before
        if ( index.after !== null ) {
            html = `${index.before}\n`
                + this.pageMetadataService.renderTags(metadata)
                + this.renderPreloadedResponses(responses)
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
     * The list of News posts.  Preloads the page of posts the client will
     * request: GET /news?page=<page>.
     *
     * @param {Object} request  Standard Express request object.
     * @param {string} request.query.page   (Optional) Which page of posts.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getNewsList(request, response) {
        await this.sendPage(request, response, async () => {
            // Read the page the way the client's useNewsQuery() does, so we
            // preload the request it will make.
            const searchParams = new URL(request.originalUrl, 'https://page.invalid').searchParams
            let page = parseInt(searchParams.get('page') ?? 1, 10)
            if ( ! (page > 0) ) {
                page = 1
            }

            // As NewsController.getNewsList() sends it.
            const results = await this.newsService.getNewsPage(page)

            const responses = {}
            this.addPreloadedResponse(responses, 'GET', `/news?page=${page}`, 200, {
                dictionary: results.dictionary,
                list: results.list,
                meta: results.meta,
                relations: {}
            })

            return {
                metadata: this.pageMetadataService.getNewsListMetadata(),
                responses: responses
            }
        })
    }

    /**
     * GET /about/news/:slug
     *
     * A News post: 404 when there's no such post.  Preloads the request the
     * client will make for the post: GET /news/:slug.
     *
     * @param {Object} request  Standard Express request object.
     * @param {string} request.params.slug  The post's slug.
     * @param {Object} response Standard Express response object.
     *
     * @returns {Promise}   Resolves to void.
     */
    async getNews(request, response) {
        await this.sendPage(request, response, async () => {
            const slug = request.params.slug
            const endpoint = `/news/${encodeURIComponent(slug)}`
            const responses = {}

            const news = await this.newsService.getNews(slug)

            // The page doesn't exist.  The client will show that, but crawlers
            // should know it too.  As NewsController.getNews() sends it.
            if ( news === null ) {
                const error = new NotFoundError(`News(${slug}) not found.`)
                this.addPreloadedResponse(responses, 'GET', endpoint, error.status, getControllerErrorBody(error))

                return {
                    metadata: this.pageMetadataService.getDefaultMetadata(),
                    status: 404,
                    responses: responses
                }
            }

            // As NewsController.getNews() sends it.
            this.addPreloadedResponse(responses, 'GET', endpoint, 200, {
                entity: news,
                relations: {}
            })

            return {
                metadata: this.pageMetadataService.getNewsMetadata(news),
                responses: responses
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
