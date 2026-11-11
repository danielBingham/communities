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


/******************************************************************************
 * Link previews, for posts that start a test with a link. Posts made with
 * them: createPost(session, userId, { content: `... ${url}`, linkPreviewId:
 * preview.id }) in posts.js.
 *
 * The server makes a preview by fetching the page the link points to, so a
 * link has to point somewhere real. The tests link to two posts on the
 * Communities News page (NEWS_LINKS): our own site, rather than someone
 * else's, and the server keeps the preview it makes for a URL, so each is
 * only fetched once per environment.
 ******************************************************************************/

const { fetchEndpoint } = require('./fetchEndpoint')

/**
 * Pages the tests link to, and what their previews say.
 */
const NEWS_LINKS = {
    protocols: {
        url: 'https://communities.social/about/news/9-29-2026-protocols-arent-the-answer',
        title: 'Protocols Aren\'t the Answer',
        siteName: 'Communities'
    },
    enshittification: {
        url: 'https://communities.social/about/news/9-30-2026-social-solutions-for-enshittification',
        title: 'Social Solutions for Enshittification',
        siteName: 'Communities'
    }
}

/**
 * Get the preview for a link, making it if the server doesn't have one yet,
 * and return the LinkPreview.
 *
 * @param {Object} session  A user's session, from loginAs().
 * @param {string} url
 */
const createLinkPreview = async function(session, url) {
    const response = await fetchEndpoint('POST', '/link-previews', { session: session, body: { url: url } })
    if ( ! response.ok ) {
        throw new Error(`Failed to get a preview of ${url}: ${response.status} ${JSON.stringify(response.content)}`)
    }
    return response.content.entity
}

module.exports = {
    NEWS_LINKS: NEWS_LINKS,
    createLinkPreview: createLinkPreview
}
