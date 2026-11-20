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
 * Delete PostComment: documentation/testing/test-cases/PostComment/delete.md
 *
 * Every case. The post the comments are on, and the comments each test
 * deletes, are made through the API (../../../lib/posts.js and
 * ../../../lib/postComments.js).
 *
 * Each test is tagged with every suite it's in (see ../../lib/suites.js):
 * all of them 'full-regression', and the Smoke Test's cases 'smoke-test'
 * too.
 ******************************************************************************/

const { describe, it, before, after, afterEach } = require('node:test')
const assert = require('node:assert/strict')

const { loginAs, logout } = require('../../../lib/authentication')
const { createPost, deleteAllPostsForUser } = require('../../../lib/posts')
const { addComment } = require('../../../lib/postComments')
const { clearRelationship } = require('../../../lib/relationships')

const { startBrowser, stopBrowser, openAs, cleanUp } = require('../../lib/browser')
const { checkSuite } = require('../../lib/suites')
const { openPage, getNotifications, openNotifications, waitForNotification } = require('../../lib/app')
const posts = require('../../lib/posts')
const comments = require('../../lib/comments')

describe('Delete PostComment', function() {

    // API sessions, for setting up and cleaning up.
    let user1 = null
    let user2 = null

    // User1's public post, which the tests comment on, made through the API.
    let post = null

    before(async function() {
        await startBrowser()

        user1 = await loginAs('user1')
        user2 = await loginAs('user2')

        // User2 is a stranger to User1, and sees the post because it's
        // public.
        await clearRelationship(user1.session, user1.user.id, user2.session, user2.user.id)

        await deleteAllPostsForUser(user1.session, user1.user.id)
        post = await createPost(user1.session, user1.user.id, {
            visibility: 'public',
            content: posts.uniqueText('A post to comment on')
        })
    })

    afterEach(async function(t) {
        await cleanUp(t)
        checkSuite(t)
    })

    after(async function() {
        await stopBrowser()

        // Deleting the post deletes its comments.
        if ( user1 ) {
            await deleteAllPostsForUser(user1.session, user1.user.id)
            await logout(user1.session)
        }
        if ( user2 ) await logout(user2.session)
    })

    // Open User1's post on its own page, where its comments show, and return
    // it.
    const openPost = async function(page) {
        await openPage(page, `/${user1.fixture.username}/${post.id}`)
        await posts.waitForPermalinkPage(page)
        const view = posts.getPostById(page, post.id)
        assert.equal(await view.count(), 1, `Expected User1's post on its page.`)
        return view
    }

    // Assert that `view`, User1's post, shows `comment` (made through the
    // API), saying what it says.
    const assertShowsComment = async function(view, comment) {
        const shown = comments.getCommentById(view, comment.id)
        assert.equal(await shown.count(), 1, `Expected the comment on User1's post.`)
        assert.equal(await comments.getCommentContent(shown).innerText(), comment.content)
    }

    // Assert that `view`, User1's post, doesn't show `comment`.
    const assertCommentGone = async function(view, comment) {
        assert.equal(await comments.getCommentById(view, comment.id).count(), 0)
        assert.equal(await view.getByText(comment.content).count(), 0)
    }

    // Open `comment`'s menu and get what's in it.
    const getActions = async function(comment) {
        await comments.openCommentMenu(comment)
        return (await comments.getCommentMenuItems(comment).allInnerTexts()).map((item) => item.trim())
    }

    it('As a user, I can delete my comments.', { tags: [ 'smoke-test', 'full-regression' ] }, async function() {
        const comment = await addComment(user2.session, post.id, posts.uniqueText('A comment to delete'))
        const { page } = await openAs('user2')

        const view = await openPost(page)
        await assertShowsComment(view, comment)

        // Delete it: it's gone, and stays gone after a reload.
        await comments.deleteComment(comments.getCommentById(view, comment.id))
        await assertCommentGone(view, comment)

        await page.reload()
        await posts.waitForPermalinkPage(page)
        assert.equal(await view.count(), 1, `Expected User1's post still on its page.`)
        await assertCommentGone(view, comment)
    })

    it(`A user cannot delete another user's comment.`, { tags: [ 'smoke-test', 'full-regression' ] }, async function() {
        const comment = await addComment(user2.session, post.id, posts.uniqueText(`A comment of User2's`))
        const author = await openAs('user1')
        const commenter = await openAs('user2')

        // User1, whose post it's on, isn't offered "delete" on User2's
        // comment.
        const theirs = comments.getCommentById(await openPost(author.page), comment.id)
        assert.equal(await theirs.count(), 1, `Expected User2's comment on User1's post.`)
        const theirActions = await getActions(theirs)
        assert.ok(theirActions.includes('Copy Link'), `Expected the menu to open: it has ${JSON.stringify(theirActions)}.`)
        assert.ok( ! theirActions.includes('delete'), `Expected no delete on someone else's comment: ${JSON.stringify(theirActions)}.`)

        // User2 is, on their own.
        const mine = comments.getCommentById(await openPost(commenter.page), comment.id)
        const myActions = await getActions(mine)
        assert.ok(myActions.includes('delete'), `Expected delete on one's own comment: ${JSON.stringify(myActions)}.`)
    })

    it(`As a user, I'm asked to confirm before a comment is deleted.`, { tags: [ 'full-regression' ] }, async function() {
        const comment = await addComment(user2.session, post.id, posts.uniqueText('A comment that stays'))
        const { page } = await openAs('user2')
        const question = comments.getDeleteCommentDialog(page)

        const view = await openPost(page)
        const shown = comments.getCommentById(view, comment.id)
        await comments.chooseCommentAction(shown, 'delete')

        // It asks. Cancel: the comment stays, here and after a reload.
        await question.waitFor()
        assert.equal(await question.isVisible(), true, `Expected to be asked whether to delete the comment.`)
        await question.getByRole('button', { name: 'Cancel', exact: true }).click()
        await question.waitFor({ state: 'detached' })
        await assertShowsComment(view, comment)

        await page.reload()
        await posts.waitForPermalinkPage(page)
        await assertShowsComment(view, comment)
    })

    it('As a user mentioned in a deleted comment, I can still view the post from the notification.', { tags: [ 'full-regression' ] }, async function() {
        // The notification quotes the comment's first 20 characters, which
        // the short uniqueText() makes unique to it.
        const comment = await addComment(user2.session, post.id,
            `${posts.uniqueText('Hi')} @${user1.fixture.username}, this won't last.`)
        const mentioned = await openAs('user1')
        const commenter = await openAs('user2')
        const notification = getNotifications(mentioned.page, comments.mentionNotificationText({
            commenter: user2.fixture.name,
            comment: comment.content,
            postAuthor: user1.fixture.name,
            post: post.content
        }))

        // User1 is notified of the mention.
        await waitForNotification(mentioned.page, notification)

        // User2 deletes the comment.
        const view = await openPost(commenter.page)
        await comments.deleteComment(comments.getCommentById(view, comment.id))
        await assertCommentGone(view, comment)

        // The notification still takes User1 to the post, which shows, but
        // not the comment.
        await openNotifications(mentioned.page)
        assert.equal(await notification.count(), 1, `Expected the notification of the deleted comment.`)
        await notification.click()
        await mentioned.page.waitForURL((url) => url.pathname === `/${user1.fixture.username}/${post.id}`)
        await posts.waitForPermalinkPage(mentioned.page)

        const shown = posts.getPostById(mentioned.page, post.id)
        assert.equal(await shown.count(), 1, `Expected the notification to show the post.`)
        assert.equal(await posts.getPostContent(shown).innerText(), post.content)
        await assertCommentGone(shown, comment)
    })
})
