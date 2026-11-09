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
 * Create Post: documentation/testing/test-cases/Post/create.md
 *
 * The cases that only need text. Not here yet:
 *
 *   - anything that attaches an image or a video;
 *   - links: link previews, YouTube embeds and link drafts, since any link in
 *     a post makes the server scrape the site it points to, so they depend
 *     on third-party sites;
 *   - the Full Regression cases the integration tests cover.
 *
 * The draft cases are run with text only: "(text only)" in a test's name
 * means it covers the text half of a case that also attaches media.
 *
 * Each test is tagged with its suite, from the section its case is in:
 * 'smoke-test' for the Smoke Test, 'full-regression' for the rest (see
 * ../../lib/suites.js).
 ******************************************************************************/

const { describe, it, before, after, afterEach } = require('node:test')
const assert = require('node:assert/strict')

const { loginAs, logout } = require('../../../lib/authentication')
const { deleteAllPostsForUser } = require('../../../lib/posts')
const { makeFriends, clearRelationship } = require('../../../lib/relationships')

const config = require('../../lib/config')
const { startBrowser, stopBrowser, openAs, cleanUp } = require('../../lib/browser')
const { checkSuite } = require('../../lib/suites')
const { getNotificationsButton, openPage, followHeaderLink, logOut, logIn } = require('../../lib/app')
const posts = require('../../lib/posts')
const { eventually } = require('../../lib/wait')

describe('Create Post', function() {

    // API sessions, for setting up and cleaning up. The tests themselves act
    // in the browser.
    let user1 = null
    let user2 = null
    let user3 = null

    before(async function() {
        await startBrowser()

        user1 = await loginAs('user1')
        user2 = await loginAs('user2')
        user3 = await loginAs('user3')

        // User1 has a friend to mention, User2, and User3 is a stranger.
        await clearRelationship(user1.session, user1.user.id, user2.session, user2.user.id)
        await clearRelationship(user1.session, user1.user.id, user3.session, user3.user.id)
        await makeFriends(user1.session, user1.user.id, user2.session, user2.user.id)

        await deleteAllPostsForUser(user1.session, user1.user.id)
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


    it('As a user, I should be able to make a post.', { tags: [ 'smoke-test' ] }, async function() {
        const { page } = await openAs('user1')
        const text = posts.uniqueText('A post from the feed')

        await openPage(page, '/')
        await posts.openPostForm(page)
        await posts.getPostFormTextbox(page).fill(text)
        await posts.submitPost(page, '/')

        // Back on the feed, with the post, by User1.
        assert.equal(new URL(page.url()).pathname, '/')
        await posts.waitForPostList(page)
        const post = posts.getPostByText(page, text)
        assert.equal(await post.count(), 1, `Expected the post on the feed.`)
        assert.equal(await posts.getPostContent(post).innerText(), text)
        assert.equal(await post.getByRole('link', { name: user1.fixture.name, exact: true }).getAttribute('href'),
            `/${user1.fixture.username}`)
    })

    it('As a user, I should be able to mention my friends in a post.', { tags: [ 'smoke-test' ] }, async function() {
        const { page } = await openAs('user1')
        const friend = user2.fixture
        const text = posts.uniqueText('Mentioning a friend')

        await openPage(page, '/')
        await posts.openPostForm(page)

        const textbox = posts.getPostFormTextbox(page)
        const suggestions = page.getByRole('listbox', { name: 'User suggestions' })

        await textbox.pressSequentially(`${text}: `)

        // Start a mention with part of the friend's name. Only friends are
        // suggested: User3's name matches too, but they're a stranger.
        await textbox.pressSequentially('@Test Us')
        await suggestions.getByRole('option').first().waitFor()
        assert.deepEqual(await suggestions.getByRole('option').allInnerTexts(), [ friend.name ])

        // Select it: the mention is completed with the friend's username.
        await textbox.press('Enter')
        await eventually(async () => assert.equal(await suggestions.isVisible(), false,
            `Expected the suggestions to close once one was chosen.`))
        assert.equal(await textbox.inputValue(), `${text}: @${friend.username} `)

        // Start another with the friend's username, and finish typing it
        // without choosing the suggestion. Pausing before the last
        // character, as a person would, lets the suggestions catch up:
        // the list only closes when they include the username typed.
        await textbox.pressSequentially(`and @${friend.username.slice(0, -1)}`)
        await suggestions.getByRole('option').first().waitFor()
        assert.deepEqual(await suggestions.getByRole('option').allInnerTexts(), [ friend.name ])

        await textbox.pressSequentially(friend.username.slice(-1))
        await eventually(async () => assert.equal(await suggestions.isVisible(), false,
            `Expected the suggestions to close once the username was typed in full.`))
        assert.equal(await textbox.inputValue(), `${text}: @${friend.username} and @${friend.username}`)

        await posts.submitPost(page, '/')

        // The post shows both mentions by the friend's name, as links to
        // their profile.
        await posts.waitForPostList(page)
        const post = posts.getPostByText(page, text)
        assert.equal(await post.count(), 1, `Expected the post on the feed.`)
        const mentions = post.getByRole('link', { name: /^@/ })
        await eventually(async () => assert.deepEqual(await mentions.allInnerTexts(), [ `@${friend.name}`, `@${friend.name}` ],
            `Expected both mentions to show the friend's name.`))
        assert.equal(await posts.getPostContent(post).innerText(), `${text}: @${friend.name} and @${friend.name}`)
        for (const mention of await mentions.all()) {
            assert.equal(await mention.getAttribute('href'), `/${friend.username}`)
        }
    })

    it('As a user, I should be able to post long strings without breaking the app.', { tags: [ 'full-regression' ] }, async function() {
        const { page } = await openAs('user1')
        const text = `${posts.uniqueText('A long unbroken string:')} ${'a'.repeat(600)}`

        await openPage(page, '/')
        await posts.openPostForm(page)
        await posts.getPostFormTextbox(page).fill(text)
        await posts.submitPost(page, '/')

        await posts.waitForPostList(page)
        const post = posts.getPostByText(page, text)
        assert.equal(await post.count(), 1, `Expected the post on the feed.`)
        assert.equal(await posts.getPostContent(post).innerText(), text)

        // Neither the post nor the page grows wider than the window, on
        // a desktop or on a phone.
        for (const [ name, viewport ] of Object.entries(config.VIEWPORTS)) {
            await page.setViewportSize(viewport)
            await eventually(async () => {
                const box = await post.boundingBox()
                assert.ok(box.x >= 0 && box.x + box.width <= viewport.width,
                    `On ${name}, the post (${box.x} to ${box.x + box.width}) runs outside the window (0 to ${viewport.width}).`)

                const widths = await page.evaluate(() => ({
                    content: document.documentElement.scrollWidth,
                    window: document.documentElement.clientWidth
                }))
                assert.ok(widths.content <= widths.window,
                    `On ${name}, the page scrolls sideways: it's ${widths.content} wide in a ${widths.window} window.`)
            })
        }
    })

    describe('Post Drafts', function() {

        it('As a user, I can draft a post and it will be saved across reloads until I post it. (text only)', { tags: [ 'full-regression' ] }, async function() {
            const window = await openAs('user1')
            let page = window.page
            const draft = posts.uniqueText('A draft')

            await openPage(page, '/')
            await posts.openPostForm(page)
            await posts.getPostFormTextbox(page).fill(draft)

            // Navigate away from the feed and back. The create post link
            // shows the draft, and the form has it.
            await followHeaderLink(page, 'Friends')
            await page.waitForURL('/friends')
            await followHeaderLink(page, 'Feeds')
            await posts.waitForPostList(page)
            assert.equal(await posts.getCreatePostLink(page).innerText(), draft)

            await posts.openPostForm(page)
            assert.equal(await posts.getPostFormTextbox(page).inputValue(), draft)
            await followHeaderLink(page, 'Feeds')

            // Close the window, open a new one and load the feed. The draft
            // is still there.
            await page.close()
            page = await window.context.newPage()
            await openPage(page, '/')
            await posts.waitForPostList(page)
            assert.equal(await posts.getCreatePostLink(page).innerText(), draft)

            await posts.openPostForm(page)
            assert.equal(await posts.getPostFormTextbox(page).inputValue(), draft)

            // Post it: it's on the feed, and no longer a draft.
            await posts.submitPost(page, '/')
            await posts.waitForPostList(page)
            const post = posts.getPostByText(page, draft)
            assert.equal(await post.count(), 1, `Expected the post on the feed.`)
            assert.equal(await posts.getPostContent(post).innerText(), draft)
            assert.equal(await posts.getCreatePostLink(page).innerText(), 'Write a new post to your feed...')
        })

        it('As a user, my drafts are cleared out when I log out. (text only)', { tags: [ 'full-regression' ] }, async function() {
            // Its own session, since logging out ends it.
            const { page, fixture } = await openAs('user1', { fresh: true })
            const draft = posts.uniqueText('A draft to lose')

            await openPage(page, '/')
            await posts.openPostForm(page)
            await posts.getPostFormTextbox(page).fill(draft)
            await followHeaderLink(page, 'Feeds')
            await posts.waitForPostList(page)
            assert.equal(await posts.getCreatePostLink(page).innerText(), draft)

            await logOut(page)
            await logIn(page, fixture)
            await openPage(page, '/')

            // The draft is gone, from the create post link and the form.
            await posts.waitForPostList(page)
            assert.equal(await posts.getCreatePostLink(page).innerText(), 'Write a new post to your feed...')

            await posts.openPostForm(page)
            assert.equal(await posts.getPostFormTextbox(page).inputValue(), '')
        })
    })

    describe('Public Posts', function() {

        it('As a user, mentioning someone in a post notifies them.', { tags: [ 'full-regression' ] }, async function() {
            const author = await openAs('user1')
            const mentioned = await openAs('user2')

            // The notification quotes the post's first 20 characters,
            // which uniqueText() makes unique to this post.
            const intro = posts.uniqueText('Hi')
            assert.ok(intro.length <= 20, `The post has to be told apart by its first 20 characters, but its label is ${intro.length}.`)
            const text = `${intro} @${mentioned.fixture.username}, this is for you.`

            await openPage(author.page, '/')
            await posts.openPostForm(author.page)
            await posts.getPostFormTextbox(author.page).fill(text)
            await posts.submitPost(author.page, '/')
            await posts.waitForPostList(author.page)
            const post = posts.getPostByText(author.page, intro)
            assert.equal(await post.count(), 1, `Expected the post on the feed.`)
            const id = await post.getAttribute('id')

            // The worker sends the notification, so it may take a moment to
            // arrive: open the notification menu until it's there.
            const page = mentioned.page
            const notifications = getNotificationsButton(page)
            const notification = page.getByRole('menuitem').filter({ hasText: `mentioned you in their post, "${intro}` })
            await eventually(async () => {
                await openPage(page, '/')
                await notifications.click()
                await notification.waitFor({ timeout: 1000 })
            }, { timeout: Math.max(config.TIMEOUT, 30000) })

            assert.match(await notifications.getAttribute('aria-label'), /^Notifications, [1-9]\d* unread$/)
            assert.equal(await notification.innerText(),
                `${author.fixture.name} mentioned you in their post, "${text.substring(0, 20)}...".`)

            // It links to the post.
            await notification.click()
            await posts.waitForPermalinkPage(page)
            assert.equal(new URL(page.url()).pathname, `/${author.fixture.username}/${id}`)
            // The mention shows the username until the user has loaded, and
            // then their name.
            await eventually(async () => assert.equal(await posts.getPostContent(posts.getPostById(page, id)).innerText(),
                `${intro} @${mentioned.fixture.name}, this is for you.`))
        })
    })
})
