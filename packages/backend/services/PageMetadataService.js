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

const Handlebars = require('handlebars')

const { lib } = require('@communities/shared')

const NewsService = require('./NewsService')

/**
 * Collects the metadata for a page -- its title, description and social
 * sharing (Open Graph) details -- and renders it as the tags that go in the
 * page's <head>.
 *
 * Link previews are built by crawlers that don't run JavaScript, so the
 * server renders these tags into the index.html it sends (see
 * `web-application/server/controllers/PageController.js`).  The metadata
 * itself is built by `lib.pageMetadata` in `@communities/shared`, so that the
 * client can use the same functions later.
 *
 * Each page with metadata of its own gets a method here, and a route in
 * `web-application/server/pages.js`.
 */
module.exports = class PageMetadataService {

    /**
     * How long we hold on to News, in milliseconds, before fetching it
     * again.  News is one file in storage, and fetching it takes two requests
     * to S3, so we don't want to do that for every page view.  Changes to a
     * post can take this long to show up in its link previews.
     */
    static NEWS_MAX_AGE = 60 * 1000

    /**
     * How long, in milliseconds, after fetching News we'll fetch it again to
     * look for a post that wasn't in it.  See getNewsMetadata().
     */
    static NEWS_MISS_MAX_AGE = 5 * 1000

    /**
     * The template for the tags.
     */
    static TEMPLATE_PATH = path.join(__dirname, 'page-metadata', 'page-metadata.hbs')

    constructor(core) {
        this.core = core
        this.host = core.config.host

        this.newsService = new NewsService(core)

        /**
         * The News index we're holding: `{ index: Promise<Object>, fetchedAt:
         * <timestamp> }`, or null.  We hold the promise, so requests that
         * come in while it's being fetched share the fetch.
         */
        this.news = null

        this.template = Handlebars.compile(fs.readFileSync(PageMetadataService.TEMPLATE_PATH, 'utf8'))
    }

    /**
     * Render metadata as the tags that go in a page's <head>.  Every value is
     * HTML escaped, since what's in them comes from what people write.
     *
     * @param {Object} metadata The metadata, from one of the get methods.
     *
     * @return {string} The tags.
     */
    renderTags(metadata) {
        return this.template(metadata)
    }

    /**
     * The metadata for a page that doesn't have metadata of its own.
     *
     * @return {Object} The metadata.  See `lib.pageMetadata`.
     */
    getDefaultMetadata() {
        return lib.pageMetadata.buildDefaultMetadata(this.host)
    }

    /**
     * The metadata for the home page.
     *
     * @return {Object} The metadata.
     */
    getRootMetadata() {
        return lib.pageMetadata.buildRootMetadata(this.host)
    }

    /**
     * The metadata for the list of News posts.
     *
     * @return {Object} The metadata.
     */
    getNewsListMetadata() {
        return lib.pageMetadata.buildNewsListMetadata(this.host)
    }

    /**
     * The metadata for a News post.
     *
     * @param {string} slug     The post's slug.
     *
     * @return {Promise<Object|null>} The metadata, or null when there's no
     * post with that slug.
     */
    async getNewsMetadata(slug) {
        let index = await this.getNewsIndex(PageMetadataService.NEWS_MAX_AGE)
        let news = this.newsService.findNews(index, slug)

        // A post that was just published won't be in News we fetched before
        // it was, and the first thing anyone does with a new post is share
        // it.  So when we don't have the post, fetch News again, unless we
        // fetched it in the last few seconds.  That way new posts show up
        // right away, but requests for posts that don't exist can't make us
        // fetch News on every request.
        if ( news === null ) {
            index = await this.getNewsIndex(PageMetadataService.NEWS_MISS_MAX_AGE)
            news = this.newsService.findNews(index, slug)
        }

        if ( news === null ) {
            return null
        }

        return lib.pageMetadata.buildNewsMetadata(this.host, news)
    }

    /**
     * Get the News index, fetching it when we don't have it or what we have
     * is older than `maxAge`.
     *
     * A fetch that fails isn't held on to, so the next request tries again.
     *
     * @param {number} maxAge   The oldest, in milliseconds, the index may be.
     *
     * @return {Promise<Object>} The index.  See NewsService.getIndex().
     */
    async getNewsIndex(maxAge) {
        const now = Date.now()

        if ( this.news === null || now - this.news.fetchedAt > maxAge ) {
            const news = {
                index: this.newsService.getIndex(),
                fetchedAt: now
            }

            news.index.catch(() => {
                if ( this.news === news ) {
                    this.news = null
                }
            })

            this.news = news
        }

        return await this.news.index
    }
}
