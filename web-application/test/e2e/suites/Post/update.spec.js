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
 * Update Post: documentation/testing/test-cases/Post/update.md
 *
 * Every Smoke Test and Manual Regression case here edits a post with an
 * image or a link, so these run their text half only ("(text only)"): the
 * posts have text and nothing else. Where an image case and a link case have
 * the same text steps, one test covers both. The Full Regression cases are
 * the integration tests'.
 *
 * Each test is tagged with every suite it's in (see ../../lib/suites.js):
 * all of them 'full-regression', and the Smoke Test's cases 'smoke-test'
 * too.
 ******************************************************************************/

const { describe, it, before, after, afterEach } = require('node:test')
const assert = require('node:assert/strict')

const { loginAs, logout } = require('../../../lib/authentication')
const { createPost, deleteAllPostsForUser } = require('../../../lib/posts')
const { makeFriends, clearRelationship } = require('../../../lib/relationships')

const { startBrowser, stopBrowser, openAs, cleanUp } = require('../../lib/browser')
const { checkSuite } = require('../../lib/suites')
const { openPage, followHeaderLink, logOut, logIn } = require('../../lib/app')
const posts = require('../../lib/posts')

describe('Update Post', function() {

    // API sessions, for setting up and cleaning up.
    let user1 = null
    let user2 = null

    before(async function() {
        await startBrowser()

        user1 = await loginAs('user1')
        user2 = await loginAs('user2')

        // User2 is User1's friend.
        await clearRelationship(user1.session, user1.user.id, user2.session, user2.user.id)
        await makeFriends(user1.session, user1.user.id, user2.session, user2.user.id)

        await deleteAllPostsForUser(user1.session, user1.user.id)
        await deleteAllPostsForUser(user2.session, user2.user.id)
    })

    afterEach(async function(t) {
        await cleanUp(t)
        checkSuite(t)
    })

    after(async function() {
        await stopBrowser()

        if ( user1 ) {
            await deleteAllPostsForUser(user1.session, user1.user.id)
            await deleteAllPostsForUser(user2.session, user2.user.id)
            await clearRelationship(user1.session, user1.user.id, user2.session, user2.user.id)
            await logout(user1.session)
        }
        if ( user2 ) await logout(user2.session)
    })

    // A post of User1's to edit, made through the API.
    const createPostToEdit = async function(label, visibility = 'private') {
        return await createPost(user1.session, user1.user.id, {
            visibility: visibility,
            content: posts.uniqueText(label)
        })
    }

    // "As a user, I can edit the text of my post." The post has no image.
    it('As a user, I can edit the text of my post. (text only)', { tags: [ 'smoke-test', 'full-regression' ] }, async function() {
        const original = await createPostToEdit('Before the edit')
        const edited = posts.uniqueText('After the edit')
        const { page } = await openAs('user1')
        const post = posts.getPostById(page, original.id)
        const textbox = posts.getPostFormTextbox(page)

        await openPage(page, '/')
        await posts.waitForPostList(page)
        assert.equal(await posts.getPostContent(post).innerText(), original.content)

        // The form starts with the post's text.
        await posts.editPost(page, post)
        assert.equal(await textbox.inputValue(), original.content)
        await textbox.fill(edited)
        await posts.saveEdit(page)

        // The post's page shows the edit, and so does the feed.
        await posts.waitForPermalinkPage(page)
        assert.equal(await posts.getPostContent(post).innerText(), edited)

        await openPage(page, '/')
        await posts.waitForPostList(page)
        assert.equal(await posts.getPostContent(post).innerText(), edited)
        assert.equal(await page.getByText(original.content).count(), 0)
    })

    describe('Post Editing', function() {

        // "As a user, I can edit a post with a link." Its text steps:
        // change the text and save, then change it and cancel. They
        // include the one text step of "As a user, I can edit a post with
        // an image.": change the text and cancel.
        it('As a user, I can edit a post with a link. (text only)', { tags: [ 'full-regression' ] }, async function() {
            const original = await createPostToEdit('Before any edits')
            const saved = posts.uniqueText('An edit to keep')
            const cancelled = posts.uniqueText('An edit to cancel')
            const { page } = await openAs('user1')
            const post = posts.getPostById(page, original.id)
            const textbox = posts.getPostFormTextbox(page)

            await openPage(page, '/')
            await posts.waitForPostList(page)

            // Change the text and save: it's updated.
            await posts.editPost(page, post)
            await textbox.fill(saved)
            await posts.saveEdit(page)
            await posts.waitForPermalinkPage(page)
            assert.equal(await posts.getPostContent(post).innerText(), saved)

            // Change it and cancel: it isn't, here or after a reload.
            await posts.editPost(page, post)
            await textbox.fill(cancelled)
            await posts.discardPostForm(page)
            await posts.waitForPermalinkPage(page)
            assert.equal(await posts.getPostContent(post).innerText(), saved)
            assert.equal(await page.getByText(cancelled).count(), 0)

            await page.reload()
            await posts.waitForPermalinkPage(page)
            assert.equal(await posts.getPostContent(post).innerText(), saved)
            assert.equal(await page.getByText(cancelled).count(), 0)
        })

        it('As a user, edits to a post I made propagate to shares of that post. (text only)', { tags: [ 'full-regression' ] }, async function() {
            const original = await createPostToEdit('A post to share', 'public')
            const sharing = posts.uniqueText('Sharing my friend\'s post')
            const edited = posts.uniqueText('The shared post, edited')

            const author = await openAs('user1')
            const sharer = await openAs('user2')

            // User2 shares the post.
            await openPage(sharer.page, `/${user1.fixture.username}/${original.id}`)
            await posts.waitForPermalinkPage(sharer.page)
            await posts.share(sharer.page, posts.getPostById(sharer.page, original.id), sharing)

            // User1 edits it.
            const post = posts.getPostById(author.page, original.id)
            await openPage(author.page, '/')
            await posts.waitForPostList(author.page)
            await posts.editPost(author.page, post)
            await posts.getPostFormTextbox(author.page).fill(edited)
            await posts.saveEdit(author.page)
            await posts.waitForPermalinkPage(author.page)
            assert.equal(await posts.getPostContent(post).innerText(), edited)

            // User2's share still has their own text, and the post it
            // shares shows the edit.
            await openPage(sharer.page, '/')
            await posts.waitForPostList(sharer.page)
            const share = posts.getPostByText(sharer.page, sharing)
            assert.equal(await share.count(), 1, `Expected User2's share in their feed.`)
            assert.equal(await posts.getPostContent(share).innerText(), sharing)

            const shared = posts.getSharedPost(share)
            await shared.waitFor()
            assert.equal(await shared.getAttribute('id'), original.id)
            assert.equal(await posts.getPostContent(shared).innerText(), edited)
        })
    })

    describe('Post Edit Drafts', function() {

        // "As a user, my edit draft of a post with an image is saved
        // across reloads." and "... with a link ...": their text steps
        // are the same.
        it('As a user, my edit draft of a post is saved across reloads. (text only)', { tags: [ 'full-regression' ] }, async function() {
            const original = await createPostToEdit('Saved before the draft')
            const draft = posts.uniqueText('An edit in progress')
            const window = await openAs('user1')
            let page = window.page
            let post = posts.getPostById(page, original.id)

            await openPage(page, '/')
            await posts.waitForPostList(page)
            await posts.editPost(page, post)
            await posts.getPostFormTextbox(page).fill(draft)

            // Navigate away from the feed and back. The post is
            // unchanged, but editing it again picks up the draft.
            await followHeaderLink(page, 'Friends')
            await page.waitForURL('/friends')
            await followHeaderLink(page, 'Feeds')
            await posts.waitForPostList(page)
            assert.equal(await posts.getPostContent(post).innerText(), original.content)

            await posts.editPost(page, post)
            assert.equal(await posts.getPostFormTextbox(page).inputValue(), draft)

            // Close the window, open a new one and load the feed: the same.
            await page.close()
            page = await window.context.newPage()
            post = posts.getPostById(page, original.id)
            await openPage(page, '/')
            await posts.waitForPostList(page)
            assert.equal(await posts.getPostContent(post).innerText(), original.content)

            await posts.editPost(page, post)
            assert.equal(await posts.getPostFormTextbox(page).inputValue(), draft)

            // Post the draft: the post is updated.
            await posts.saveEdit(page)
            await posts.waitForPermalinkPage(page)
            assert.equal(await posts.getPostContent(post).innerText(), draft)
            assert.equal(await page.getByText(original.content).count(), 0)
        })

        // "As a user, my edit draft of a post with an image is cleared
        // when I log out." and "... with a link ...".
        it('As a user, my edit draft of a post is cleared when I log out. (text only)', { tags: [ 'full-regression' ] }, async function() {
            const original = await createPostToEdit('Saved before the lost draft')
            const draft = posts.uniqueText('An edit to lose')
            // Its own session, since logging out ends it.
            const { page, fixture } = await openAs('user1', { fresh: true })
            const post = posts.getPostById(page, original.id)

            await openPage(page, '/')
            await posts.waitForPostList(page)
            await posts.editPost(page, post)
            await posts.getPostFormTextbox(page).fill(draft)
            await followHeaderLink(page, 'Feeds')
            await posts.waitForPostList(page)

            await logOut(page)
            await logIn(page, fixture)
            await openPage(page, '/')

            // The post is unchanged, and editing it starts from its saved
            // text, not the draft.
            await posts.waitForPostList(page)
            assert.equal(await posts.getPostContent(post).innerText(), original.content)

            await posts.editPost(page, post)
            assert.equal(await posts.getPostFormTextbox(page).inputValue(), original.content)
        })
    })
})
