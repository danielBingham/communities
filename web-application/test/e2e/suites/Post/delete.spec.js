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
 * Delete Post: documentation/testing/test-cases/Post/delete.md
 *
 * Every Smoke Test and Manual Regression case here deletes a post with an
 * image or a link, so these run them with text only ("(text only)"): the
 * posts have text and nothing else, which makes each image case the same as
 * its link case, and one test covers both. The Full Regression cases are the
 * integration tests'.
 ******************************************************************************/

const { describe, it, before, after, afterEach } = require('node:test')
const assert = require('node:assert/strict')

const { loginAs, logout } = require('../../../lib/authentication')
const { createPost, deleteAllPostsForUser } = require('../../../lib/posts')
const { makeFriends, clearRelationship } = require('../../../lib/relationships')

const { startBrowser, stopBrowser, openAs, cleanUp } = require('../../lib/browser')
const { openPage } = require('../../lib/app')
const posts = require('../../lib/posts')

describe('Delete Post', function() {

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

    // A post of User1's to delete, made through the API, and its permalink.
    const createPostToDelete = async function(label, visibility) {
        const post = await createPost(user1.session, user1.user.id, {
            visibility: visibility,
            content: posts.uniqueText(label)
        })
        return { ...post, permalink: `/${user1.fixture.username}/${post.id}` }
    }

    // As User1, delete the post from the feed, and confirm it's gone from
    // its permalink.
    const deleteFromFeed = async function(page, post) {
        await openPage(page, '/')
        await posts.deletePost(page, posts.findPost(page, post.content))

        await openPage(page, post.permalink)
        await posts.postNotFound(page).waitFor()
        assert.equal(await page.getByText(post.content).count(), 0)
    }

    describe('Smoke Test', function() {

        // "As a user, I can delete a private post with an image." and, in the
        // Manual Regression, "... with a link."
        it('As a user, I can delete a private post. (text only)', async function() {
            const post = await createPostToDelete('A private post to delete', 'private')
            const author = await openAs('user1')
            const friend = await openAs('user2')

            // User2 comments and reacts.
            await openPage(friend.page, post.permalink)
            const friendsView = posts.findPost(friend.page, post.content)
            await posts.react(friendsView, 'Like')
            await posts.comment(friendsView, posts.uniqueText('A comment on a doomed post'))

            await deleteFromFeed(author.page, post)

            // Gone for User2 too.
            await openPage(friend.page, post.permalink)
            await posts.postNotFound(friend.page).waitFor()
            assert.equal(await friend.page.getByText(post.content).count(), 0)
        })
    })

    describe('Manual Regression', function() {

        // "As a user, I can delete a public post with an image that has been
        // shared." and "... with a link ...".
        it('As a user, I can delete a public post that has been shared. (text only)', async function() {
            const post = await createPostToDelete('A public post to share and delete', 'public')
            const sharing = posts.uniqueText('Sharing a doomed post')
            const author = await openAs('user1')
            const friend = await openAs('user2')

            // User2 comments, reacts and shares.
            await openPage(friend.page, post.permalink)
            const friendsView = posts.findPost(friend.page, post.content)
            await posts.react(friendsView, 'Like')
            await posts.comment(friendsView, posts.uniqueText('A comment on a doomed post'))
            await posts.share(friend.page, friendsView, sharing)

            await deleteFromFeed(author.page, post)

            // Gone for User2 too.
            await openPage(friend.page, post.permalink)
            await posts.postNotFound(friend.page).waitFor()
            assert.equal(await friend.page.getByText(post.content).count(), 0)

            // And from User2's share. The share itself is User2's post, and
            // stays, with User2's own text.
            await openPage(friend.page, '/')
            const share = posts.findPost(friend.page, sharing)
            await share.waitFor()
            assert.equal(await share.getByText(post.content).count(), 0,
                `Expected User2's share to no longer show the deleted post.`)
        })
    })
})
