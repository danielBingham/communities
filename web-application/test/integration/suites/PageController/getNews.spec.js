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
const { describe, it, before, after } = require('node:test')
const assert = require('node:assert/strict')

const { logout, loginAs } = require('../../lib/authentication')
const { getNews, getNewsList, createNews, cleanupNews } = require('../../lib/news')
const { fetchPage } = require('../../lib/pages')

// ============================================================================
// GET /about/news/:slug and /about/news (the pages, not the API) drive
// PageController.getNews() and getNewsList(): index.html with the page's
// metadata in its <head>, so link previews show the post, and the API
// responses the page would request, so the client doesn't request them.
// Crawlers don't log in, so neither do these requests.
//   1. NewsService.getNews(slug), no such post  -> 404, defaults, the API's 404
//   2. 200, the post's title, description, canonical URL and og: tags, and
//      the API's response for GET /news/:slug
//   3. /about/news: the API's response for GET /news?page=1
// ============================================================================

describe('GET /about/news/:slug (page)', function() {
    let admin = null
    let news = null

    before(async function() {
        admin = await loginAs('user-site-admin')

        // Created just before it's requested, the way a post is published and
        // then shared, which is when its link preview matters most.
        news = await createNews(admin.session)
    })

    after(async function() {
        if ( news ) await cleanupNews(admin.session, news.slug)
        await logout(admin.session)
    })

    it('Should render the post\'s metadata into the page', async function() {
        const page = await fetchPage(`/about/news/${encodeURIComponent(news.slug)}`)

        assert.equal(page.status, 200)
        assert.equal(page.title, `${news.title} -- Communities`)
        assert.equal(page.og('og:title'), news.title)
        assert.equal(page.og('og:type'), 'article')
        assert.equal(page.og('article:published_time'), '2000-01-01')

        // makeNews() content starts with a heading, which the description
        // leaves out.
        assert.equal(page.description, 'Created by the integration test suite. Markdown and all.')
        assert.equal(page.og('og:description'), page.description)

        const url = new URL(`/about/news/${news.slug}`, page.canonical).href
        assert.equal(page.canonical, url)
        assert.equal(page.og('og:url'), url)
        assert.ok(page.og('og:image')?.endsWith('/social-sharing-image.jpg'), `Unexpected og:image: ${page.og('og:image')}`)

        // Still the app.
        assert.match(page.html, /<div id="root"><\/div>/)
    })

    it('Should preload exactly what the API sends for the post', async function() {
        const page = await fetchPage(`/about/news/${encodeURIComponent(news.slug)}`)
        const api = await getNews(null, news.slug)

        assert.deepEqual(Object.keys(page.preloaded), [ `GET /news/${news.slug}` ])
        assert.deepEqual(page.preloaded[`GET /news/${news.slug}`], { status: api.status, body: api.content })
    })

    it('Should return 404 with the default metadata and the API\'s 404 for a post that doesn\'t exist', async function() {
        const slug = `01-01-2000-no-such-post-${crypto.randomUUID()}`
        const page = await fetchPage(`/about/news/${slug}`)

        assert.equal(page.status, 404)
        assert.equal(page.title, 'Communities -- Cooperative Social Media')
        assert.equal(page.canonical, null)
        assert.equal(page.og('og:url'), null)
        assert.match(page.html, /<div id="root"><\/div>/)

        const api = await getNews(null, slug)
        assert.deepEqual(page.preloaded[`GET /news/${slug}`], { status: api.status, body: api.content })
    })

    it('Should render the News page\'s metadata and preload its first page of posts', async function() {
        const page = await fetchPage('/about/news')

        assert.equal(page.status, 200)
        assert.equal(page.title, 'News -- Communities')
        assert.ok(page.canonical?.endsWith('/about/news'), `Unexpected canonical URL: ${page.canonical}`)

        const api = await getNewsList(null, { page: 1 })
        assert.deepEqual(page.preloaded['GET /news?page=1'], { status: api.status, body: api.content })
    })
})
