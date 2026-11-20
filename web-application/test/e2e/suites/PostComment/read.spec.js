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
 * Read PostComment: documentation/testing/test-cases/PostComment/read.md
 *
 * Every case. What each case starts from (the post, the comments on it, a
 * change of who can see the post, a block) is set up through the API; what
 * each user then sees, on the post's page and in their notifications, is
 * checked in the browser.
 *
 * Each test is tagged with every suite it's in (see ../../lib/suites.js):
 * all of them 'full-regression', and the Smoke Test's cases 'smoke-test'
 * too.
 ******************************************************************************/

const { describe, it, before, after, afterEach } = require('node:test')
const assert = require('node:assert/strict')

const { loginAs, logout } = require('../../../lib/authentication')
const { createPost, patchPost, deleteAllPostsForUser } = require('../../../lib/posts')
const { addComment } = require('../../../lib/postComments')
const { makeFriends, blockUser, clearRelationship } = require('../../../lib/relationships')

const config = require('../../lib/config')
const { startBrowser, stopBrowser, openAs, cleanUp } = require('../../lib/browser')
const { checkSuite } = require('../../lib/suites')
const { openPage, getNotifications, openNotifications, waitForNotification } = require('../../lib/app')
const posts = require('../../lib/posts')
const comments = require('../../lib/comments')
const { eventually } = require('../../lib/wait')

describe('Read PostComment', function() {

    // API sessions, for setting up and cleaning up.
    let user1 = null
    let user2 = null
    let user3 = null

    // User2 is User1's friend. User3 is User2's friend, but not User1's.
    const befriend = async function() {
        await makeFriends(user1.session, user1.user.id, user2.session, user2.user.id)
        await makeFriends(user2.session, user2.user.id, user3.session, user3.user.id)
    }

    const unfriend = async function() {
        await clearRelationship(user1.session, user1.user.id, user2.session, user2.user.id)
        await clearRelationship(user1.session, user1.user.id, user3.session, user3.user.id)
        await clearRelationship(user2.session, user2.user.id, user3.session, user3.user.id)
    }

    before(async function() {
        await startBrowser()

        user1 = await loginAs('user1')
        user2 = await loginAs('user2')
        user3 = await loginAs('user3')

        await unfriend()
        await befriend()

        await deleteAllPostsForUser(user1.session, user1.user.id)
    })

    afterEach(async function(t) {
        await cleanUp(t)
        checkSuite(t)
    })

    after(async function() {
        await stopBrowser()

        // Deleting the posts deletes their comments.
        if ( user1 ) {
            await deleteAllPostsForUser(user1.session, user1.user.id)
            await unfriend()
            await logout(user1.session)
        }
        if ( user2 ) await logout(user2.session)
        if ( user3 ) await logout(user3.session)
    })

    // A post of User1's, made through the API, for the test to comment on.
    const createPostOf = async function(visibility, label) {
        return await createPost(user1.session, user1.user.id, {
            visibility: visibility,
            content: posts.uniqueText(label)
        })
    }

    const permalinkOf = (post) => `/${user1.fixture.username}/${post.id}`

    // The direct link to `comment` on `post`: the post's permalink, to the
    // comment's anchor.
    const commentLinkOf = (post, comment) => `${permalinkOf(post)}#comment-${comment.id}`

    // Open `path`, a post's permalink or a link to a comment on it, and
    // return User1's post as it shows there.
    const openPost = async function(page, post, path = permalinkOf(post)) {
        await openPage(page, path)
        await posts.waitForPermalinkPage(page)
        return posts.getPostById(page, post.id)
    }

    // Assert that `view` shows `comment` (made through the API), saying what
    // it says: `content`, if that reads differently from how it was written,
    // as a comment with a mention does once the mentioned user's name has
    // loaded.
    const assertShowsComment = async function(view, comment, content = comment.content) {
        const shown = comments.getCommentById(view, comment.id)
        assert.equal(await shown.count(), 1, `Expected the comment "${comment.content}" to show.`)
        await eventually(async () => assert.equal(await comments.getCommentContent(shown).innerText(), content))
    }

    // Assert that `view` doesn't show `comment`.
    const assertHidesComment = async function(view, comment) {
        assert.equal(await comments.getCommentById(view, comment.id).count(), 0, `Expected the comment "${comment.content}" not to show.`)
        assert.equal(await view.page().getByText(comment.content).count(), 0)
    }

    // Assert that the page a link to `comment` opened shows it, highlighted,
    // as a comment that's been linked to is.
    const assertLinkedComment = async function(view, comment, content = comment.content) {
        await assertShowsComment(view, comment, content)
        const classes = (await comments.getCommentById(view, comment.id).getAttribute('class')).split(/\s+/)
        assert.ok(classes.includes('highlight'), `Expected the linked comment to be highlighted: its classes are ${JSON.stringify(classes)}.`)
    }

    // Assert that `page` shows the 404 on `post`'s permalink, and nothing of
    // it or `comment`.
    const assertNotFound = async function(page, post, comment) {
        assert.equal(await posts.getPostNotFoundError(page).isVisible(), true, `Expected the 404 on the post's permalink.`)
        assert.equal(await posts.getPostById(page, post.id).count(), 0)
        assert.equal(await page.getByText(post.content).count(), 0)
        assert.equal(await page.getByText(comment.content).count(), 0)
    }

    // The notifications that quote `comment`: any notification about it
    // starts its quote with the comment's first 20 characters, which the
    // tests make unique by starting their comments with a short
    // uniqueText().
    const getNotificationsAbout = function(page, comment) {
        return getNotifications(page, `"${comment.content.substring(0, 20)}`)
    }

    // Wait for User1, the post's author, to be notified of `comment`. The
    // worker sends all the notifications of a comment together, the post
    // author's first: once User1 has theirs, the others are sent, or won't
    // be.
    const waitForAuthorNotified = async function(page, post, comment, commenter) {
        await waitForNotification(page, getNotifications(page, comments.authorNotificationText({
            commenter: commenter.fixture.name,
            comment: comment.content,
            post: post.content
        })))
    }

    it('As a user, comments on public posts are always viewable.', { tags: [ 'smoke-test', 'full-regression' ] }, async function() {
        const post = await createPostOf('public', 'A public post')
        const comment = await addComment(user2.session, post.id, posts.uniqueText(`User2's comment`))
        const { page } = await openAs('user3')

        // User3, who isn't User1's friend, follows the link to the comment:
        // the post shows, with the comment.
        const view = await openPost(page, post, commentLinkOf(post, comment))
        assert.equal(await view.count(), 1, `Expected the public post to show.`)
        assert.equal(await posts.getPostContent(view).innerText(), post.content)
        await assertLinkedComment(view, comment)
    })

    it(`As a user, comments on private posts are only visible to the post author's friends.`, { tags: [ 'smoke-test', 'full-regression' ] }, async function() {
        const post = await createPostOf('private', 'A private post')
        const comment = await addComment(user2.session, post.id, posts.uniqueText(`User2's comment`))
        const friend = await openAs('user2')
        const stranger = await openAs('user3')

        // User2, User1's friend, sees it.
        await assertLinkedComment(await openPost(friend.page, post, commentLinkOf(post, comment)), comment)

        // User3, who isn't, gets the 404, and nothing of the post or the
        // comment.
        await openPost(stranger.page, post, commentLinkOf(post, comment))
        await assertNotFound(stranger.page, post, comment)
    })

    it(`As a user, I lose visibility of comments when a post's visibility changes to private.`, { tags: [ 'full-regression' ] }, async function() {
        const post = await createPostOf('public', 'A post going private')
        const author = await openAs('user1')
        const stranger = await openAs('user3')

        // User3 comments while it's public, which subscribes them to it.
        await addComment(user3.session, post.id, `${posts.uniqueText('Hi')}, from User3.`)

        // While it's public, User3 is notified of User2's comments. This
        // shows they're subscribed, so that what follows is because the post
        // went private.
        const before = await addComment(user2.session, post.id, `${posts.uniqueText('Hi')}, while it's public.`)
        await waitForNotification(stranger.page, getNotifications(stranger.page, comments.subscriberNotificationText({
            commenter: user2.fixture.name,
            comment: before.content,
            post: post.content
        })))

        // User1 makes it private, and User2 comments again.
        const response = await patchPost(user1.session, post.id, { id: post.id, visibility: 'private' })
        assert.equal(response.ok, true, `Couldn't make the post private: ${response.status}`)
        const after = await addComment(user2.session, post.id, `${posts.uniqueText('Hi')}, now it's private.`)
        await waitForAuthorNotified(author.page, post, after, user2)

        // User3 isn't notified of that comment...
        await openNotifications(stranger.page)
        assert.equal(await getNotificationsAbout(stranger.page, before).count(), 1, `Expected the notification of the comment made while the post was public.`)
        assert.equal(await getNotificationsAbout(stranger.page, after).count(), 0, `Expected no notification of the comment made once the post was private.`)

        // ... and can't follow a link to it.
        await openPost(stranger.page, post, commentLinkOf(post, after))
        await assertNotFound(stranger.page, post, after)
    })

    it('As a user, I can copy a link to a comment.', { tags: [ 'full-regression' ] }, async function() {
        const post = await createPostOf('public', 'A post with a comment to share')
        const comment = await addComment(user2.session, post.id, posts.uniqueText('A comment worth a link'))
        const commenter = await openAs('user2')
        const reader = await openAs('user3')

        // Let the page use the clipboard, as a person's browser does once
        // they've allowed it. (These are Chromium's names for it.)
        await commenter.context.grantPermissions([ 'clipboard-read', 'clipboard-write' ])

        const view = await openPost(commenter.page, post)
        await comments.chooseCommentAction(comments.getCommentById(view, comment.id), 'Copy Link')

        // It says so, and the link to the comment is on the clipboard.
        const copied = commenter.page.getByRole('alert').filter({ hasText: 'Link copied.' })
        await copied.waitFor()
        assert.equal(await copied.innerText(), 'Link copied.')
        const link = await commenter.page.evaluate(() => navigator.clipboard.readText())
        assert.equal(link, new URL(commentLinkOf(post, comment), config.BASE_URL).href)

        // User3 opens it: the post, with the comment highlighted.
        const opened = await openPost(reader.page, post, link)
        assert.equal(await opened.count(), 1, `Expected the copied link to open the post.`)
        await assertLinkedComment(opened, comment)
    })

    it(`As a user, a post's comments are folded away in the feed until I show them.`, { tags: [ 'full-regression' ] }, async function() {
        const post = await createPostOf('private', 'A post with comments to fold')
        const first = await addComment(user2.session, post.id, posts.uniqueText('The first comment'))
        const second = await addComment(user2.session, post.id, posts.uniqueText('The second comment'))
        const { page } = await openAs('user1')
        const view = posts.getPostById(page, post.id)
        const show = comments.getShowCommentsLink(view)
        const hide = comments.getHideCommentsLink(view)

        // In the feed, the post offers to show its two comments, and doesn't.
        await openPage(page, '/')
        await posts.waitForPostList(page)
        assert.equal(await view.count(), 1, `Expected the post in User1's feed.`)
        assert.equal(await show.count(), 1, `Expected a link to show the comments.`)
        assert.equal(await show.innerText(), 'Show 2 comments.')
        assert.equal(await comments.getComments(view).count(), 0)

        // Show them: both, in the order they were made.
        await show.click()
        await hide.waitFor()
        assert.equal(await hide.innerText(), 'Hide 2 comments.')
        assert.deepEqual(await comments.getCommentIds(view), [ first.id, second.id ])
        await assertShowsComment(view, first)
        await assertShowsComment(view, second)

        // Hide them again.
        await hide.click()
        await show.waitFor()
        assert.equal(await comments.getComments(view).count(), 0)

        // On the post's own page, they show without asking.
        await openPost(page, post)
        assert.deepEqual(await comments.getCommentIds(view), [ first.id, second.id ])
        assert.equal(await show.count(), 0)
        assert.equal(await hide.innerText(), 'Hide 2 comments.')
    })

    it(`As a user, I don't see the comments of users I've blocked, or who have blocked me.`, { tags: [ 'full-regression' ] }, async function() {
        const post = await createPostOf('public', 'A post with a block under it')
        const fromUser2 = await addComment(user2.session, post.id, posts.uniqueText(`User2's comment`))
        const fromUser3 = await addComment(user3.session, post.id, posts.uniqueText(`User3's comment`))

        // User3 blocks User2. The block replaces their friendship, which is
        // put back afterwards for the tests that follow.
        await blockUser(user3.session, user3.user.id, user2.user.id)
        try {
            const author = await openAs('user1')
            const blocker = await openAs('user3')
            const blocked = await openAs('user2')

            // User3 sees their own comment, and not User2's.
            const blockersView = await openPost(blocker.page, post)
            await assertShowsComment(blockersView, fromUser3)
            await assertHidesComment(blockersView, fromUser2)

            // User2 sees their own, and not User3's.
            const blockedView = await openPost(blocked.page, post)
            await assertShowsComment(blockedView, fromUser2)
            await assertHidesComment(blockedView, fromUser3)

            // User1 sees both.
            const authorsView = await openPost(author.page, post)
            assert.deepEqual(await comments.getCommentIds(authorsView), [ fromUser2.id, fromUser3.id ])
            await assertShowsComment(authorsView, fromUser2)
            await assertShowsComment(authorsView, fromUser3)
        } finally {
            await clearRelationship(user2.session, user2.user.id, user3.session, user3.user.id)
            await makeFriends(user2.session, user2.user.id, user3.session, user3.user.id)
        }
    })

    describe('Mentions', function() {

        it('As a user, I am notified when mentioned on a post I can see.', { tags: [ 'full-regression' ] }, async function() {
            const post = await createPostOf('public', 'A public post')
            const comment = await addComment(user2.session, post.id,
                `${posts.uniqueText('Hi')} @${user3.fixture.username}, look at this.`)
            const { page } = await openAs('user3')
            const notification = getNotifications(page, comments.mentionNotificationText({
                commenter: user2.fixture.name,
                comment: comment.content,
                postAuthor: user1.fixture.name,
                post: post.content
            }))

            // User3 is notified.
            await waitForNotification(page, notification)
            assert.equal(await notification.count(), 1, `Expected one notification of the mention.`)

            // It links to the comment, which shows, highlighted.
            await notification.click()
            await page.waitForURL((url) => url.pathname === permalinkOf(post) && url.hash === `#comment-${comment.id}`)
            await posts.waitForPermalinkPage(page)
            const view = posts.getPostById(page, post.id)
            assert.equal(await view.count(), 1, `Expected the notification to open the post.`)
            await assertLinkedComment(view, comment, comment.content.replace(`@${user3.fixture.username}`, `@${user3.fixture.name}`))
        })

        it('As a user, I am not notified when mentioned on a post I cannot see.', { tags: [ 'full-regression' ] }, async function() {
            const post = await createPostOf('private', 'A private post')
            const comment = await addComment(user2.session, post.id,
                `${posts.uniqueText('Hi')} @${user3.fixture.username}, you can't see this.`)
            const author = await openAs('user1')
            const mentioned = await openAs('user3')

            // Once User1 has been notified of the comment, User3 would have
            // been too.
            await waitForAuthorNotified(author.page, post, comment, user2)

            // User3 isn't notified...
            await openNotifications(mentioned.page)
            assert.equal(await getNotificationsAbout(mentioned.page, comment).count(), 0, `Expected no notification of the mention.`)

            // ... and can't follow a link to the comment.
            await openPost(mentioned.page, post, commentLinkOf(post, comment))
            await assertNotFound(mentioned.page, post, comment)
        })
    })
})
