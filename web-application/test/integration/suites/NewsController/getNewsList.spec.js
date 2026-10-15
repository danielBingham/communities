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
const { getNewsList, createNews, cleanupNews } = require('../../lib/news')

// ============================================================================
// GET /news drives NewsController.getNewsList(): it's public, and returns one
// page of 5 posts, newest first, as { dictionary, list, meta, relations }.
// `?page=N` picks the page; anything that isn't a positive number is the
// first page.
//
// The environment may already have posts of its own, so these tests give
// theirs dates far in the future, which puts them at the front of the list.
// ============================================================================

const PAGE_SIZE = 5

describe('GET /news', function() {
    let admin, user
    const created = []

    before(async function() {
        admin = await loginAs('user-site-admin')
        user = await loginAs('user1')

        // Six posts, created out of date order.  Two share a date: the one
        // created last comes first.
        const dates = [ '12/30/2999', '12/31/2999', '12/27/2999', '12/29/2999', '12/28/2999', '12/29/2999' ]
        for(const date of dates) {
            const unique = crypto.randomUUID()
            created.push(await createNews(admin.session, {
                date: date,
                slug: `${date.replaceAll('/', '-')}-integration-test-news-${unique}`
            }))
        }
    })

    after(async function() {
        for(const news of created) {
            await cleanupNews(admin.session, news.slug)
        }
        await logout(admin.session)
        await logout(user.session)
    })

    const expectedOrder = () => [ created[1], created[0], created[5], created[3], created[4], created[2] ].map((news) => news.slug)

    it('Should return the first page of 5 posts, newest first, to someone without an account', async function() {
        const response = await getNewsList(null)
        assert.equal(response.status, 200)

        const { dictionary, list, meta, relations } = response.content
        assert.deepEqual(list, expectedOrder().slice(0, PAGE_SIZE))
        for(const slug of list) {
            assert.deepEqual(dictionary[slug], created.find((news) => news.slug === slug))
        }
        assert.deepEqual(Object.keys(dictionary).sort(), [ ...list ].sort())
        assert.deepEqual(relations, {})

        assert.equal(meta.page, 1)
        assert.equal(meta.pageSize, PAGE_SIZE)
        assert.ok(meta.count >= created.length)
        assert.equal(meta.numberOfPages, Math.ceil(meta.count / PAGE_SIZE))
    })

    it('Should return the same page to a standard user', async function() {
        const response = await getNewsList(user.session)
        assert.equal(response.status, 200)
        assert.deepEqual(response.content.list, expectedOrder().slice(0, PAGE_SIZE))
    })

    it('Should return the page named by ?page=N', async function() {
        const response = await getNewsList(null, { page: 2 })
        assert.equal(response.status, 200)
        assert.equal(response.content.meta.page, 2)
        assert.equal(response.content.list[0], expectedOrder()[PAGE_SIZE])
        assert.ok(response.content.list.length <= PAGE_SIZE)
    })

    it('Should treat a page that isn\'t a positive number as the first page', async function() {
        for(const page of [ '0', '-1', 'abc' ]) {
            const response = await getNewsList(null, { page: page })
            assert.equal(response.status, 200)
            assert.equal(response.content.meta.page, 1)
            assert.deepEqual(response.content.list, expectedOrder().slice(0, PAGE_SIZE))
        }
    })

    it('Should return an empty page past the last one', async function() {
        const first = await getNewsList(null)
        const response = await getNewsList(null, { page: first.content.meta.numberOfPages + 1 })
        assert.equal(response.status, 200)
        assert.deepEqual(response.content.list, [])
        assert.deepEqual(response.content.dictionary, {})
    })
})
