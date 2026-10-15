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

const { initialize, logout, loginAs } = require('../../lib/authentication')
const { makeNews, postNewsRequest, getNews, cleanupNews } = require('../../lib/news')

// ============================================================================
// POST /news drives NewsController.postNews(), which runs, in order:
//   1. authentication                                   -> 401 not-authenticated
//   2. PermissionService.can(user, 'admin', 'Site')     -> 403 not-authorized
//   3. NewsSchema.clean() + validate()                  -> 400 invalid
//   4. NewsService.createNews(), slug already taken     -> 409 conflict
//   5. 201 { entity, relations }
//
// Only users with the site role 'admin' or 'superadmin' may post.  Site
// moderators may not.
// ============================================================================

describe('POST /news', function() {
    let admin, moderator, user
    const created = []

    before(async function() {
        admin = await loginAs('user-site-admin')
        moderator = await loginAs('user-site-moderator')
        user = await loginAs('user1')
    })

    after(async function() {
        for(const slug of created) {
            await cleanupNews(admin.session, slug)
        }
        await logout(admin.session)
        await logout(moderator.session)
        await logout(user.session)
    })

    describe('permissions', function() {
        it('Should reject an unauthenticated request with 401', async function() {
            const session = await initialize()
            const news = makeNews()

            const response = await postNewsRequest(session, news)
            assert.equal(response.status, 401)
            assert.equal(response.content?.error?.type, 'not-authenticated')
            assert.equal((await getNews(null, news.slug)).status, 404)
        })

        it('Should reject a standard user with 403', async function() {
            const news = makeNews()

            const response = await postNewsRequest(user.session, news)
            assert.equal(response.status, 403)
            assert.equal(response.content?.error?.type, 'not-authorized')
            assert.equal((await getNews(null, news.slug)).status, 404)
        })

        it('Should reject a site moderator with 403', async function() {
            const news = makeNews()

            const response = await postNewsRequest(moderator.session, news)
            assert.equal(response.status, 403)
            assert.equal(response.content?.error?.type, 'not-authorized')
            assert.equal((await getNews(null, news.slug)).status, 404)
        })

        it('Should check permissions before validating', async function() {
            const response = await postNewsRequest(user.session, { title: '' })
            assert.equal(response.status, 403)
        })
    })

    describe('creating a post', function() {
        it('Should let a site admin post, and return the post', async function() {
            const news = makeNews()
            created.push(news.slug)

            const response = await postNewsRequest(admin.session, news)
            assert.equal(response.status, 201, JSON.stringify(response.content))
            assert.deepEqual(response.content.entity, news)
            assert.deepEqual(response.content.relations, {})

            const fetched = await getNews(null, news.slug)
            assert.equal(fetched.status, 200)
            assert.deepEqual(fetched.content.entity, news)
        })

        it('Should drop properties that aren\'t part of a post', async function() {
            const news = makeNews()
            created.push(news.slug)

            const response = await postNewsRequest(admin.session, { ...news, id: 5, userId: admin.user.id })
            assert.equal(response.status, 201, JSON.stringify(response.content))
            assert.deepEqual(Object.keys(response.content.entity).sort(), [ 'author', 'content', 'date', 'slug', 'title' ])
        })

        it('Should refuse a slug that\'s already taken with 409, leaving the original', async function() {
            const news = makeNews()
            created.push(news.slug)
            assert.equal((await postNewsRequest(admin.session, news)).status, 201)

            const response = await postNewsRequest(admin.session, { ...news, title: 'A Different Title' })
            assert.equal(response.status, 409)
            assert.equal(response.content?.error?.type, 'conflict')

            const fetched = await getNews(null, news.slug)
            assert.equal(fetched.content.entity.title, news.title)
        })
    })

    describe('validation', function() {
        const assertInvalid = async function(submission, expectedType) {
            const response = await postNewsRequest(admin.session, submission)
            if ( response.status === 201 ) {
                created.push(submission.slug)
            }

            assert.equal(response.status, 400, `Expected 400 but got ${response.status}: ${JSON.stringify(response.content)}`)
            assert.equal(response.content?.error?.type, 'invalid')
            const types = response.content.error.all.map((error) => error.type)
            assert.ok(types.includes(expectedType), `Expected '${expectedType}' in ${JSON.stringify(types)}`)
        }

        for(const property of [ 'title', 'slug', 'date', 'author', 'content' ]) {
            it(`Should require ${property}`, async function() {
                const news = makeNews()
                delete news[property]
                await assertInvalid(news, `${property}:required`)
            })

            it(`Should refuse an empty ${property}`, async function() {
                await assertInvalid(makeNews({ [property]: '' }), `${property}:required`)
            })

            it(`Should refuse a non-string ${property}`, async function() {
                await assertInvalid(makeNews({ [property]: 12 }), `${property}:invalid-type`)
            })
        }

        it('Should refuse a date that isn\'t MM/DD/YYYY', async function() {
            await assertInvalid(makeNews({ date: '2000-01-01' }), 'date:invalid')
        })

        it('Should refuse a date that isn\'t on the calendar', async function() {
            await assertInvalid(makeNews({ date: '02/30/2000' }), 'date:invalid')
        })

        it('Should refuse a slug that isn\'t lowercase words separated by hyphens', async function() {
            for(const slug of [ 'Has-Capitals', 'has spaces', 'has_underscores', '../escape', 'trailing-' ]) {
                await assertInvalid(makeNews({ slug: slug }), 'slug:invalid')
            }
        })

        it('Should refuse content that is only whitespace', async function() {
            await assertInvalid(makeNews({ content: '   \n\n  ' }), 'content:required')
        })

        it('Should refuse an empty body', async function() {
            await assertInvalid({}, 'title:required')
        })
    })
})
