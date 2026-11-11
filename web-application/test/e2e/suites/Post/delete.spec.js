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
 * Every case the integration tests don't cover. The posts each test deletes
 * are made through the API, with their images (../../../lib/files.js) and
 * link previews (../../../lib/linkPreviews.js).
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
const { uploadMedia } = require('../../../lib/files')
const { createLinkPreview, NEWS_LINKS } = require('../../../lib/linkPreviews')

const { startBrowser, stopBrowser, openAs, cleanUp } = require('../../lib/browser')
const { checkSuite } = require('../../lib/suites')
const { openPage } = require('../../lib/app')
const posts = require('../../lib/posts')
const media = require('../../lib/media')

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

    // A post of User1's to delete, made through the API, with an image (a
    // media key) or a link (one of NEWS_LINKS), and its permalink.
    const createPostToDelete = async function(label, { visibility, image = null, link = null }) {
        const submission = { visibility: visibility, content: posts.uniqueText(label) }
        if ( image !== null ) {
            submission.files = [ (await uploadMedia(user1.session, user1.user.id, image)).id ]
        }
        if ( link !== null ) {
            submission.content = `${submission.content} ${link.url}`
            submission.linkPreviewId = (await createLinkPreview(user1.session, link.url)).id
        }
        const post = await createPost(user1.session, user1.user.id, submission)
        return { ...post, permalink: `/${user1.fixture.username}/${post.id}` }
    }

    // As User2, open the post, and check it's there with its image or link
    // preview before doing anything to it. Returns the post.
    const openAsFriend = async function(page, post) {
        await openPage(page, post.permalink)
        await posts.waitForPermalinkPage(page)
        const view = posts.getPostById(page, post.id)
        assert.equal(await view.count(), 1, `Expected User2 to see the post.`)
        assert.equal(await posts.getPostContent(view).innerText(), post.content)
        if ( post.files.length > 0 ) {
            const shown = media.getShownMedia(view)
            await shown.waitFor()
            assert.equal(await media.getFileId(shown), post.files[0])
        }
        if ( post.linkPreviewId ) {
            await media.getLinkPreview(view).waitFor()
            assert.equal(await media.getLinkPreview(view).count(), 1, `Expected the post's link preview.`)
        }
        return view
    }

    // As User1, delete the post from the feed.
    const deleteFromFeed = async function(page, post) {
        await openPage(page, '/')
        await posts.waitForPostList(page)
        await posts.deletePost(page, posts.getPostById(page, post.id))
    }

    // Assert that `post`'s permalink, opened on `page`, shows the 404 and
    // nothing of the post.
    const assertGone = async function(page, post) {
        await openPage(page, post.permalink)
        await posts.waitForPermalinkPage(page)
        assert.equal(await posts.getPostNotFoundError(page).isVisible(), true, `Expected the 404 on the deleted post's permalink.`)
        assert.equal(await posts.getPostById(page, post.id).count(), 0)
        assert.equal(await page.getByText(post.content).count(), 0)
    }

    // A private post, which User2 comments on and reacts to before User1
    // deletes it: gone from User1's feed, and from its permalink for both.
    const deletePrivatePost = async function(post) {
        const author = await openAs('user1')
        const friend = await openAs('user2')

        // User2 comments and reacts.
        const friendsView = await openAsFriend(friend.page, post)
        await posts.react(friendsView, 'Like')
        await posts.comment(friendsView, posts.uniqueText('A comment on a doomed post'))

        // User1 deletes it: it's gone from their feed, and its permalink
        // shows the 404.
        await deleteFromFeed(author.page, post)
        await openPage(author.page, '/')
        await posts.waitForPostList(author.page)
        assert.equal(await posts.getPostById(author.page, post.id).count(), 0)
        assert.equal(await author.page.getByText(post.content).count(), 0)
        await assertGone(author.page, post)

        // Gone for User2 too.
        await assertGone(friend.page, post)
    }

    // A public post, which User2 comments on, reacts to and shares before
    // User1 deletes it: gone from its permalink for both, and from User2's
    // share, which stays, with User2's own text.
    const deleteSharedPost = async function(post) {
        const sharing = posts.uniqueText('Sharing a doomed post')
        const author = await openAs('user1')
        const friend = await openAs('user2')

        // User2 comments, reacts and shares.
        const friendsView = await openAsFriend(friend.page, post)
        await posts.react(friendsView, 'Like')
        await posts.comment(friendsView, posts.uniqueText('A comment on a doomed post'))
        await posts.share(friend.page, friendsView, sharing)

        // The share, on User2's feed, shows the post, until User1 deletes
        // it.
        await openPage(friend.page, '/')
        await posts.waitForPostList(friend.page)
        const share = posts.getPostByText(friend.page, sharing)
        assert.equal(await share.count(), 1, `Expected User2's share in their feed.`)
        await posts.getSharedPost(share).waitFor()
        assert.equal(await posts.getSharedPost(share).getAttribute('id'), post.id)

        await deleteFromFeed(author.page, post)
        await assertGone(author.page, post)
        await assertGone(friend.page, post)

        // The share no longer shows it. The share itself is User2's post,
        // and stays, with User2's own text.
        await openPage(friend.page, '/')
        await posts.waitForPostList(friend.page)
        assert.equal(await share.count(), 1, `Expected User2's share to stay in their feed.`)
        assert.equal(await posts.getPostContent(share).innerText(), sharing)
        assert.equal(await posts.getSharedPost(share).count(), 0, `Expected User2's share to no longer show the deleted post.`)
        assert.equal(await friend.page.getByText(post.content).count(), 0)
    }

    it('As a user, I can delete a private post with an image.', { tags: [ 'smoke-test', 'full-regression' ] }, async function() {
        await deletePrivatePost(await createPostToDelete('A private post with an image to delete', {
            visibility: 'private',
            image: 'image-1'
        }))
    })

    it('As a user, I can delete a private post with a link.', { tags: [ 'full-regression' ] }, async function() {
        await deletePrivatePost(await createPostToDelete('A private post with a link to delete', {
            visibility: 'private',
            link: NEWS_LINKS.protocols
        }))
    })

    it('As a user, I can delete a public post with an image that has been shared.', { tags: [ 'full-regression' ] }, async function() {
        await deleteSharedPost(await createPostToDelete('A public post with an image to share and delete', {
            visibility: 'public',
            image: 'image-1'
        }))
    })

    it('As a user, I can delete a public post with a link that has been shared.', { tags: [ 'full-regression' ] }, async function() {
        await deleteSharedPost(await createPostToDelete('A public post with a link to share and delete', {
            visibility: 'public',
            link: NEWS_LINKS.protocols
        }))
    })

    it(`As a user, I'm asked to confirm before a post is deleted.`, { tags: [ 'full-regression' ] }, async function() {
        const kept = await createPostToDelete('A post that stays', { visibility: 'private' })
        const { page } = await openAs('user1')
        const post = posts.getPostById(page, kept.id)
        const question = page.getByRole('alertdialog').filter({ hasText: 'Are you sure you want to delete this post?' })

        await openPage(page, '/')
        await posts.waitForPostList(page)
        await posts.choosePostAction(post, 'Delete')

        // It asks. Cancel: the post stays, here and after a reload.
        await question.waitFor()
        assert.equal(await question.isVisible(), true, `Expected to be asked whether to delete the post.`)
        await question.getByRole('button', { name: 'Cancel', exact: true }).click()
        await question.waitFor({ state: 'detached' })
        assert.equal(await post.count(), 1, `Expected the post to stay.`)
        assert.equal(await posts.getPostContent(post).innerText(), kept.content)

        await page.reload()
        await posts.waitForPostList(page)
        assert.equal(await post.count(), 1, `Expected the post to stay after a reload.`)
        assert.equal(await posts.getPostContent(post).innerText(), kept.content)
    })

    it('As a user, I can only delete my own posts.', { tags: [ 'full-regression' ] }, async function() {
        const theirs = await createPostToDelete('A post of User1\'s', { visibility: 'private' })
        const mine = await createPost(user2.session, user2.user.id, {
            visibility: 'private',
            content: posts.uniqueText('A post of User2\'s')
        })
        const { page } = await openAs('user2')

        const getActions = async function(id) {
            await openPage(page, '/')
            await posts.waitForPostList(page)
            const post = posts.getPostById(page, id)
            assert.equal(await post.count(), 1, `Expected Post(${id}) on User2's feed.`)
            await posts.openPostMenu(post)
            return (await posts.getPostMenuItems(post).allInnerTexts()).map((item) => item.trim())
        }

        // User1's post, which User2 can see as their friend, can't be
        // deleted by them.
        const theirActions = await getActions(theirs.id)
        assert.ok(theirActions.includes('Copy Link'), `Expected the menu to open: it has ${JSON.stringify(theirActions)}.`)
        assert.ok( ! theirActions.includes('Delete'), `Expected no Delete on someone else's post: ${JSON.stringify(theirActions)}.`)

        // Their own can.
        const myActions = await getActions(mine.id)
        assert.ok(myActions.includes('Delete'), `Expected Delete on one's own post: ${JSON.stringify(myActions)}.`)
    })
})
