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

const { fetchEndpoint } = require('./fetchEndpoint')

// News posts live in a single index file in the environment's storage rather
// than the database, and the News page is public.  So every post these
// helpers create gets a unique slug, and every suite deletes what it creates.

// A News post submission with a unique slug.  `overrides` may set any field.
const makeNews = function(overrides = {}) {
    const unique = crypto.randomUUID()

    return {
        title: `Integration Test News ${unique}`,
        slug: `01-01-2000-integration-test-news-${unique}`,
        date: '01/01/2000',
        author: 'The Integration Test Suite',
        summary: 'A post created by the integration test suite.',
        content: `# A Test Post\n\nCreated by the integration test suite.  **Markdown** and all.`,
        ...overrides
    }
}

// The raw fetchEndpoint results ({ status, ok, content, raw }).  These don't
// throw on a non-2xx, so the suites can assert on refusals.
const getNewsList = async function(session, query) {
    const queryString = query ? `?${new URLSearchParams(query).toString()}` : ''
    return await fetchEndpoint('GET', `/news${queryString}`, { session: session })
}

const getNews = async function(session, slug) {
    return await fetchEndpoint('GET', `/news/${encodeURIComponent(slug)}`, { session: session })
}

const postNewsRequest = async function(session, news) {
    return await fetchEndpoint('POST', '/news', { session: session, body: news })
}

const patchNews = async function(session, slug, patch) {
    return await fetchEndpoint('PATCH', `/news/${encodeURIComponent(slug)}`, { session: session, body: patch })
}

const deleteNewsRequest = async function(session, slug) {
    return await fetchEndpoint('DELETE', `/news/${encodeURIComponent(slug)}`, { session: session })
}

// Create a post as `session` (a site admin) and return the created entity.
const createNews = async function(session, overrides = {}) {
    const response = await postNewsRequest(session, makeNews(overrides))
    if ( ! response.ok ) {
        throw new Error(`Failed to create News: ${response.status} ${JSON.stringify(response.content)}`)
    }

    return response.content.entity
}

// Delete a post for teardown.  Never throws, so it's safe in an `after` or a
// `finally`, including for posts a test already deleted.
const cleanupNews = async function(session, slug) {
    try {
        await deleteNewsRequest(session, slug)
    } catch (error) {
        // Already gone.
    }
}

module.exports = {
    makeNews: makeNews,
    getNewsList: getNewsList,
    getNews: getNews,
    postNewsRequest: postNewsRequest,
    patchNews: patchNews,
    deleteNewsRequest: deleteNewsRequest,
    createNews: createNews,
    cleanupNews: cleanupNews
}
