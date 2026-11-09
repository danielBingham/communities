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

    // A post of User1's to delete, made through the API, and its permalink.
    const createPostToDelete = async function(label, visibility) {
        const post = await createPost(user1.session, user1.user.id, {
            visibility: visibility,
            content: posts.uniqueText(label)
        })
        return { ...post, permalink: `/${user1.fixture.username}/${post.id}` }
    }

    // As User1, delete the post from the feed.
    const deleteFromFeed = async function(page, post) {
        await openPage(page, '/')
        await posts.waitForPostList(page)
        await posts.deletePost(page, posts.getPostById(page, post.id))
    }

    // "As a user, I can delete a private post with an image." and, in the
    // Manual Regression, "... with a link."
    it('As a user, I can delete a private post. (text only)', { tags: [ 'smoke-test' ] }, async function() {
        const post = await createPostToDelete('A private post to delete', 'private')
        const author = await openAs('user1')
        const friend = await openAs('user2')

        // User2 comments and reacts.
        await openPage(friend.page, post.permalink)
        await posts.waitForPermalinkPage(friend.page)
        const friendsView = posts.getPostById(friend.page, post.id)
        await posts.react(friendsView, 'Like')
        await posts.comment(friendsView, posts.uniqueText('A comment on a doomed post'))

        // User1 deletes it: it's gone from their feed, and its permalink
        // shows the 404.
        await deleteFromFeed(author.page, post)
        await openPage(author.page, '/')
        await posts.waitForPostList(author.page)
        assert.equal(await posts.getPostById(author.page, post.id).count(), 0)
        assert.equal(await author.page.getByText(post.content).count(), 0)

        await openPage(author.page, post.permalink)
        await posts.waitForPermalinkPage(author.page)
        assert.equal(await posts.getPostNotFoundError(author.page).isVisible(), true, `Expected the 404 on the deleted post's permalink.`)
        assert.equal(await author.page.getByText(post.content).count(), 0)

        // Gone for User2 too.
        await openPage(friend.page, post.permalink)
        await posts.waitForPermalinkPage(friend.page)
        assert.equal(await posts.getPostNotFoundError(friend.page).isVisible(), true, `Expected the 404 on the deleted post's permalink.`)
        assert.equal(await friend.page.getByText(post.content).count(), 0)
    })

    // "As a user, I can delete a public post with an image that has been
    // shared." and "... with a link ...".
    it('As a user, I can delete a public post that has been shared. (text only)', { tags: [ 'full-regression' ] }, async function() {
        const post = await createPostToDelete('A public post to share and delete', 'public')
        const sharing = posts.uniqueText('Sharing a doomed post')
        const author = await openAs('user1')
        const friend = await openAs('user2')

        // User2 comments, reacts and shares.
        await openPage(friend.page, post.permalink)
        await posts.waitForPermalinkPage(friend.page)
        const friendsView = posts.getPostById(friend.page, post.id)
        await posts.react(friendsView, 'Like')
        await posts.comment(friendsView, posts.uniqueText('A comment on a doomed post'))
        await posts.share(friend.page, friendsView, sharing)

        // User1 deletes it: its permalink shows the 404.
        await deleteFromFeed(author.page, post)
        await openPage(author.page, post.permalink)
        await posts.waitForPermalinkPage(author.page)
        assert.equal(await posts.getPostNotFoundError(author.page).isVisible(), true, `Expected the 404 on the deleted post's permalink.`)
        assert.equal(await author.page.getByText(post.content).count(), 0)

        // Gone for User2 too.
        await openPage(friend.page, post.permalink)
        await posts.waitForPermalinkPage(friend.page)
        assert.equal(await posts.getPostNotFoundError(friend.page).isVisible(), true, `Expected the 404 on the deleted post's permalink.`)
        assert.equal(await friend.page.getByText(post.content).count(), 0)

        // And from User2's share. The share itself is User2's post, and
        // stays, with User2's own text.
        await openPage(friend.page, '/')
        await posts.waitForPostList(friend.page)
        const share = posts.getPostByText(friend.page, sharing)
        assert.equal(await share.count(), 1, `Expected User2's share to stay in their feed.`)
        assert.equal(await posts.getPostContent(share).innerText(), sharing)
        assert.equal(await posts.getSharedPost(share).count(), 0, `Expected User2's share to no longer show the deleted post.`)
        assert.equal(await friend.page.getByText(post.content).count(), 0)
    })
})
