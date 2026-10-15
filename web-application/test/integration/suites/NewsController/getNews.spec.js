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

// ============================================================================
// GET /news/:slug drives NewsController.getNews(): it's public, so anyone may
// read any post, with or without an account.
//   1. NewsService.getNews(slug), no such post          -> 404 not-found
//   2. 200 { entity, relations }
// ============================================================================

describe('GET /news/:slug', function() {
    let admin, user
    let news = null

    before(async function() {
        admin = await loginAs('user-site-admin')
        user = await loginAs('user1')
        news = await createNews(admin.session)
    })

    after(async function() {
        if ( news ) await cleanupNews(admin.session, news.slug)
        await logout(admin.session)
        await logout(user.session)
    })

    it('Should return the post to someone without an account', async function() {
        const response = await getNews(null, news.slug)
        assert.equal(response.status, 200)
        assert.deepEqual(response.content.entity, news)
        assert.deepEqual(response.content.relations, {})
    })

    it('Should return the post to a standard user', async function() {
        const response = await getNews(user.session, news.slug)
        assert.equal(response.status, 200)
        assert.deepEqual(response.content.entity, news)
    })

    it('Should return the post to a site admin', async function() {
        const response = await getNews(admin.session, news.slug)
        assert.equal(response.status, 200)
        assert.deepEqual(response.content.entity, news)
    })

    it('Should return 404 for a post that doesn\'t exist', async function() {
        const response = await getNews(null, `01-01-2000-no-such-post-${crypto.randomUUID()}`)
        assert.equal(response.status, 404)
        assert.equal(response.content?.error?.type, 'not-found')
    })

    it('Should not mistake properties every object has for posts', async function() {
        for(const slug of [ 'constructor', 'toString', 'hasOwnProperty' ]) {
            const response = await getNews(null, slug)
            assert.equal(response.status, 404, `Expected 404 for '${slug}', got ${response.status}.`)
        }
    })
})
