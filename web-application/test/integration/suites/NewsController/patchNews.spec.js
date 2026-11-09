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

const { initialize, logout, loginAs } = require('../../../lib/authentication')
const { patchNews, getNews, createNews, cleanupNews } = require('../../../lib/news')

// ============================================================================
// PATCH /news/:slug drives NewsController.patchNews(), which runs, in order:
//   1. authentication                                   -> 401 not-authenticated
//   2. PermissionService.can(user, 'admin', 'Site')     -> 403 not-authorized
//   3. NewsService.getNews(slug), no such post          -> 404 not-found
//   4. NewsSchema.clean() + validate(patch, existing)   -> 400 invalid
//   5. 201 { entity, relations }
//
// A patch changes only the properties it includes.  The slug is the post's
// URL and its key in the index, so it can't be changed.
// ============================================================================

describe('PATCH /news/:slug', function() {
    let admin, moderator, user
    let news = null

    before(async function() {
        admin = await loginAs('user-site-admin')
        moderator = await loginAs('user-site-moderator')
        user = await loginAs('user1')
        news = await createNews(admin.session)
    })

    after(async function() {
        if ( news ) await cleanupNews(admin.session, news.slug)
        await logout(admin.session)
        await logout(moderator.session)
        await logout(user.session)
    })

    const assertUnchanged = async function() {
        const response = await getNews(null, news.slug)
        assert.deepEqual(response.content.entity, news)
    }

    describe('permissions', function() {
        it('Should reject an unauthenticated request with 401', async function() {
            const session = await initialize()
            const response = await patchNews(session, news.slug, { title: 'Hacked' })
            assert.equal(response.status, 401)
            assert.equal(response.content?.error?.type, 'not-authenticated')
            await assertUnchanged()
        })

        it('Should reject a standard user with 403', async function() {
            const response = await patchNews(user.session, news.slug, { title: 'Hacked' })
            assert.equal(response.status, 403)
            assert.equal(response.content?.error?.type, 'not-authorized')
            await assertUnchanged()
        })

        it('Should reject a site moderator with 403', async function() {
            const response = await patchNews(moderator.session, news.slug, { title: 'Hacked' })
            assert.equal(response.status, 403)
            assert.equal(response.content?.error?.type, 'not-authorized')
            await assertUnchanged()
        })

        it('Should check permissions before checking that the post exists', async function() {
            const response = await patchNews(user.session, `01-01-2000-no-such-post-${crypto.randomUUID()}`, { title: 'Hacked' })
            assert.equal(response.status, 403)
        })
    })

    describe('editing a post', function() {
        it('Should change only the properties in the patch', async function() {
            const patch = { title: `Edited ${news.title}`, summary: 'An edited summary.', content: 'Edited **content**.' }

            const response = await patchNews(admin.session, news.slug, patch)
            assert.equal(response.status, 201, JSON.stringify(response.content))

            const expected = { ...news, ...patch }
            assert.deepEqual(response.content.entity, expected)
            assert.deepEqual((await getNews(null, news.slug)).content.entity, expected)
            news = expected
        })

        it('Should change the date', async function() {
            const response = await patchNews(admin.session, news.slug, { date: '01/02/2000' })
            assert.equal(response.status, 201, JSON.stringify(response.content))
            assert.equal(response.content.entity.date, '01/02/2000')
            assert.equal(response.content.entity.slug, news.slug)
            news = response.content.entity
        })

        it('Should accept the slug when it isn\'t changed', async function() {
            const response = await patchNews(admin.session, news.slug, { slug: news.slug, author: 'Another Author' })
            assert.equal(response.status, 201, JSON.stringify(response.content))
            assert.equal(response.content.entity.author, 'Another Author')
            news = response.content.entity
        })

        it('Should return 404 for a post that doesn\'t exist', async function() {
            const response = await patchNews(admin.session, `01-01-2000-no-such-post-${crypto.randomUUID()}`, { title: 'Nope' })
            assert.equal(response.status, 404)
            assert.equal(response.content?.error?.type, 'not-found')
        })
    })

    describe('validation', function() {
        const assertInvalid = async function(patch, expectedType) {
            const response = await patchNews(admin.session, news.slug, patch)
            assert.equal(response.status, 400, `Expected 400 but got ${response.status}: ${JSON.stringify(response.content)}`)
            assert.equal(response.content?.error?.type, 'invalid')
            const types = response.content.error.all.map((error) => error.type)
            assert.ok(types.includes(expectedType), `Expected '${expectedType}' in ${JSON.stringify(types)}`)
            await assertUnchanged()
        }

        it('Should refuse to change the slug', async function() {
            await assertInvalid({ slug: `${news.slug}-moved` }, 'slug:not-allowed')
        })

        it('Should refuse an invalid date', async function() {
            await assertInvalid({ date: '13/01/2000' }, 'date:invalid')
        })

        it('Should refuse a summary longer than a link preview shows', async function() {
            await assertInvalid({ summary: 'a'.repeat(201) }, 'summary:too-long')
        })

        it('Should refuse to empty a property', async function() {
            for(const property of [ 'title', 'date', 'author', 'summary', 'content' ]) {
                await assertInvalid({ [property]: '' }, `${property}:required`)
            }
        })

        it('Should refuse null properties', async function() {
            for(const property of [ 'title', 'date', 'author', 'summary', 'content' ]) {
                await assertInvalid({ [property]: null }, `${property}:null`)
            }
        })
    })
})
