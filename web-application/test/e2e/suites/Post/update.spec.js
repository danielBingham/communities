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
 ******************************************************************************/

const { describe, it, before, after, afterEach } = require('node:test')
const assert = require('node:assert/strict')

const { loginAs, logout } = require('../../../lib/authentication')
const { createPost, deleteAllPostsForUser } = require('../../../lib/posts')
const { makeFriends, clearRelationship } = require('../../../lib/relationships')

const { startBrowser, stopBrowser, openAs, cleanUp } = require('../../lib/browser')
const { openPage, followHeaderLink, logOut, logIn } = require('../../lib/app')
const posts = require('../../lib/posts')
const { eventually } = require('../../lib/wait')

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

    describe('Smoke Test', function() {

        // "As a user, I can edit the text of my post." The post has no image.
        it('As a user, I can edit the text of my post. (text only)', async function() {
            const original = await createPostToEdit('Before the edit')
            const edited = posts.uniqueText('After the edit')
            const { page } = await openAs('user1')

            await openPage(page, '/')
            await posts.editPost(page, posts.findPost(page, original.content))
            await eventually(async () => assert.equal(await posts.postTextbox(page).inputValue(), original.content))
            await posts.postTextbox(page).fill(edited)
            await posts.saveEdit(page)

            // The post's page shows the edit, and so does the feed.
            await posts.findPost(page, edited).waitFor()
            await openPage(page, '/')
            await posts.findPost(page, edited).waitFor()
            assert.equal(await posts.findPost(page, original.content).count(), 0)
        })
    })

    describe('Manual Regression', function() {

        describe('Post Editing', function() {

            // "As a user, I can edit a post with a link." Its text steps:
            // change the text and save, then change it and cancel. They
            // include the one text step of "As a user, I can edit a post with
            // an image.": change the text and cancel.
            it('As a user, I can edit a post with a link. (text only)', async function() {
                const original = await createPostToEdit('Before any edits')
                const saved = posts.uniqueText('An edit to keep')
                const cancelled = posts.uniqueText('An edit to cancel')
                const { page } = await openAs('user1')

                await openPage(page, '/')
                await posts.editPost(page, posts.findPost(page, original.content))
                await posts.postTextbox(page).fill(saved)
                await posts.saveEdit(page)
                await posts.findPost(page, saved).waitFor()

                await posts.editPost(page, posts.findPost(page, saved))
                await posts.postTextbox(page).fill(cancelled)
                await posts.discardPostForm(page)

                // Not updated, here or after a reload.
                await posts.findPost(page, saved).waitFor()
                assert.equal(await page.getByText(cancelled).count(), 0)
                await page.reload()
                await posts.findPost(page, saved).waitFor()
                assert.equal(await page.getByText(cancelled).count(), 0)
            })

            it('As a user, edits to a post I made propagate to shares of that post. (text only)', async function() {
                const original = await createPostToEdit('A post to share', 'public')
                const sharing = posts.uniqueText('Sharing my friend\'s post')
                const edited = posts.uniqueText('The shared post, edited')

                const author = await openAs('user1')
                const sharer = await openAs('user2')

                // User2 shares the post.
                await openPage(sharer.page, `/${user1.fixture.username}/${original.id}`)
                await posts.share(sharer.page, posts.findPost(sharer.page, original.content), sharing)

                // User1 edits it.
                await openPage(author.page, '/')
                await posts.editPost(author.page, posts.findPost(author.page, original.content))
                await posts.postTextbox(author.page).fill(edited)
                await posts.saveEdit(author.page)
                await posts.findPost(author.page, edited).waitFor()

                // User2's share shows the edit.
                await openPage(sharer.page, '/')
                const share = posts.findPost(sharer.page, sharing)
                await posts.findSharedPost(share, edited).waitFor()
                assert.equal(await posts.findSharedPost(share, original.content).count(), 0)
            })
        })

        describe('Post Edit Drafts', function() {

            // "As a user, my edit draft of a post with an image is saved
            // across reloads." and "... with a link ...": their text steps
            // are the same.
            it('As a user, my edit draft of a post is saved across reloads. (text only)', async function() {
                const original = await createPostToEdit('Saved before the draft')
                const draft = posts.uniqueText('An edit in progress')
                const window = await openAs('user1')
                let page = window.page

                await openPage(page, '/')
                await posts.editPost(page, posts.findPost(page, original.content))
                await posts.postTextbox(page).fill(draft)

                // Navigate away from the feed and back. The post is
                // unchanged, but editing it again picks up the draft.
                await followHeaderLink(page, 'Friends')
                await page.waitForURL('/friends')
                await followHeaderLink(page, 'Feeds')
                await posts.editPost(page, posts.findPost(page, original.content))
                await eventually(async () => assert.equal(await posts.postTextbox(page).inputValue(), draft))

                // Close the window, open a new one and load the feed.
                await page.close()
                page = await window.context.newPage()
                await openPage(page, '/')
                await posts.editPost(page, posts.findPost(page, original.content))
                await eventually(async () => assert.equal(await posts.postTextbox(page).inputValue(), draft))

                // Post the draft.
                await posts.saveEdit(page)
                await posts.findPost(page, draft).waitFor()
                assert.equal(await posts.findPost(page, original.content).count(), 0)
            })

            // "As a user, my edit draft of a post with an image is cleared
            // when I log out." and "... with a link ...".
            it('As a user, my edit draft of a post is cleared when I log out. (text only)', async function() {
                const original = await createPostToEdit('Saved before the lost draft')
                const draft = posts.uniqueText('An edit to lose')
                // Its own session, since logging out ends it.
                const { page, fixture } = await openAs('user1', { fresh: true })

                await openPage(page, '/')
                await posts.editPost(page, posts.findPost(page, original.content))
                await posts.postTextbox(page).fill(draft)
                await followHeaderLink(page, 'Feeds')

                await logOut(page)
                await logIn(page, fixture)
                await openPage(page, '/')

                await posts.editPost(page, posts.findPost(page, original.content))
                await eventually(async () => assert.equal(await posts.postTextbox(page).inputValue(), original.content))
            })
        })
    })
})
