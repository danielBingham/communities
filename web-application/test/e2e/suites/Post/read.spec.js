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
 * Read Post: documentation/testing/test-cases/Post/read.md
 *
 * The Smoke Test and Manual Regression cases. The integration tests cover the
 * Smoke Test's permissions at the API (PostController/getPost.spec.js); these
 * check the pages show what the API allows. The Full Regression cases are the
 * integration tests'.
 *
 * Each test is tagged with its suite, from the section its case is in:
 * 'smoke-test' for the Smoke Test, 'full-regression' for the rest (see
 * ../../lib/suites.js).
 ******************************************************************************/

const { describe, it, before, after, afterEach } = require('node:test')
const assert = require('node:assert/strict')

const { loginAs, logout } = require('../../../lib/authentication')
const { createPost, deleteAllPostsForUser } = require('../../../lib/posts')
const { makeFriends, clearRelationship } = require('../../../lib/relationships')

const { startBrowser, stopBrowser, openAs, cleanUp } = require('../../lib/browser')
const { checkSuite } = require('../../lib/suites')
const { openPage } = require('../../lib/app')
const posts = require('../../lib/posts')

describe('Read Post', function() {

    // API sessions, for setting up and cleaning up.
    let user1 = null
    let user2 = null
    let user3 = null

    // User1's posts, made through the API before the tests.
    let publicPost = null
    let privatePost = null

    before(async function() {
        await startBrowser()

        user1 = await loginAs('user1')
        user2 = await loginAs('user2')
        user3 = await loginAs('user3')

        // User2 is User1's friend; User3 is a stranger.
        await clearRelationship(user1.session, user1.user.id, user2.session, user2.user.id)
        await clearRelationship(user1.session, user1.user.id, user3.session, user3.user.id)
        await makeFriends(user1.session, user1.user.id, user2.session, user2.user.id)

        await deleteAllPostsForUser(user1.session, user1.user.id)
        publicPost = await createPost(user1.session, user1.user.id, {
            visibility: 'public',
            content: posts.uniqueText('A public post')
        })
        privatePost = await createPost(user1.session, user1.user.id, {
            visibility: 'private',
            content: posts.uniqueText('A private post')
        })
    })

    afterEach(async function(t) {
        await cleanUp(t)
        checkSuite(t)
    })

    after(async function() {
        await stopBrowser()

        if ( user1 ) {
            await deleteAllPostsForUser(user1.session, user1.user.id)
            await clearRelationship(user1.session, user1.user.id, user2.session, user2.user.id)
            await logout(user1.session)
        }
        if ( user2 ) await logout(user2.session)
        if ( user3 ) await logout(user3.session)
    })


    const permalinkOf = (post) => `/${user1.fixture.username}/${post.id}`

    it('A user can see a public post.', { tags: [ 'smoke-test' ] }, async function() {
        // A stranger: the user least likely to see it.
        const { page } = await openAs('user3')
        const post = posts.getPostById(page, publicPost.id)

        // On its permalink...
        await openPage(page, permalinkOf(publicPost))
        await posts.waitForPermalinkPage(page)
        assert.equal(await post.count(), 1, `Expected the public post on its permalink.`)
        assert.equal(await posts.getPostContent(post).innerText(), publicPost.content)

        // ... and on User1's profile.
        await openPage(page, `/${user1.fixture.username}`)
        await posts.waitForPostList(page)
        assert.equal(await post.count(), 1, `Expected the public post on User1's profile.`)
        assert.equal(await posts.getPostContent(post).innerText(), publicPost.content)
    })

    it(`A friend of a user can see that user's private post.`, { tags: [ 'smoke-test' ] }, async function() {
        const { page } = await openAs('user2')
        const post = posts.getPostById(page, privatePost.id)

        // In their feed...
        await openPage(page, '/')
        await posts.waitForPostList(page)
        assert.equal(await post.count(), 1, `Expected the private post in User2's feed.`)
        assert.equal(await posts.getPostContent(post).innerText(), privatePost.content)

        // ... and on its permalink.
        await openPage(page, permalinkOf(privatePost))
        await posts.waitForPermalinkPage(page)
        assert.equal(await post.count(), 1, `Expected the private post on its permalink.`)
        assert.equal(await posts.getPostContent(post).innerText(), privatePost.content)
    })

    it(`A stranger cannot see a user's private post.`, { tags: [ 'smoke-test' ] }, async function() {
        const { page } = await openAs('user3')

        // Its permalink shows the 404 instead.
        await openPage(page, permalinkOf(privatePost))
        await posts.waitForPermalinkPage(page)
        assert.equal(await posts.getPostNotFoundError(page).isVisible(), true, `Expected the 404 on the private post's permalink.`)
        assert.equal(await posts.getPostById(page, privatePost.id).count(), 0)
        assert.equal(await page.getByText(privatePost.content).count(), 0)

        // On User1's profile, the public post shows and the private one
        // doesn't.
        await openPage(page, `/${user1.fixture.username}`)
        await posts.waitForPostList(page)
        const shown = posts.getPostById(page, publicPost.id)
        assert.equal(await shown.count(), 1, `Expected the public post on User1's profile.`)
        assert.equal(await posts.getPostContent(shown).innerText(), publicPost.content)
        assert.equal(await posts.getPostById(page, privatePost.id).count(), 0)
        assert.equal(await page.getByText(privatePost.content).count(), 0)
    })

    it('As a user, a post I cannot see is not reachable by permalink.', { tags: [ 'full-regression' ] }, async function() {
        const author = await openAs('user1')
        const stranger = await openAs('user3')
        const text = posts.uniqueText('A private post to keep to friends')

        // Make a private post (the form's default) and copy its
        // permalink.
        await openPage(author.page, '/')
        await posts.openPostForm(author.page)
        await posts.getPostFormTextbox(author.page).fill(text)
        await posts.submitPost(author.page, '/')

        await posts.waitForPostList(author.page)
        const post = posts.getPostByText(author.page, text)
        assert.equal(await post.count(), 1, `Expected the post on User1's feed.`)
        const id = await post.getAttribute('id')
        const permalink = await posts.getPermalink(post)
        assert.equal(permalink, `/${user1.fixture.username}/${id}`)

        // The stranger gets the 404, and not the post.
        await openPage(stranger.page, permalink)
        await posts.waitForPermalinkPage(stranger.page)
        assert.equal(await posts.getPostNotFoundError(stranger.page).isVisible(), true, `Expected the 404 on the permalink.`)
        assert.equal(await posts.getPostById(stranger.page, id).count(), 0)
        assert.equal(await stranger.page.getByText(text).count(), 0)
    })
})
