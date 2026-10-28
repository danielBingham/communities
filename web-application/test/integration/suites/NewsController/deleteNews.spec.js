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
const { deleteNewsRequest, getNews, createNews, cleanupNews } = require('../../../lib/news')

// ============================================================================
// DELETE /news/:slug drives NewsController.deleteNews(), which runs, in order:
//   1. authentication                                   -> 401 not-authenticated
//   2. PermissionService.can(user, 'admin', 'Site')     -> 403 not-authorized
//   3. NewsService.deleteNews(slug), no such post       -> 404 not-found
//   4. 200 { entity, relations }, echoing the deleted post
// ============================================================================

describe('DELETE /news/:slug', function() {
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

    const assertStillThere = async function() {
        const response = await getNews(null, news.slug)
        assert.equal(response.status, 200)
        assert.deepEqual(response.content.entity, news)
    }

    it('Should reject an unauthenticated request with 401', async function() {
        const session = await initialize()
        const response = await deleteNewsRequest(session, news.slug)
        assert.equal(response.status, 401)
        assert.equal(response.content?.error?.type, 'not-authenticated')
        await assertStillThere()
    })

    it('Should reject a standard user with 403', async function() {
        const response = await deleteNewsRequest(user.session, news.slug)
        assert.equal(response.status, 403)
        assert.equal(response.content?.error?.type, 'not-authorized')
        await assertStillThere()
    })

    it('Should reject a site moderator with 403', async function() {
        const response = await deleteNewsRequest(moderator.session, news.slug)
        assert.equal(response.status, 403)
        assert.equal(response.content?.error?.type, 'not-authorized')
        await assertStillThere()
    })

    it('Should let a site admin delete the post, echoing it back', async function() {
        const doomed = await createNews(admin.session)

        try {
            const response = await deleteNewsRequest(admin.session, doomed.slug)
            assert.equal(response.status, 200, JSON.stringify(response.content))
            assert.deepEqual(response.content.entity, doomed)
            assert.deepEqual(response.content.relations, {})

            assert.equal((await getNews(null, doomed.slug)).status, 404)
        } finally {
            await cleanupNews(admin.session, doomed.slug)
        }
    })

    it('Should leave the other posts alone', async function() {
        const doomed = await createNews(admin.session)

        try {
            assert.equal((await deleteNewsRequest(admin.session, doomed.slug)).status, 200)
            await assertStillThere()
        } finally {
            await cleanupNews(admin.session, doomed.slug)
        }
    })

    it('Should return 404 when deleting the same post twice', async function() {
        const doomed = await createNews(admin.session)

        assert.equal((await deleteNewsRequest(admin.session, doomed.slug)).status, 200)

        const response = await deleteNewsRequest(admin.session, doomed.slug)
        assert.equal(response.status, 404)
        assert.equal(response.content?.error?.type, 'not-found')
    })

    it('Should return 404 for properties every object has', async function() {
        const response = await deleteNewsRequest(admin.session, 'constructor')
        assert.equal(response.status, 404)
    })
})
