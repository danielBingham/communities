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

/**
 * Builds the metadata for a page -- its title, description and social
 * sharing (Open Graph) details -- and renders it as the tags that go in the
 * page's <head>.
 *
 * Link previews are built by crawlers that don't run JavaScript, so the
 * server renders these tags into the index.html it sends (see
 * `web-application/server/controllers/PageController.js`, which gets the
 * entities a page needs and hands them to the methods here).  The metadata
 * itself is built by `lib.pageMetadata` in `@communities/shared`, so that the
 * client can use the same functions later.
 */
module.exports = class PageMetadataService {

    /**
     * The template for the tags.
     */
    static TEMPLATE_PATH = path.join(__dirname, 'page-metadata', 'page-metadata.hbs')

    constructor(core) {
        this.core = core
        this.host = core.config.host

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
     * @param {Object} news     The post, from NewsService.
     *
     * @return {Object} The metadata.
     */
    getNewsMetadata(news) {
        return lib.pageMetadata.buildNewsMetadata(this.host, news)
    }
}
