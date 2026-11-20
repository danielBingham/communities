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
 * Create PostComment: documentation/testing/test-cases/PostComment/create.md
 *
 * Every case, though only part of the one about replying in a long thread:
 * it's tested in a desktop and a phone-sized window, but whether the keyboard
 * on a phone leaves the form in view is still checked by hand.
 *
 * Each test comments on a post of its own, made through the API
 * (../../../lib/posts.js), along with any comments the case starts from
 * (../../../lib/postComments.js). They're User1's, apart from one that has
 * to be in User2's feed.
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
const { makeFriends, blockUser, clearRelationship } = require('../../../lib/relationships')

const config = require('../../lib/config')
const { startBrowser, stopBrowser, openAs, cleanUp } = require('../../lib/browser')
const { checkSuite } = require('../../lib/suites')
const { openPage, followHeaderLink, logOut, logIn, getNotifications, openNotifications, waitForNotification } = require('../../lib/app')
const posts = require('../../lib/posts')
const comments = require('../../lib/comments')
const { eventually } = require('../../lib/wait')

describe('Create PostComment', function() {

    // API sessions, for setting up and cleaning up. The tests themselves act
    // in the browser.
    let user1 = null
    let user2 = null
    let user3 = null
    let user4 = null
    let user5 = null
    let admin = null

    // The relationships between them, all cleared before and after the tests.
    const pairs = () => [
        [ user1, user2 ], [ user1, user3 ], [ user1, user4 ], [ user1, user5 ],
        [ user2, user3 ], [ user2, user4 ], [ user2, user5 ]
    ]

    before(async function() {
        await startBrowser()

        user1 = await loginAs('user1')
        user2 = await loginAs('user2')
        user3 = await loginAs('user3')
        user4 = await loginAs('user4')
        user5 = await loginAs('user5')
        admin = await loginAs('user-site-admin')

        // User2 has two friends to mention, User3 and User4. User1, whose
        // posts they all comment on, is a stranger to them, and they see the
        // posts because they're public. So is User5, whose name is like the
        // others'.
        for (const [ a, b ] of pairs()) {
            await clearRelationship(a.session, a.user.id, b.session, b.user.id)
        }
        await makeFriends(user2.session, user2.user.id, user3.session, user3.user.id)
        await makeFriends(user2.session, user2.user.id, user4.session, user4.user.id)

        await deleteAllPostsForUser(user1.session, user1.user.id)
        await deleteAllPostsForUser(user2.session, user2.user.id)
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
            await deleteAllPostsForUser(user2.session, user2.user.id)
            for (const [ a, b ] of pairs()) {
                await clearRelationship(a.session, a.user.id, b.session, b.user.id)
            }
        }
        for (const user of [ user1, user2, user3, user4, user5, admin ]) {
            if ( user ) await logout(user.session)
        }
    })

    // A public post of User1's, made through the API, for the test to comment
    // on.
    const createPostToCommentOn = async function(label) {
        return await createPost(user1.session, user1.user.id, {
            visibility: 'public',
            content: posts.uniqueText(label)
        })
    }

    const permalinkOf = (post) => `/${user1.fixture.username}/${post.id}`

    // Open `post` on its own page, where its comments show, and return it.
    const openPost = async function(page, post) {
        await openPage(page, permalinkOf(post))
        await posts.waitForPermalinkPage(page)
        const view = posts.getPostById(page, post.id)
        assert.equal(await view.count(), 1, `Expected User1's post on its page.`)
        return view
    }

    // Get the id of `comment`, a comment the test made in the browser. A
    // value, read from the page.
    const getIdOf = async function(comment) {
        return (await comment.getAttribute('id')).replace(/^comment-/, '')
    }

    // Assert that `view` shows exactly one comment including `text`, by
    // `author` (a fixture), saying `content` (`text`, unless the comment
    // reads differently from how it was written, as one with a mention
    // does). Returns the comment.
    const assertCommented = async function(view, text, author, content = text) {
        const comment = comments.getCommentByText(view, text)
        assert.equal(await comment.count(), 1, `Expected the comment "${text}" on the post.`)
        await eventually(async () => assert.equal(await comments.getCommentContent(comment).innerText(), content))
        assert.equal(await comments.getCommentAuthor(comment).innerText(), author.name)
        assert.equal(await comments.getCommentAuthor(comment).getAttribute('href'), `/${author.username}`)
        return comment
    }

    // Get what each comment on `view` says and who said it, in order: [{
    // author, content }]. A value, read from the page.
    const getThread = async function(view) {
        const thread = []
        for (const comment of await comments.getComments(view).all()) {
            thread.push({
                author: await comments.getCommentAuthor(comment).innerText(),
                content: await comments.getCommentContent(comment).innerText()
            })
        }
        return thread
    }

    // Assert that `comment` is highlighted, as a comment that's been linked
    // to is.
    const assertHighlighted = async function(comment) {
        const classes = (await comment.getAttribute('class')).split(/\s+/)
        assert.ok(classes.includes('highlight'), `Expected the linked comment to be highlighted: its classes are ${JSON.stringify(classes)}.`)
    }

    // The notification of a mention of User1 in User2's `comment` on
    // `post`.
    const getMentionOfUser1 = function(page, post, comment) {
        return getNotifications(page, comments.mentionNotificationText({
            commenter: user2.fixture.name,
            comment: comment,
            postAuthor: user1.fixture.name,
            post: post.content
        }))
    }

    it('As a user, I can comment on a post I can see.', { tags: [ 'smoke-test', 'full-regression' ] }, async function() {
        const post = await createPostToCommentOn('A post to comment on')
        const text = posts.uniqueText('First.')
        const commenter = await openAs('user2')
        const author = await openAs('user1')

        // User2 comments: it shows on the post, by them.
        const view = await openPost(commenter.page, post)
        await comments.commentOn(view, text)
        await assertCommented(view, text, user2.fixture)

        // It's there for User1 too, on their post.
        const authorsView = await openPost(author.page, post)
        assert.deepEqual(await getThread(authorsView), [ { author: user2.fixture.name, content: text } ])
    })

    it('As a user, comments appear in the order they are made.', { tags: [ 'smoke-test', 'full-regression' ] }, async function() {
        const post = await createPostToCommentOn('A post with a conversation')
        const first = await addComment(user2.session, post.id, posts.uniqueText('First.'))
        const second = posts.uniqueText('Second.')
        const third = posts.uniqueText('Third.')
        const author = await openAs('user1')
        const commenter = await openAs('user2')

        // User1 comments after User2's first comment.
        const authorsView = await openPost(author.page, post)
        await comments.commentOn(authorsView, second)
        await assertCommented(authorsView, second, user1.fixture)

        // Then User2 again.
        const view = await openPost(commenter.page, post)
        await comments.commentOn(view, third)
        await assertCommented(view, third, user2.fixture)

        // They're in the order they were made.
        assert.deepEqual(await getThread(view), [
            { author: user2.fixture.name, content: first.content },
            { author: user1.fixture.name, content: second },
            { author: user2.fixture.name, content: third }
        ])
    })

    it(`As a user, I'm asked before a comment I've started is discarded.`, { tags: [ 'full-regression' ] }, async function() {
        const post = await createPostToCommentOn('A post with a comment to discard')
        const text = posts.uniqueText('A comment to discard')
        const { page } = await openAs('user2')
        const dialog = comments.getDiscardCommentDialog(page)

        const view = await openPost(page, post)
        const start = comments.getStartCommentLink(view)
        const form = comments.getCommentForm(view)
        const textbox = comments.getCommentTextbox(form)

        // With nothing written, Cancel closes the form without asking.
        await comments.openCommentForm(view)
        await form.getByRole('button', { name: 'Cancel', exact: true }).click()
        await start.waitFor()
        assert.equal(await dialog.count(), 0)
        assert.equal(await form.count(), 0)

        // With something written, it asks.
        await comments.writeComment(view, text)
        await form.getByRole('button', { name: 'Cancel', exact: true }).click()
        await dialog.waitFor()
        assert.equal(await dialog.isVisible(), true, `Expected to be asked whether to discard the comment.`)

        // Keep editing: the form still has the text.
        await dialog.getByRole('button', { name: 'Keep Editing', exact: true }).click()
        await dialog.waitFor({ state: 'detached' })
        assert.equal(await textbox.inputValue(), text)

        // Discard it: the form closes, and starts over empty, with nothing
        // posted.
        await comments.discardCommentForm(form)
        assert.equal(await start.isVisible(), true, `Expected the link to start a comment again.`)
        assert.equal(await comments.getComments(view).count(), 0)

        await comments.openCommentForm(view)
        assert.equal(await textbox.inputValue(), '')
    })

    it('As a user, the comment form stops at 5,000 characters.', { tags: [ 'full-regression' ] }, async function() {
        const post = await createPostToCommentOn('A post with a long comment')
        const { page } = await openAs('user2')
        const error = page.getByText('Comments are limited to 5000 characters...')

        const view = await openPost(page, post)
        await comments.openCommentForm(view)
        const textbox = comments.getCommentTextbox(comments.getCommentForm(view))

        // One character too many: it says so, and doesn't take it.
        await textbox.fill('a'.repeat(5001))
        await error.waitFor()
        assert.equal(await error.isVisible(), true)
        assert.equal(await textbox.inputValue(), '')

        // Exactly the limit: it takes it, and the error goes.
        await textbox.fill('a'.repeat(5000))
        await error.waitFor({ state: 'detached' })
        assert.equal((await textbox.inputValue()).length, 5000)
    })

    describe('Mentions', function() {

        it('As a user, I can mention other users in comments.', { tags: [ 'full-regression' ] }, async function() {
            const post = await createPostToCommentOn('A post to mention its author on')
            const commenter = await openAs('user2')
            const mentioned = await openAs('user1')
            const page = commenter.page

            // The notification quotes the comment's first 20 characters,
            // which the short uniqueText() makes unique to it.
            const intro = posts.uniqueText('Hi')
            const suggestions = comments.getMentionSuggestions(page)
            const options = suggestions.getByRole('option')

            // The names suggested, once the suggestions have caught up with
            // what's been typed: they each include `typed`, and they're User2's
            // friends and User1, whose post it is. Not User5, whose name is
            // like theirs but who is neither, and not User2.
            const assertSuggestions = async function(typed) {
                const expected = [ user1.fixture.name, user3.fixture.name, user4.fixture.name ]
                await eventually(async () => {
                    const names = await options.allInnerTexts()
                    assert.deepEqual([ ...names ].sort(), expected, `Expected User1, User3 and User4 to be suggested.`)
                    for (const name of names) {
                        assert.ok(name.toLowerCase().includes(typed.toLowerCase()), `Expected "${name}" to match "${typed}".`)
                    }
                })
            }

            // The position of the suggestion that's selected.
            const getSelected = async function() {
                return (await options.evaluateAll((shown) => shown.map((option) => option.getAttribute('aria-selected'))))
                    .indexOf('true')
            }

            const view = await openPost(page, post)
            await comments.openCommentForm(view)
            const textbox = comments.getCommentTextbox(comments.getCommentForm(view))

            // Start a mention with the beginning of User1's name.
            await textbox.pressSequentially(`${intro} `)
            await comments.typeMention(textbox, '@Test Us', 'Test Us')
            await assertSuggestions('Test Us')

            // Type more of it: they still match.
            await comments.typeMention(textbox, 'er', 'Test User')
            await assertSuggestions('Test User')

            // Walk down the list and back up: the selection follows.
            assert.equal(await getSelected(), 0, `Expected the first suggestion to be selected.`)
            await textbox.press('ArrowDown')
            await eventually(async () => assert.equal(await getSelected(), 1, `Expected the selection to move down.`))
            await textbox.press('ArrowUp')
            await eventually(async () => assert.equal(await getSelected(), 0, `Expected the selection to move back up.`))

            // Select User1 and press Enter: the mention is completed with
            // their username, and the suggestions close.
            const index = (await options.allInnerTexts()).indexOf(user1.fixture.name)
            for (let step = 0; step < index; step++) {
                await textbox.press('ArrowDown')
            }
            await eventually(async () => assert.equal(await getSelected(), index))
            await textbox.press('Enter')
            await suggestions.waitFor({ state: 'detached' })
            assert.equal(await textbox.inputValue(), `${intro} @${user1.fixture.username} `)

            // Post it: the comment shows the mention by User1's name, as a
            // link to their profile.
            await textbox.pressSequentially('is mentioned.')
            const text = `${intro} @${user1.fixture.username} is mentioned.`
            await comments.submitComment(view)
            const comment = await assertCommented(view, intro, user2.fixture, `${intro} @${user1.fixture.name} is mentioned.`)
            const mention = comment.getByRole('link', { name: `@${user1.fixture.name}`, exact: true })
            assert.equal(await mention.getAttribute('href'), `/${user1.fixture.username}`)
            const id = await getIdOf(comment)

            // User1 is notified.
            const notification = getMentionOfUser1(mentioned.page, post, text)
            await waitForNotification(mentioned.page, notification)
            assert.equal(await notification.count(), 1, `Expected one notification of the mention.`)

            // It links to the comment, which is highlighted.
            await notification.click()
            await mentioned.page.waitForURL((url) => url.pathname === permalinkOf(post) && url.hash === `#comment-${id}`)
            await posts.waitForPermalinkPage(mentioned.page)
            const linked = comments.getCommentById(posts.getPostById(mentioned.page, post.id), id)
            assert.equal(await linked.count(), 1, `Expected the notification to open the comment.`)
            await assertHighlighted(linked)
        })

        it(`As a user, I'm notified of mentions and subscribed comments even when someone else involved has blocked the commenter.`, { tags: [ 'full-regression' ] }, async function() {
            const post = await createPostToCommentOn('A post with a block among its commenters')
            const author = await openAs('user1')
            const blocker = await openAs('user3')
            const subscriber = await openAs('user4')
            const commenter = await openAs('user2')

            // User3, then User4, comment, which subscribes them to the post.
            // User3 is notified of User4's comment: they're subscribed.
            await addComment(user3.session, post.id, posts.uniqueText(`User3's comment`))
            const fromUser4 = await addComment(user4.session, post.id, posts.uniqueText(`User4's comment`))
            await waitForNotification(blocker.page, getNotifications(blocker.page, comments.subscriberNotificationText({
                commenter: user4.fixture.name,
                comment: fromUser4.content,
                post: post.content
            })))

            // User3 blocks User2. The block replaces their friendship, which
            // is put back afterwards for the tests that follow.
            await blockUser(user3.session, user3.user.id, user2.user.id)
            try {
                // User2 mentions User3, then User1.
                const text = `@${user3.fixture.username} @${user1.fixture.username} Hello.`
                await comments.commentOn(await openPost(commenter.page, post), text)

                // User1 is notified of the mention.
                const mention = getMentionOfUser1(author.page, post, text)
                await waitForNotification(author.page, mention)
                assert.equal(await mention.count(), 1, `Expected User1 to be notified of the mention.`)

                // User4 is notified of the comment.
                const comment = getNotifications(subscriber.page, comments.subscriberNotificationText({
                    commenter: user2.fixture.name,
                    comment: text,
                    post: post.content
                }))
                await waitForNotification(subscriber.page, comment)
                assert.equal(await comment.count(), 1, `Expected User4 to be notified of the comment.`)

                // User3 isn't notified of it at all. The worker sends all of a
                // comment's notifications together, so with User1's and
                // User4's here, User3's would be too.
                await openNotifications(blocker.page)
                assert.equal(await getNotifications(blocker.page, `"${text.substring(0, 20)}...", on`).count(), 0,
                    `Expected User3 not to be notified of the comment of a user they've blocked.`)
            } finally {
                await clearRelationship(user2.session, user2.user.id, user3.session, user3.user.id)
                await makeFriends(user2.session, user2.user.id, user3.session, user3.user.id)
            }
        })
    })

    describe('Replies', function() {

        it(`As a user, I can reply to another user's comment.`, { tags: [ 'full-regression' ] }, async function() {
            const post = await createPostToCommentOn('A post with a reply')
            const theirs = await addComment(user1.session, post.id, posts.uniqueText('Reply to me.'))
            const mine = posts.uniqueText('Me first.')
            const commenter = await openAs('user2')
            const mentioned = await openAs('user1')
            const page = commenter.page

            const view = await openPost(page, post)
            await comments.commentOn(view, mine)
            const myComment = await assertCommented(view, mine, user2.fixture)

            // User1's comment has a "Reply" link, in its bottom right corner,
            // under what it says, beside its like button. User2's own doesn't.
            const theirComment = comments.getCommentById(view, theirs.id)
            const reply = comments.getReplyLink(theirComment)
            assert.equal(await reply.count(), 1, `Expected a Reply link on User1's comment.`)
            assert.equal(await reply.innerText(), 'Reply')
            assert.equal(await reply.getAttribute('aria-label'), `Reply to ${user1.fixture.name}`)
            const commentBox = await theirComment.boundingBox()
            const contentBox = await comments.getCommentContent(theirComment).boundingBox()
            const replyBox = await reply.boundingBox()
            assert.ok(replyBox.y >= contentBox.y + contentBox.height, `Expected the Reply link under the comment's text.`)
            assert.ok(replyBox.x >= commentBox.x + commentBox.width / 2, `Expected the Reply link on the comment's right.`)
            const likeBox = await theirComment.getByRole('button', { name: 'Like comment', exact: true }).boundingBox()
            assert.ok(Math.abs((likeBox.y + likeBox.height / 2) - (replyBox.y + replyBox.height / 2)) < replyBox.height
                && likeBox.x + likeBox.width <= replyBox.x, `Expected the Reply link beside the comment's like button.`)
            assert.equal(await comments.getReplyLink(myComment).count(), 0, `Expected no Reply link on User2's own comment.`)

            // Reply: a new comment form opens at the end of the thread, with
            // the cursor after a mention of User1.
            await reply.click()
            const form = comments.getCommentForm(view)
            const textbox = comments.getCommentTextbox(form)
            await textbox.waitFor()
            const mention = `@${user1.fixture.username} `
            assert.equal(await textbox.inputValue(), mention)
            const lastBox = await comments.getComments(view).last().boundingBox()
            assert.ok((await form.boundingBox()).y >= lastBox.y + lastBox.height, `Expected the form after the last comment.`)
            assert.deepEqual(await textbox.evaluate((element) => ({
                focused: document.activeElement === element,
                start: element.selectionStart,
                end: element.selectionEnd
            })), { focused: true, start: mention.length, end: mention.length })

            // Finish it, and post it: it's last in the thread, showing the
            // mention by User1's name.
            const replying = posts.uniqueText('Replying.')
            await page.keyboard.type(replying)
            await comments.submitComment(view)
            const text = `${mention}${replying}`
            const replied = await assertCommented(view, replying, user2.fixture, `@${user1.fixture.name} ${replying}`)
            const ids = await comments.getCommentIds(view)
            assert.equal(ids.length, 3)
            assert.equal(ids[2], await getIdOf(replied), `Expected the reply at the end of the thread.`)

            // User1 is notified of the mention.
            const notification = getMentionOfUser1(mentioned.page, post, text)
            await waitForNotification(mentioned.page, notification)
            assert.equal(await notification.count(), 1, `Expected User1 to be notified of the reply.`)
        })

        it(`As a user, replying doesn't discard a comment I'm already writing.`, { tags: [ 'full-regression' ] }, async function() {
            const post = await createPostToCommentOn('A post with a reply to a draft')
            const theirs = await addComment(user1.session, post.id, posts.uniqueText('Reply to me.'))
            const { page } = await openAs('user2')
            const warning = page.getByRole('alert').filter({ hasText: `You're already replying.` })

            const view = await openPost(page, post)
            const reply = comments.getReplyLink(comments.getCommentById(view, theirs.id))
            const form = comments.getCommentForm(view)
            const textbox = comments.getCommentTextbox(form)
            const replying = `Draft in progress. @${user1.fixture.username} `

            // With a draft started, Reply adds the mention to the end of it.
            await comments.writeComment(view, 'Draft in progress.')
            await reply.click()
            await eventually(async () => assert.equal(await textbox.inputValue(), replying))

            // Reply again: it doesn't mention User1 twice, and says why, for a
            // few seconds.
            await reply.click()
            await warning.waitFor()
            assert.equal(await warning.innerText(), `You're already replying.`)
            assert.equal(await textbox.inputValue(), replying)
            await warning.waitFor({ state: 'detached', timeout: 10000 })

            // Reply twice more, the second time while the first's warning is
            // still up: there's one warning, and it lasts its few seconds from
            // the second click, not the first.
            await reply.click()
            await warning.waitFor()
            await page.waitForTimeout(1500)
            await reply.click()
            const lastClick = Date.now()
            assert.equal(await warning.count(), 1, `Expected one warning.`)
            await warning.waitFor({ state: 'detached', timeout: 10000 })
            const shown = Date.now() - lastClick
            assert.ok(shown >= 2500, `Expected the warning to last a few seconds after the last click, but it went after ${shown}ms.`)
            assert.equal(await textbox.inputValue(), replying)

            // Cancel the draft.
            await comments.discardCommentForm(form)
            assert.equal(await comments.getStartCommentLink(view).isVisible(), true)
        })

        it('As a user, replying in a long thread brings the comment form into view.', { tags: [ 'full-regression' ] }, async function() {
            const post = await createPostToCommentOn('A post with a long thread')
            const ids = []
            for (let index = 1; index <= 12; index++) {
                const text = `${posts.uniqueText(`Comment ${index} of a long thread.`)} ${'This thread goes on and on. '.repeat(6)}`
                ids.push((await addComment(user1.session, post.id, text)).id)
            }

            // In a desktop window and a phone-sized one. (Whether the
            // keyboard on a phone leaves the form in view is checked by hand.)
            for (const [ name, viewport ] of Object.entries(config.VIEWPORTS)) {
                const { page } = await openAs('user2', { viewport: viewport })
                const view = await openPost(page, post)
                await comments.getCommentById(view, ids[ids.length - 1]).waitFor()

                // The thread is taller than the window. Go to the top of it.
                const height = await page.evaluate(() => document.documentElement.scrollHeight)
                assert.ok(height > viewport.height * 2, `On ${name}, expected the thread to be taller than the window: the page is ${height} high.`)
                await page.evaluate(() => window.scrollTo(0, 0))

                // Reply to one of the first comments: the form, its buttons
                // and all, is in view below the header, and ready to type in.
                await comments.getReplyLink(comments.getCommentById(view, ids[1])).click()
                const form = comments.getCommentForm(view)
                const textbox = comments.getCommentTextbox(form)
                await textbox.waitFor()
                const header = await page.getByRole('banner').boundingBox()
                const inView = async function(locator, what) {
                    const box = await locator.boundingBox()
                    assert.ok(box.y >= header.y + header.height && box.y + box.height <= viewport.height,
                        `On ${name}, expected the ${what} in view, between ${header.y + header.height} and ${viewport.height}, `
                        + `but it's from ${box.y} to ${box.y + box.height}.`)
                }
                await eventually(async () => {
                    assert.ok(await page.evaluate(() => window.scrollY) > 0, `On ${name}, expected the page to scroll.`)
                    await inView(form, 'comment form')
                    await inView(form.getByRole('button', { name: 'Cancel', exact: true }), 'Cancel button')
                    await inView(form.getByRole('button', { name: 'Comment', exact: true }), 'Comment button')
                })
                assert.equal(await textbox.evaluate((element) => document.activeElement === element), true,
                    `On ${name}, expected the comment form to be focused.`)
            }
        })

        it('As a user, the "Reply" link only appears where I can reply.', { tags: [ 'full-regression' ] }, async function() {
            const post = await createPostToCommentOn('A post with a comment to moderate')
            const theirs = await addComment(user1.session, post.id, posts.uniqueText('A comment to flag'))
            const flagger = await openAs('user2')
            const moderator = await openAs('user-site-admin')
            const page = moderator.page

            // User2 flags User1's comment.
            await comments.flagComment(comments.getCommentById(await openPost(flagger.page, post), theirs.id))

            // In the site moderation queue, it has no Reply link.
            const queued = comments.getCommentById(page, theirs.id)
            await openPage(page, '/admin/moderation')
            await queued.waitFor()
            assert.equal(await comments.getCommentContent(queued).innerText(), theirs.content)
            assert.equal(await comments.getReplyLink(queued).count(), 0, `Expected no Reply link in the moderation queue.`)

            // Seen in context, in the post's thread, it has one.
            await page.getByRole('link', { name: 'View Context', exact: true }).and(page.locator(`[href$="#comment-${theirs.id}"]`)).click()
            await page.waitForURL((url) => url.pathname === permalinkOf(post))
            await posts.waitForPermalinkPage(page)
            const inContext = comments.getCommentById(posts.getPostById(page, post.id), theirs.id)
            assert.equal(await inContext.count(), 1, `Expected the comment in its post's thread.`)
            assert.equal(await comments.getReplyLink(inContext).count(), 1, `Expected a Reply link in the thread.`)

            // Remove it, from the queue. The queue's cards have no role or
            // name, so this one is found by class, as the card with the
            // comment in it.
            await openPage(page, '/admin/moderation')
            await queued.waitFor()
            const card = page.locator('.post-comment-awaiting-admin-moderation').filter({ has: queued })
            await card.getByRole('button', { name: 'Reject', exact: true }).click()
            await queued.waitFor({ state: 'detached' })

            // User2 sees it removed, with no Reply link.
            const view = await openPost(flagger.page, post)
            const removed = comments.getCommentById(view, theirs.id)
            assert.equal(await removed.count(), 1, `Expected the removed comment's place in the thread.`)
            assert.equal(await comments.getCommentContent(removed).innerText(), 'Comment removed by a Site moderator.')
            assert.equal(await view.getByText(theirs.content).count(), 0)
            assert.equal(await comments.getReplyLink(removed).count(), 0, `Expected no Reply link on a removed comment.`)
        })
    })

    describe('Drafts', function() {

        it('As a user, my comment drafts are saved as long as I am logged in.', { tags: [ 'full-regression' ] }, async function() {
            // User1's posts aren't in User2's feed, since they aren't
            // friends, so this draft is on a post of User2's own, which is.
            const post = await createPost(user2.session, user2.user.id, {
                visibility: 'private',
                content: posts.uniqueText('A post with a draft on the feed')
            })
            const draft = posts.uniqueText('A draft')
            const window = await openAs('user2')
            let page = window.page
            let view = posts.getPostById(page, post.id)

            // The post's comment form on the feed, as it opens again: open,
            // with the draft in it.
            const assertDraft = async function() {
                const textbox = comments.getCommentTextbox(comments.getCommentForm(view))
                await textbox.waitFor()
                assert.equal(await textbox.inputValue(), draft)
            }

            // Write a draft on the post, in User2's feed.
            await openPage(page, '/')
            await posts.waitForPostList(page)
            assert.equal(await view.count(), 1, `Expected User2's post in their feed.`)
            await comments.writeComment(view, draft)

            // Navigate away from the feed and back.
            await followHeaderLink(page, 'Friends')
            await page.waitForURL('/friends')
            await followHeaderLink(page, 'Feeds')
            await posts.waitForPostList(page)
            await assertDraft()

            // Close the window, open a new one and load the feed.
            await page.close()
            page = await window.context.newPage()
            view = posts.getPostById(page, post.id)
            await openPage(page, '/')
            await posts.waitForPostList(page)
            await assertDraft()

            // Post it: it's posted, and the draft is gone, after a reload too.
            await comments.submitComment(view)
            await assertCommented(view, draft, user2.fixture)

            await page.reload()
            await posts.waitForPostList(page)
            await comments.getShowCommentsLink(view).click()
            await assertCommented(view, draft, user2.fixture)
            assert.equal(await comments.getStartCommentLink(view).isVisible(), true, `Expected no draft left.`)
        })

        it(`As a user, my comment drafts keep being saved after I've posted a comment.`, { tags: [ 'full-regression' ] }, async function() {
            const post = await createPostToCommentOn('A post with two comments')
            const first = posts.uniqueText('A first comment')
            const draft = posts.uniqueText('A second, in draft')
            const { page } = await openAs('user2')
            const view = await openPost(page, post)
            const textbox = comments.getCommentTextbox(comments.getCommentForm(view))

            // Post a comment, then, without reloading, start another.
            await comments.commentOn(view, first)
            await assertCommented(view, first, user2.fixture)
            await comments.writeComment(view, draft)

            // Reload: the second is still in draft.
            await page.reload()
            await posts.waitForPermalinkPage(page)
            await textbox.waitFor()
            assert.equal(await textbox.inputValue(), draft)

            // Post it: it's posted, and the draft is gone, after a reload too.
            await comments.submitComment(view)
            await assertCommented(view, draft, user2.fixture)

            await page.reload()
            await posts.waitForPermalinkPage(page)
            assert.deepEqual(await getThread(view), [
                { author: user2.fixture.name, content: first },
                { author: user2.fixture.name, content: draft }
            ])
            assert.equal(await comments.getStartCommentLink(view).isVisible(), true, `Expected no draft left.`)
        })

        it('As a user, my comment drafts keep being saved after a comment fails to post.', { tags: [ 'full-regression' ] }, async function() {
            const post = await createPostToCommentOn('A post with a comment that fails')
            const draft = posts.uniqueText('A draft to try')
            const edited = posts.uniqueText('A draft, edited after it failed')
            const { page, context } = await openAs('user2')
            const view = await openPost(page, post)
            const form = comments.getCommentForm(view)
            const textbox = comments.getCommentTextbox(form)
            const error = comments.getCommentErrorDialog(page)

            await comments.writeComment(view, draft)

            // Go offline, and try to post it: it fails, saying so, and the
            // draft stays in the form.
            await context.setOffline(true)
            try {
                await form.getByRole('button', { name: 'Comment', exact: true }).click()
                await error.waitFor()
                assert.match(await error.innerText(), /^Attempt to create comment failed\. This is probably a network error\./)
                await error.getByRole('button', { name: 'Continue', exact: true }).click()
                await error.waitFor({ state: 'detached' })
                assert.equal(await textbox.inputValue(), draft)

                // Edit it.
                await textbox.fill(edited)
            } finally {
                await context.setOffline(false)
            }

            // Back online, reload: the edited draft is in the form, and
            // nothing was posted.
            await page.reload()
            await posts.waitForPermalinkPage(page)
            await textbox.waitFor()
            assert.equal(await textbox.inputValue(), edited)
            assert.equal(await comments.getComments(view).count(), 0)
        })

        it('As a user, my comment drafts are deleted when I log out.', { tags: [ 'full-regression' ] }, async function() {
            const post = await createPostToCommentOn('A post with a draft to lose')
            const draft = posts.uniqueText('A draft to lose')
            // Its own session, since logging out ends it.
            const { page, fixture } = await openAs('user2', { fresh: true })

            const view = await openPost(page, post)
            await comments.writeComment(view, draft)

            await logOut(page)
            await logIn(page, fixture)

            // The draft is gone: the form isn't open, and opens empty.
            await openPost(page, post)
            assert.equal(await comments.getStartCommentLink(view).isVisible(), true, `Expected no draft.`)
            assert.equal(await page.getByText(draft).count(), 0)

            await comments.openCommentForm(view)
            assert.equal(await comments.getCommentTextbox(comments.getCommentForm(view)).inputValue(), '')
        })

        it('As a user, I can cancel a comment draft, which deletes it.', { tags: [ 'full-regression' ] }, async function() {
            const post = await createPostToCommentOn('A post with a draft to cancel')
            const draft = posts.uniqueText('A draft to cancel')
            const { page } = await openAs('user2')
            const view = await openPost(page, post)
            const start = comments.getStartCommentLink(view)

            // The draft is gone: the form isn't open.
            const assertNoDraft = async function() {
                assert.equal(await start.isVisible(), true, `Expected no draft.`)
                assert.equal(await comments.getCommentForm(view).count(), 0)
                assert.equal(await page.getByText(draft).count(), 0)
            }

            await comments.writeComment(view, draft)
            await comments.discardCommentForm(comments.getCommentForm(view))
            await assertNoDraft()

            // Still, after a reload...
            await page.reload()
            await posts.waitForPermalinkPage(page)
            await assertNoDraft()

            // ... and after navigating away and back.
            await followHeaderLink(page, 'Friends')
            await page.waitForURL('/friends')
            await page.goBack()
            await page.waitForURL((url) => url.pathname === permalinkOf(post))
            await posts.waitForPermalinkPage(page)
            await assertNoDraft()

            // The form opens empty.
            await comments.openCommentForm(view)
            assert.equal(await comments.getCommentTextbox(comments.getCommentForm(view)).inputValue(), '')
        })
    })
})
