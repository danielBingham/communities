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
 ******************************************************************************/

const { describe, it, before, after, afterEach } = require('node:test')
const assert = require('node:assert/strict')

const { loginAs, logout } = require('../../../lib/authentication')
const { deleteAllPostsForUser } = require('../../../lib/posts')
const { makeFriends, clearRelationship } = require('../../../lib/relationships')

const config = require('../../lib/config')
const { startBrowser, stopBrowser, openAs, cleanUp } = require('../../lib/browser')
const { openPage, followHeaderLink, logOut, logIn } = require('../../lib/app')
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

    describe('Smoke Test', function() {

        it('As a user, I should be able to make a post.', async function() {
            const { page } = await openAs('user1')
            const text = posts.uniqueText('A post from the feed')

            await openPage(page, '/')
            await posts.openPostForm(page)
            await posts.postTextbox(page).fill(text)
            await posts.submitPost(page, '/')

            // Back on the feed, with the post.
            const post = posts.findPost(page, text)
            await post.waitFor()
            await post.getByRole('link', { name: user1.fixture.name }).waitFor()
        })

        it('As a user, I should be able to mention my friends in a post.', async function() {
            const { page } = await openAs('user1')
            const friend = user2.fixture
            const text = posts.uniqueText('Mentioning a friend')

            await openPage(page, '/')
            await posts.openPostForm(page)

            const textbox = posts.postTextbox(page)
            const suggestions = page.getByRole('listbox', { name: 'User suggestions' })

            await textbox.pressSequentially(`${text}: `)

            // Start a mention with part of the friend's name.
            await textbox.pressSequentially('@Test Us')
            await suggestions.getByRole('option', { name: friend.name, exact: true }).waitFor()
            // Only friends are suggested: User3's name matches too, but
            // they're a stranger.
            assert.deepEqual(await suggestions.getByRole('option').allTextContents(), [ friend.name ],
                `Expected only User1's friend to be suggested.`)

            // Select it.
            await textbox.press('Enter')
            await suggestions.waitFor({ state: 'hidden' })
            await eventually(async () => assert.equal(await textbox.inputValue(), `${text}: @${friend.username} `))

            // Start another with the friend's username, and finish typing it
            // without choosing the suggestion. Pausing before the last
            // character, as a person would, lets the suggestions catch up:
            // the list only closes when they include the username typed.
            await textbox.pressSequentially(`and @${friend.username.slice(0, -1)}`)
            await suggestions.getByRole('option', { name: friend.name, exact: true }).waitFor()
            await textbox.pressSequentially(friend.username.slice(-1))
            await suggestions.waitFor({ state: 'hidden' })

            await posts.submitPost(page, '/')

            // Both mentions are links to the friend's profile.
            const post = posts.findPost(page, text)
            const mentions = post.getByRole('link', { name: `@${friend.name}`, exact: true })
            await eventually(async () => assert.equal(await mentions.count(), 2))
            for (const mention of await mentions.all()) {
                assert.equal(await mention.getAttribute('href'), `/${friend.username}`)
            }
        })
    })

    describe('Manual Regression', function() {

        it('As a user, I should be able to post long strings without breaking the app.', async function() {
            const { page } = await openAs('user1')
            const text = posts.uniqueText('A long unbroken string:')
            const unbroken = 'a'.repeat(600)

            await openPage(page, '/')
            await posts.openPostForm(page)
            await posts.postTextbox(page).fill(`${text} ${unbroken}`)
            await posts.submitPost(page, '/')

            const post = posts.findPost(page, text)
            await post.waitFor()

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

            it('As a user, I can draft a post and it will be saved across reloads until I post it. (text only)', async function() {
                const window = await openAs('user1')
                let page = window.page
                const draft = posts.uniqueText('A draft')

                await openPage(page, '/')
                await posts.openPostForm(page)
                await posts.postTextbox(page).fill(draft)

                // Navigate away from the feed and back.
                await followHeaderLink(page, 'Friends')
                await page.waitForURL('/friends')
                await followHeaderLink(page, 'Feeds')

                // The create post link shows the draft, and the form has it.
                await posts.openPostForm(page, draft)
                await eventually(async () => assert.equal(await posts.postTextbox(page).inputValue(), draft))
                await followHeaderLink(page, 'Feeds')

                // Close the window, open a new one and load the feed.
                await page.close()
                page = await window.context.newPage()
                await openPage(page, '/')

                await posts.openPostForm(page, draft)
                await eventually(async () => assert.equal(await posts.postTextbox(page).inputValue(), draft))

                // Post it.
                await posts.submitPost(page, '/')
                await posts.findPost(page, draft).waitFor()

                // Posted, it's no longer a draft.
                await posts.createPostLink(page).waitFor()
                assert.equal(await posts.createPostLink(page, draft).count(), 0)
            })

            it('As a user, my drafts are cleared out when I log out. (text only)', async function() {
                // Its own session, since logging out ends it.
                const { page, fixture } = await openAs('user1', { fresh: true })
                const draft = posts.uniqueText('A draft to lose')

                await openPage(page, '/')
                await posts.openPostForm(page)
                await posts.postTextbox(page).fill(draft)
                await followHeaderLink(page, 'Feeds')
                await posts.createPostLink(page, draft).waitFor()

                await logOut(page)
                await logIn(page, fixture)
                await openPage(page, '/')

                await posts.createPostLink(page).waitFor()
                assert.equal(await posts.createPostLink(page, draft).count(), 0)

                await posts.openPostForm(page)
                assert.equal(await posts.postTextbox(page).inputValue(), '')
            })
        })
    })

    describe('Full Regression', function() {

        describe('Public Posts', function() {

            it('As a user, mentioning someone in a post notifies them.', async function() {
                const author = await openAs('user1')
                const mentioned = await openAs('user2')

                // The notification quotes the post's first 20 characters,
                // which uniqueText() makes unique to this post.
                const intro = posts.uniqueText('Hi')
                assert.ok(intro.length <= 20, `The post has to be told apart by its first 20 characters, but its label is ${intro.length}.`)
                const text = `${intro} @${mentioned.fixture.username}, this is for you.`

                await openPage(author.page, '/')
                await posts.openPostForm(author.page)
                await posts.postTextbox(author.page).fill(text)
                await posts.submitPost(author.page, '/')
                await posts.findPost(author.page, intro).waitFor()

                // The worker sends the notification, so it may take a moment
                // to arrive: check the notification menu until it does.
                const page = mentioned.page
                const notification = page.getByRole('menuitem')
                    .filter({ hasText: `${author.fixture.name} mentioned you in their post, "${intro}` })
                await eventually(async () => {
                    await openPage(page, '/')
                    await page.getByRole('banner').getByRole('button', { name: /^Notifications, \d+ unread$/ }).click()
                    await notification.waitFor({ timeout: 1000 })
                }, { timeout: Math.max(config.TIMEOUT, 30000) })

                // It links to the post.
                await notification.click()
                await posts.findPost(page, intro).waitFor()
                assert.equal(new URL(page.url()).pathname.startsWith(`/${author.fixture.username}/`), true,
                    `Expected the notification to open the post's permalink, but it opened ${page.url()}.`)
            })
        })
    })
})
