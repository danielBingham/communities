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
const { getNews, createNews, cleanupNews } = require('../../lib/news')
const { fetchPage } = require('../../lib/pages')

// ============================================================================
// GET /about/news/:slug and /about/news (the pages, not the API) drive
// PageController.getNews() and getNewsList(): index.html with the page's
// metadata in its <head>, so link previews show the post, and the post
// itself, so the client doesn't request it.  Crawlers don't log in, so
// neither do these requests.
//   1. NewsService.getNews(slug), no such post  -> 404, defaults, no post
//   2. 200, the post's title, summary, canonical URL and og: tags, and the
//      post as GET /news/:slug returns it
//   3. /about/news: the News page's metadata, and no posts
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

        assert.equal(page.description, news.summary)
        assert.equal(page.og('og:description'), page.description)

        const url = new URL(`/about/news/${news.slug}`, page.canonical).href
        assert.equal(page.canonical, url)
        assert.equal(page.og('og:url'), url)
        assert.ok(page.og('og:image')?.endsWith('/social-sharing-image.png'), `Unexpected og:image: ${page.og('og:image')}`)

        // Still the app.
        assert.match(page.html, /<div id="root"><\/div>/)
    })

    it('Should preload the post exactly as the API returns it', async function() {
        const page = await fetchPage(`/about/news/${encodeURIComponent(news.slug)}`)
        const api = await getNews(null, news.slug)

        assert.equal(api.status, 200)
        assert.deepEqual(page.preloaded, { news: { [news.slug]: api.content.entity } })
    })

    it('Should return 404 with the default metadata, and no post, for a post that doesn\'t exist', async function() {
        const slug = `01-01-2000-no-such-post-${crypto.randomUUID()}`
        const page = await fetchPage(`/about/news/${slug}`)

        assert.equal(page.status, 404)
        assert.equal(page.title, 'Communities -- Cooperative Social Media')
        assert.equal(page.canonical, null)
        assert.equal(page.og('og:url'), null)
        assert.equal(page.preloaded, null)
        assert.match(page.html, /<div id="root"><\/div>/)
    })

    it('Should render the News page\'s metadata, without preloading posts', async function() {
        const page = await fetchPage('/about/news')

        assert.equal(page.status, 200)
        assert.equal(page.title, 'News -- Communities')
        assert.ok(page.canonical?.endsWith('/about/news'), `Unexpected canonical URL: ${page.canonical}`)
        assert.equal(page.preloaded, null)
    })
})
