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
 * Every case but the YouTube ones, which would depend on YouTube, and the
 * ones the integration tests cover. The links are to the Communities News
 * posts in ../../../lib/linkPreviews.js, and the media are the files in
 * ../../../lib/fixtures/assets.
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
const { patchUser, restoreUserSettings } = require('../../../lib/users')
const { NEWS_LINKS } = require('../../../lib/linkPreviews')
const { getMedia, getCorruptedMedia } = require('../../../lib/fixtures/media')

const config = require('../../lib/config')
const { startBrowser, stopBrowser, openAs, cleanUp } = require('../../lib/browser')
const { checkSuite } = require('../../lib/suites')
const { getNotificationsButton, openPage, followHeaderLink, logOut, logIn } = require('../../lib/app')
const posts = require('../../lib/posts')
const media = require('../../lib/media')
const { eventually } = require('../../lib/wait')

// Processing scales images and videos down to this width for posts.
const PROCESSED_WIDTH = 650

describe('Create Post', function() {

    // API sessions, for setting up and cleaning up. The tests themselves act
    // in the browser.
    let user1 = null
    let user2 = null
    let user3 = null
    let admin = null

    before(async function() {
        await startBrowser()

        user1 = await loginAs('user1')
        user2 = await loginAs('user2')
        user3 = await loginAs('user3')
        admin = await loginAs('user-site-admin')

        // User1 has a friend to mention, User2, and User3 is a stranger.
        await clearRelationship(user1.session, user1.user.id, user2.session, user2.user.id)
        await clearRelationship(user1.session, user1.user.id, user3.session, user3.user.id)
        await makeFriends(user1.session, user1.user.id, user2.session, user2.user.id)

        await deleteAllPostsForUser(user1.session, user1.user.id)
        await deleteAllPostsForUser(user2.session, user2.user.id)
        await deleteAllPostsForUser(admin.session, admin.user.id)
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
        if ( user3 ) await logout(user3.session)
        if ( admin ) {
            await deleteAllPostsForUser(admin.session, admin.user.id)
            await logout(admin.session)
        }
    })

    // Write `text` in the post form, attach `files` (from getMedia()), and
    // post it from the feed. Returns the post, on the feed.
    const postFromFeed = async function(page, text, files = []) {
        await openPage(page, '/')
        await posts.openPostForm(page)
        await posts.getPostFormTextbox(page).fill(text)
        if ( files.length > 0 ) {
            await media.attachMedia(page, files)
        }
        await posts.submitPost(page, '/')
        await posts.waitForPostList(page)
        return posts.getPostByText(page, text)
    }

    // The ids of the Files a post's gallery shows, in order, read by paging
    // through it. Each image is loaded before it's read, and the gallery is
    // left on the last.
    const getGalleryFileIds = async function(post) {
        await media.getGalleryPosition(post).waitFor()
        const total = Number((await media.getGalleryPosition(post).innerText()).split(' / ')[1])
        const ids = []
        for (let index = 1; index <= total; index++) {
            await eventually(async () => assert.equal(await media.getGalleryPosition(post).innerText(), `${index} / ${total}`))
            await media.waitForMedia(media.getShownMedia(post))
            ids.push(await media.getFileId(media.getShownMedia(post)))
            if ( index < total ) {
                await media.getNextItemButton(post).click()
            }
        }
        return ids
    }

    it('As a user, I should be able to make a post.', { tags: [ 'smoke-test', 'full-regression' ] }, async function() {
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

    it('As a user, I should get a preview generated for the first link added in the post body.', { tags: [ 'smoke-test', 'full-regression' ] }, async function() {
        const { page, context } = await openAs('user1')
        const first = NEWS_LINKS.protocols
        const second = NEWS_LINKS.enshittification
        const intro = posts.uniqueText('A post with a link')
        const textbox = posts.getPostFormTextbox(page)
        const preview = media.getLinkPreview(page)

        await openPage(page, '/')
        await posts.openPostForm(page)
        await textbox.fill(`${intro} ${first.url}`)

        // The link gets a preview, and the form stops offering to attach
        // images and videos.
        await media.waitForLinkPreview(page)
        assert.equal(await preview.count(), 1, `Expected one link preview.`)
        assert.equal(await media.getLinkPreviewTitle(preview).innerText(), first.title)
        assert.equal(await media.getLinkPreviewSite(preview).innerText(), first.siteName)
        assert.equal(await preview.getAttribute('href'), first.url)
        assert.equal(await media.getAddImageButton(page).count(), 0)
        assert.equal(await media.getAddVideoButton(page).count(), 0)

        // Remove it: it's gone, and images and videos can be attached again.
        await media.removeLinkPreview(page)
        assert.equal(await preview.count(), 0)
        assert.equal(await media.getAddImageButton(page).isVisible(), true)
        assert.equal(await media.getAddVideoButton(page).isVisible(), true)

        // Add another link: it gets the preview, since the first was
        // removed.
        const text = `${intro} ${first.url} and ${second.url}`
        await textbox.fill(text)
        await media.waitForLinkPreview(page)
        assert.equal(await preview.count(), 1, `Expected one link preview.`)
        assert.equal(await media.getLinkPreviewTitle(preview).innerText(), second.title)
        assert.equal(await preview.getAttribute('href'), second.url)

        // Post it: the post shows the second link's preview.
        await posts.submitPost(page, '/')
        await posts.waitForPostList(page)
        const post = posts.getPostByText(page, intro)
        assert.equal(await post.count(), 1, `Expected the post on the feed.`)
        assert.equal(await posts.getPostContent(post).innerText(), text)

        const posted = media.getLinkPreview(post)
        await posted.waitFor()
        assert.equal(await posted.count(), 1, `Expected the post to show one link preview.`)
        assert.equal(await media.getLinkPreviewTitle(posted).innerText(), second.title)
        assert.equal(await media.getLinkPreviewSite(posted).innerText(), second.siteName)
        assert.equal(await posted.getAttribute('href'), second.url)

        // Clicking it opens the link in a new tab. The link is on
        // production, which the windows don't let the page reach (see
        // ../../lib/browser.js), so the tab goes no further than asking for
        // it: the request is what's checked.
        const [ tab, request ] = await Promise.all([
            context.waitForEvent('page'),
            context.waitForEvent('request', (request) => request.url() === second.url),
            posted.click()
        ])
        assert.notEqual(tab, page, `Expected the link to open in a new tab.`)
        assert.equal(request.isNavigationRequest(), true, `Expected the new tab to open the link.`)
        assert.equal(new URL(page.url()).pathname, '/', `Expected the feed to stay open.`)
    })

    it('As a user, I should be able to make a post and attach one or more images.', { tags: [ 'smoke-test', 'full-regression' ] }, async function() {
        const { page } = await openAs('user1')
        const images = [ getMedia('image-1'), getMedia('image-2'), getMedia('image-3') ]
        const text = posts.uniqueText('A post with three images')

        await openPage(page, '/')
        await posts.openPostForm(page)
        await posts.getPostFormTextbox(page).fill(text)

        // One image: it's uploaded and processed (scaled down to the width
        // posts show) before it's shown.
        await media.attachMedia(page, [ images[0] ])
        assert.equal(await media.getDraftFiles(page).count(), 1)
        const first = media.getDraftFile(page, images[0].name)
        assert.equal(await first.count(), 1, `Expected ${images[0].name} in the post form.`)
        assert.equal((await media.getMediaSize(media.getMediaIn(first))).width, PROCESSED_WIDTH)

        // Two more at once: the same, after the first.
        await media.attachMedia(page, images.slice(1))
        assert.equal(await media.getDraftFiles(page).count(), 3)
        for (const [ index, image ] of images.entries()) {
            const draftFile = media.getDraftFiles(page).nth(index)
            assert.equal(await media.getDraftFile(page, image.name).getAttribute('id'), await draftFile.getAttribute('id'),
                `Expected ${image.name} to be attachment ${index + 1}.`)
            assert.equal((await media.getMediaSize(media.getMediaIn(draftFile))).width, PROCESSED_WIDTH)
        }
        const ids = await media.getDraftFileIds(page)

        // Post it: the post has a gallery of the three, in the order they
        // were added.
        await posts.submitPost(page, '/')
        await posts.waitForPostList(page)
        const post = posts.getPostByText(page, text)
        assert.equal(await post.count(), 1, `Expected the post on the feed.`)
        assert.equal(await posts.getPostContent(post).innerText(), text)
        assert.equal(await media.getGallery(post).count(), 1, `Expected the post to have a gallery.`)
        assert.deepEqual(await getGalleryFileIds(post), ids)
        assert.equal((await media.getMediaSize(media.getShownMedia(post))).width, PROCESSED_WIDTH)
    })

    it('As a user, I should be able to attach a video to a post.', { tags: [ 'smoke-test', 'full-regression' ] }, async function() {
        const { page } = await openAs('user1')
        const video = getMedia('video')
        const text = posts.uniqueText('A post with a video')

        await openPage(page, '/')
        await posts.openPostForm(page)
        await posts.getPostFormTextbox(page).fill(text)

        // The video is uploaded and processed (scaled down to the width
        // posts show), then shown in a player.
        await media.attachMedia(page, [ video ])
        const draftFile = media.getDraftFile(page, video.name)
        assert.equal(await draftFile.count(), 1, `Expected ${video.name} in the post form.`)
        assert.equal(await media.getPlayVideoButton(draftFile).isVisible(), true)
        const player = draftFile.locator('video')
        assert.equal((await media.getMediaSize(player)).width, PROCESSED_WIDTH)
        const [ id ] = await media.getDraftFileIds(page)

        // It plays.
        await media.playVideo(draftFile)
        const started = (await media.getPlayback(player)).currentTime
        await eventually(async () => {
            const playback = await media.getPlayback(player)
            assert.equal(playback.error, null)
            assert.equal(playback.paused, false)
            assert.ok(playback.currentTime >= started + 1, `Expected the video to keep playing: it's at ${playback.currentTime}s.`)
        })

        // Post it: the post shows the video, which plays.
        await posts.submitPost(page, '/')
        await posts.waitForPostList(page)
        const post = posts.getPostByText(page, text)
        assert.equal(await post.count(), 1, `Expected the post on the feed.`)
        assert.equal(await posts.getPostContent(post).innerText(), text)
        const shown = media.getShownMedia(post)
        await media.waitForMedia(shown)
        assert.equal(await media.getFileId(shown), id)

        await media.playVideo(post)
        await eventually(async () => {
            const playback = await media.getPlayback(shown)
            assert.equal(playback.error, null)
            assert.equal(playback.paused, false)
            assert.ok(playback.currentTime >= 1, `Expected the video to keep playing: it's at ${playback.currentTime}s.`)
        })
        assert.equal((await media.getMediaSize(shown)).width, PROCESSED_WIDTH)
    })

    it('As a user, I should be able to mention my friends in a post.', { tags: [ 'smoke-test', 'full-regression' ] }, async function() {
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

    it('As a user, I should be able to reorder the images I attach.', { tags: [ 'full-regression' ] }, async function() {
        const { page } = await openAs('user1')
        const images = [ getMedia('image-1'), getMedia('image-2'), getMedia('image-3') ]
        const text = posts.uniqueText('A post with reordered images')

        // The attachments are large: make the window tall enough to drag
        // them from one end to the other.
        await page.setViewportSize({ width: config.VIEWPORTS.desktop.width, height: 2000 })

        await openPage(page, '/')
        await posts.openPostForm(page)
        await posts.getPostFormTextbox(page).fill(text)
        await media.attachMedia(page, images)
        const [ first, second, third ] = await media.getDraftFileIds(page)
        for (const [ index, image ] of images.entries()) {
            assert.equal(await media.getDraftFile(page, image.name).getAttribute('id'), [ first, second, third ][index],
                `Expected ${image.name} to be attachment ${index + 1}.`)
        }

        // Drag the last to the top: it's first.
        await media.moveDraftFile(page, 2, 0)
        assert.deepEqual(await media.getDraftFileIds(page), [ third, first, second ])

        // Drag the second down to the last spot: it's last.
        await media.moveDraftFile(page, 1, 2)
        assert.deepEqual(await media.getDraftFileIds(page), [ third, second, first ])

        // Post it: the gallery is in the same order. This is what checks
        // the form kept the order, rather than just showing it (see
        // moveDraftFile()).
        await posts.submitPost(page, '/')
        await posts.waitForPostList(page)
        const post = posts.getPostByText(page, text)
        assert.equal(await post.count(), 1, `Expected the post on the feed.`)
        assert.deepEqual(await getGalleryFileIds(post), [ third, second, first ])
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
            await assertFitsWindow(page, post, name, viewport)
        }
    })

    it(`As a user, I'm asked before a post I've started is discarded.`, { tags: [ 'full-regression' ] }, async function() {
        const { page } = await openAs('user1')
        const image = getMedia('image-1')
        const text = posts.uniqueText('A post to discard')
        const textbox = posts.getPostFormTextbox(page)
        const dialog = posts.getDiscardDialog(page)

        // With nothing written, Cancel goes back to the feed without
        // asking.
        await openPage(page, '/')
        await posts.openPostForm(page)
        await page.getByRole('button', { name: 'Cancel', exact: true }).click()
        await page.waitForURL((url) => url.pathname === '/')
        await posts.waitForPostList(page)
        assert.equal(await dialog.count(), 0)

        // With text and an image, it asks.
        await posts.openPostForm(page)
        await textbox.fill(text)
        await media.attachMedia(page, [ image ])
        await page.getByRole('button', { name: 'Cancel', exact: true }).click()
        await dialog.waitFor()
        assert.equal(await dialog.isVisible(), true, `Expected to be asked whether to discard the post.`)

        // Keep editing: the form has both still.
        await dialog.getByRole('button', { name: 'Keep Editing', exact: true }).click()
        await dialog.waitFor({ state: 'detached' })
        assert.equal(new URL(page.url()).pathname, '/create')
        assert.equal(await textbox.inputValue(), text)
        assert.equal(await media.getDraftFile(page, image.name).count(), 1, `Expected the image to stay attached.`)

        // Discard it: back to the feed, and the form starts over.
        await posts.discardPostForm(page)
        await posts.waitForPostList(page)
        assert.equal(new URL(page.url()).pathname, '/')
        assert.equal(await posts.getCreatePostLink(page).innerText(), 'Write a new post to your feed...')
        assert.equal(await posts.getPostByText(page, text).count(), 0)

        await posts.openPostForm(page)
        assert.equal(await textbox.inputValue(), '')
        assert.equal(await media.getDraftFiles(page).count(), 0)
    })

    describe('Post Drafts', function() {

        it('As a user, I can draft a post and it will be saved across reloads until I post it.', { tags: [ 'full-regression' ] }, async function() {
            const window = await openAs('user1')
            let page = window.page
            const draft = posts.uniqueText('A draft')

            await openPage(page, '/')
            await posts.openPostForm(page)
            await posts.getPostFormTextbox(page).fill(draft)
            await media.attachMedia(page, [ getMedia('image-1') ])
            const ids = await media.getDraftFileIds(page)

            // The form, as it opens again: the draft's text and image.
            const assertDraft = async function() {
                assert.equal(await posts.getPostFormTextbox(page).inputValue(), draft)
                const attached = media.getDraftFiles(page)
                await media.getRemoveFileButton(attached.first()).waitFor()
                assert.deepEqual(await media.getDraftFileIds(page), ids)
                assert.equal((await media.getMediaSize(media.getMediaIn(attached.first()))).width, PROCESSED_WIDTH)
            }

            // Navigate away from the feed and back. The create post link
            // shows the draft, and the form has it.
            await followHeaderLink(page, 'Friends')
            await page.waitForURL('/friends')
            await followHeaderLink(page, 'Feeds')
            await posts.waitForPostList(page)
            assert.equal(await posts.getCreatePostLink(page).innerText(), draft)

            await posts.openPostForm(page)
            await assertDraft()
            await followHeaderLink(page, 'Feeds')

            // Close the window, open a new one and load the feed. The draft
            // is still there.
            await page.close()
            page = await window.context.newPage()
            await openPage(page, '/')
            await posts.waitForPostList(page)
            assert.equal(await posts.getCreatePostLink(page).innerText(), draft)

            await posts.openPostForm(page)
            await assertDraft()

            // Post it: it's on the feed, with its image, and no longer a
            // draft.
            await posts.submitPost(page, '/')
            await posts.waitForPostList(page)
            const post = posts.getPostByText(page, draft)
            assert.equal(await post.count(), 1, `Expected the post on the feed.`)
            assert.equal(await posts.getPostContent(post).innerText(), draft)
            const shown = media.getShownMedia(post)
            await media.waitForMedia(shown)
            assert.equal(await media.getFileId(shown), ids[0])
            assert.equal(await posts.getCreatePostLink(page).innerText(), 'Write a new post to your feed...')
        })

        it('As a user, my drafts are cleared out when I log out.', { tags: [ 'full-regression' ] }, async function() {
            // Its own session, since logging out ends it.
            const { page, fixture } = await openAs('user1', { fresh: true })
            const draft = posts.uniqueText('A draft to lose')

            await openPage(page, '/')
            await posts.openPostForm(page)
            await posts.getPostFormTextbox(page).fill(draft)
            await media.attachMedia(page, [ getMedia('image-1') ])
            await followHeaderLink(page, 'Feeds')
            await posts.waitForPostList(page)
            assert.equal(await posts.getCreatePostLink(page).innerText(), draft)

            await logOut(page)
            await logIn(page, fixture)
            await openPage(page, '/')

            // The draft is gone, from the create post link and the form:
            // no text, and no image.
            await posts.waitForPostList(page)
            assert.equal(await posts.getCreatePostLink(page).innerText(), 'Write a new post to your feed...')

            await posts.openPostForm(page)
            assert.equal(await posts.getPostFormTextbox(page).inputValue(), '')
            assert.equal(await media.getDraftFiles(page).count(), 0)
        })

        it('As a user, I can draft a post with a link and it will be saved across reloads.', { tags: [ 'full-regression' ] }, async function() {
            const window = await openAs('user1')
            let page = window.page
            const link = NEWS_LINKS.protocols
            const draft = `${posts.uniqueText('A draft with a link')} ${link.url}`

            await openPage(page, '/')
            await posts.openPostForm(page)
            await posts.getPostFormTextbox(page).fill(draft)
            await media.waitForLinkPreview(page)

            // The form, as it opens again: the draft's text and preview.
            const assertDraft = async function() {
                assert.equal(await posts.getPostFormTextbox(page).inputValue(), draft)
                await media.waitForLinkPreview(page)
                const preview = media.getLinkPreview(page)
                assert.equal(await preview.count(), 1, `Expected the draft's link preview.`)
                assert.equal(await media.getLinkPreviewTitle(preview).innerText(), link.title)
                assert.equal(await preview.getAttribute('href'), link.url)
            }

            // Navigate away from the feed and back.
            await followHeaderLink(page, 'Friends')
            await page.waitForURL('/friends')
            await followHeaderLink(page, 'Feeds')
            await posts.waitForPostList(page)
            assert.equal(await posts.getCreatePostLink(page).innerText(), draft)

            await posts.openPostForm(page)
            await assertDraft()
            await followHeaderLink(page, 'Feeds')

            // Close the window, open a new one and load the feed.
            await page.close()
            page = await window.context.newPage()
            await openPage(page, '/')
            await posts.waitForPostList(page)
            assert.equal(await posts.getCreatePostLink(page).innerText(), draft)

            await posts.openPostForm(page)
            await assertDraft()

            // Post it: it's on the feed with its preview.
            await posts.submitPost(page, '/')
            await posts.waitForPostList(page)
            const post = posts.getPostByText(page, draft)
            assert.equal(await post.count(), 1, `Expected the post on the feed.`)
            assert.equal(await posts.getPostContent(post).innerText(), draft)
            const preview = media.getLinkPreview(post)
            await preview.waitFor()
            assert.equal(await media.getLinkPreviewTitle(preview).innerText(), link.title)
            assert.equal(await preview.getAttribute('href'), link.url)
            assert.equal(await posts.getCreatePostLink(page).innerText(), 'Write a new post to your feed...')
        })

        it('As a user, my link drafts are cleared out when I log out.', { tags: [ 'full-regression' ] }, async function() {
            // Its own session, since logging out ends it.
            const { page, fixture } = await openAs('user1', { fresh: true })
            const draft = `${posts.uniqueText('A link draft to lose')} ${NEWS_LINKS.protocols.url}`

            await openPage(page, '/')
            await posts.openPostForm(page)
            await posts.getPostFormTextbox(page).fill(draft)
            await media.waitForLinkPreview(page)
            await followHeaderLink(page, 'Feeds')
            await posts.waitForPostList(page)
            assert.equal(await posts.getCreatePostLink(page).innerText(), draft)

            await logOut(page)
            await logIn(page, fixture)
            await openPage(page, '/')

            // The draft is gone: no text, and no preview.
            await posts.waitForPostList(page)
            assert.equal(await posts.getCreatePostLink(page).innerText(), 'Write a new post to your feed...')

            await posts.openPostForm(page)
            assert.equal(await posts.getPostFormTextbox(page).inputValue(), '')
            assert.equal(await media.getLinkPreview(page).count(), 0)
        })
    })

    describe('Links', function() {

        it('As a user, links in the post body are highlighted.', { tags: [ 'full-regression' ] }, async function() {
            const { page } = await openAs('user1')
            const full = NEWS_LINKS.protocols.url
            // The same link without its scheme, which the app links with
            // http://.
            const incomplete = NEWS_LINKS.enshittification.url.replace(/^https:\/\//, '')

            for (const [ label, link, href ] of [ [ 'A full link:', full, full ], [ 'An incomplete link:', incomplete, `http://${incomplete}` ] ]) {
                const text = `${posts.uniqueText(label)} ${link} is a link.`
                const post = await postFromFeed(page, text)
                assert.equal(await post.count(), 1, `Expected the post on the feed.`)
                assert.equal(await posts.getPostContent(post).innerText(), text)

                // The link, in the text, is a link, which opens in a new tab.
                const highlighted = posts.getPostContent(post).getByRole('link', { name: link, exact: true })
                assert.equal(await highlighted.count(), 1, `Expected '${link}' to be a link.`)
                assert.equal(await highlighted.getAttribute('href'), href)
                assert.equal(await highlighted.getAttribute('target'), '_blank')
            }
        })

        it(`As a user, a long link doesn't break the mobile layout.`, { tags: [ 'full-regression' ] }, async function() {
            const { page } = await openAs('user1')
            // A fragment, so the link is long without changing what the
            // server fetches for its preview.
            const link = `${NEWS_LINKS.protocols.url}#${'a'.repeat(300)}`
            const text = `${posts.uniqueText('A long link:')} ${link}`

            const post = await postFromFeed(page, text)
            assert.equal(await post.count(), 1, `Expected the post on the feed.`)
            assert.equal(await posts.getPostContent(post).innerText(), text)
            assert.equal(await posts.getPostContent(post).getByRole('link', { name: link, exact: true }).count(), 1)

            await page.setViewportSize(config.VIEWPORTS.mobile)
            await assertFitsWindow(page, post, 'mobile', config.VIEWPORTS.mobile)
        })
    })

    describe('Images', function() {

        it('As a user, I can post the supported image formats.', { tags: [ 'full-regression' ] }, async function() {
            const { page } = await openAs('user1')

            for (const image of [ getMedia('image-1'), getMedia('png') ]) {
                const text = posts.uniqueText(`A post with a ${image.name}`)
                await openPage(page, '/')
                await posts.openPostForm(page)
                await posts.getPostFormTextbox(page).fill(text)
                await media.attachMedia(page, [ image ])
                const [ id ] = await media.getDraftFileIds(page)
                await posts.submitPost(page, '/')

                // The post shows the image, processed.
                await posts.waitForPostList(page)
                const post = posts.getPostByText(page, text)
                assert.equal(await post.count(), 1, `Expected the ${image.name} post on the feed.`)
                const shown = media.getShownMedia(post)
                await media.waitForMedia(shown)
                assert.equal(await media.getFileId(shown), id)
                assert.equal((await media.getMediaSize(shown)).width, PROCESSED_WIDTH)
            }
        })

        it('As a user, corrupted images are rejected.', { tags: [ 'full-regression' ] }, async function() {
            const { page } = await openAs('user1')
            const failure = page.getByRole('alert').filter({ hasText: 'Image failed to process.' })

            await openPage(page, '/')
            await posts.openPostForm(page)

            for (const key of [ 'png', 'image-1' ]) {
                const corrupted = getCorruptedMedia(key)
                await media.chooseFiles(page, media.getAddImageButton(page), [ corrupted ])

                // Processing it fails, which the form says, and it isn't
                // attached once the message goes.
                await failure.waitFor({ timeout: config.MEDIA_TIMEOUT })
                assert.equal(await failure.innerText(),
                    'Image failed to process. This could be because the file was corrupted or invalid in some way.')
                await failure.waitFor({ state: 'detached' })
                await eventually(async () => assert.equal(await media.getDraftFiles(page).count(), 0,
                    `Expected ${corrupted.name} not to be attached.`))
            }
        })

        it(`As a user, images of a type we don't support are refused.`, { tags: [ 'full-regression' ] }, async function() {
            const { page } = await openAs('user1')
            const unsupported = { name: 'unsupported.webp', mimeType: 'image/webp', buffer: Buffer.from('RIFF\0\0\0\0WEBPVP8 ') }

            await openPage(page, '/')
            await posts.openPostForm(page)
            await media.chooseFiles(page, media.getAddImageButton(page), [ unsupported ])

            const error = page.getByRole('alert').filter({ hasText: unsupported.name })
            await error.waitFor()
            assert.equal(await error.innerText(), `'${unsupported.name}' was an invalid file type. Supported types are: image/jpeg,image/png`)
            assert.equal(await media.getDraftFiles(page).count(), 0)
        })

        it(`As a user, I can remove an image I've attached before I post.`, { tags: [ 'full-regression' ] }, async function() {
            const { page } = await openAs('user1')
            const images = [ getMedia('image-1'), getMedia('image-2') ]
            const text = posts.uniqueText('A post that lost an image')

            await openPage(page, '/')
            await posts.openPostForm(page)
            await posts.getPostFormTextbox(page).fill(text)
            await media.attachMedia(page, images)
            const [ , kept ] = await media.getDraftFileIds(page)

            // Remove the first: the second stays.
            await media.removeDraftFile(media.getDraftFile(page, images[0].name))
            assert.deepEqual(await media.getDraftFileIds(page), [ kept ])
            assert.equal(await media.getDraftFile(page, images[1].name).count(), 1)

            // The post has the one image, without a gallery.
            await posts.submitPost(page, '/')
            await posts.waitForPostList(page)
            const post = posts.getPostByText(page, text)
            assert.equal(await post.count(), 1, `Expected the post on the feed.`)
            const shown = media.getShownMedia(post)
            await media.waitForMedia(shown)
            assert.equal(await media.getFileId(shown), kept)
            assert.equal(await media.getGallery(post).count(), 0)
        })
    })

    describe('Videos', function() {

        it('As a user, I can post the supported video formats.', { tags: [ 'full-regression' ] }, async function() {
            const { page } = await openAs('user1')

            for (const video of [ getMedia('video'), getMedia('mov') ]) {
                const text = posts.uniqueText(`A post with a ${video.name}`)
                await openPage(page, '/')
                await posts.openPostForm(page)
                await posts.getPostFormTextbox(page).fill(text)
                await media.attachMedia(page, [ video ])
                const [ id ] = await media.getDraftFileIds(page)
                await posts.submitPost(page, '/')

                // The post shows the video, which plays.
                await posts.waitForPostList(page)
                const post = posts.getPostByText(page, text)
                assert.equal(await post.count(), 1, `Expected the ${video.name} post on the feed.`)
                const shown = media.getShownMedia(post)
                await media.waitForMedia(shown)
                assert.equal(await media.getFileId(shown), id)

                await media.playVideo(post)
                await eventually(async () => {
                    const playback = await media.getPlayback(shown)
                    assert.equal(playback.error, null)
                    assert.ok(playback.currentTime >= 1 || playback.ended, `Expected the ${video.name} to play: it's at ${playback.currentTime}s.`)
                })
            }
        })

        it('As a user, corrupted videos are rejected.', { tags: [ 'full-regression' ] }, async function() {
            const { page } = await openAs('user1')
            const failure = page.getByRole('alert').filter({ hasText: 'Video failed to process.' })

            await openPage(page, '/')
            await posts.openPostForm(page)

            for (const key of [ 'video', 'mov' ]) {
                const corrupted = getCorruptedMedia(key)
                await media.chooseFiles(page, media.getAddVideoButton(page), [ corrupted ])

                await failure.waitFor({ timeout: config.MEDIA_TIMEOUT })
                assert.equal(await failure.innerText(),
                    'Video failed to process. This could be because the file was corrupted or invalid in some way.')
                await failure.waitFor({ state: 'detached' })
                await eventually(async () => assert.equal(await media.getDraftFiles(page).count(), 0,
                    `Expected ${corrupted.name} not to be attached.`))
            }
        })

        it(`As a user, videos of a type we don't support are refused.`, { tags: [ 'full-regression' ] }, async function() {
            const { page } = await openAs('user1')
            const unsupported = { name: 'unsupported.webm', mimeType: 'video/webm', buffer: Buffer.from([ 0x1a, 0x45, 0xdf, 0xa3 ]) }

            await openPage(page, '/')
            await posts.openPostForm(page)
            await media.chooseFiles(page, media.getAddVideoButton(page), [ unsupported ])

            const error = page.getByRole('alert').filter({ hasText: unsupported.name })
            await error.waitFor()
            assert.equal(await error.innerText(), `'${unsupported.name}' was an invalid file type. Supported types are: video/mp4,video/quicktime`)
            assert.equal(await media.getDraftFiles(page).count(), 0)
        })
    })

    describe('Public Posts', function() {

        it('As a user, I can make a post public from the post form.', { tags: [ 'full-regression' ] }, async function() {
            const author = await openAs('user1')
            const stranger = await openAs('user3')
            const text = posts.uniqueText('A public post')
            const page = author.page

            // The form is for friends until told otherwise.
            await openPage(page, '/')
            await posts.openPostForm(page)
            assert.equal((await posts.getFormVisibility(page).innerText()).trim(), 'Friends')

            await posts.chooseVisibility(page, 'Public')
            assert.equal((await posts.getFormVisibility(page).innerText()).trim(), 'Public')
            await posts.getPostFormTextbox(page).fill(text)
            await posts.submitPost(page, '/')

            // The post says it's public.
            await posts.waitForPostList(page)
            const post = posts.getPostByText(page, text)
            assert.equal(await post.count(), 1, `Expected the post on the feed.`)
            assert.equal(await posts.getPostVisibility(post).innerText(), 'Public')

            // A stranger sees it on User1's profile.
            await openPage(stranger.page, `/${user1.fixture.username}`)
            await posts.waitForPostList(stranger.page)
            const seen = posts.getPostByText(stranger.page, text)
            assert.equal(await seen.count(), 1, `Expected the public post on User1's profile.`)
            assert.equal(await posts.getPostContent(seen).innerText(), text)
        })

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

    describe('Announcements', function() {

        it('As a site admin, I can make announcement and info posts, which every user sees.', { tags: [ 'full-regression' ] }, async function() {
            // The fixtures start with announcement and info posts hidden from
            // their feeds (see TestController), so other tests' feeds, and
            // staging's, are only what they post. Show them, for the site
            // admin and User1, before they log in for this test, since a
            // session keeps the settings it logged in with.
            for (const user of [ admin, user1 ]) {
                const response = await patchUser(user.session, user.user.id, {
                    id: user.user.id,
                    settings: { ...user.user.settings, showAnnouncements: true, showInfo: true }
                })
                assert.equal(response.ok, true, `Couldn't show announcements to ${user.fixture.key}: ${response.status}`)
            }

            // Every user who shows them sees these posts on their feed, so
            // they're deleted as soon as the test is done with them, whether
            // it passes or not.
            try {
                const siteAdmin = await openAs('user-site-admin', { fresh: true })
                const reader = await openAs('user1', { fresh: true })

                // A user who isn't a site admin has no choice of type.
                await openPage(reader.page, '/')
                await posts.openPostForm(reader.page)
                await posts.getVisibilityButton(reader.page).waitFor()
                assert.equal(await posts.getPostTypeButton(reader.page).count(), 0)

                const made = []
                for (const type of [ 'Announcement', 'Info' ]) {
                    const page = siteAdmin.page
                    const text = posts.uniqueText(`An ${type.toLowerCase()} post`)

                    // They're public, without a choice.
                    await openPage(page, '/')
                    await posts.openPostForm(page)
                    await posts.choosePostType(page, type)
                    assert.equal((await posts.getFormVisibility(page).innerText()).trim(), 'Public')
                    assert.equal(await posts.getVisibilityButton(page).count(), 0)

                    await posts.getPostFormTextbox(page).fill(text)
                    await posts.submitPost(page, '/')
                    await posts.waitForPostList(page)
                    const post = posts.getPostByText(page, text)
                    assert.equal(await post.count(), 1, `Expected the ${type} post on the feed.`)
                    assert.equal(await posts.getPostType(post).innerText(), type)
                    assert.equal(await posts.getPostVisibility(post).innerText(), 'Public')
                    made.push({ text: text, type: type })
                }

                // User1 isn't the site admin's friend, and sees both.
                await openPage(reader.page, '/')
                await posts.waitForPostList(reader.page)
                for (const { text, type } of made) {
                    const post = posts.getPostByText(reader.page, text)
                    assert.equal(await post.count(), 1, `Expected the ${type} post on User1's feed.`)
                    assert.equal(await posts.getPostType(post).innerText(), type)
                }
            } finally {
                await deleteAllPostsForUser(admin.session, admin.user.id)
                await restoreUserSettings(admin.session, admin.user.id, admin.user.settings)
                await restoreUserSettings(user1.session, user1.user.id, user1.user.settings)
            }
        })
    })

    describe('Validation', function() {

        it('As a user, the post form stops at 10,000 characters.', { tags: [ 'full-regression' ] }, async function() {
            const { page } = await openAs('user1')
            const textbox = posts.getPostFormTextbox(page)
            const error = page.getByText('Posts are limited to 10,000 characters...')

            await openPage(page, '/')
            await posts.openPostForm(page)

            // One character too many: it says so, and doesn't take it.
            await textbox.fill('a'.repeat(10001))
            await error.waitFor()
            assert.equal(await error.isVisible(), true)
            assert.equal(await textbox.inputValue(), '')

            // Exactly the limit: it takes it, and the error goes.
            await textbox.fill('a'.repeat(10000))
            await error.waitFor({ state: 'detached' })
            assert.equal((await textbox.inputValue()).length, 10000)
        })
    })

    describe('Shared Posts', function() {

        it('As a user, I can share a public post.', { tags: [ 'full-regression' ] }, async function() {
            const original = await createPost(user2.session, user2.user.id, {
                visibility: 'public',
                content: posts.uniqueText('A post worth sharing')
            })
            const sharing = posts.uniqueText('Sharing my friend\'s post')
            const { page } = await openAs('user1')

            await openPage(page, '/')
            await posts.waitForPostList(page)
            const post = posts.getPostById(page, original.id)
            assert.equal(await post.count(), 1, `Expected User2's post on User1's feed.`)

            // Share opens the post form with the post in it, and nothing
            // else to attach.
            await posts.getShareButton(post).click()
            await page.waitForURL(/\/create\?.*sharedPostId=/)
            const shared = posts.getSharedPostInForm(page)
            await shared.waitFor()
            assert.equal(await shared.getAttribute('id'), original.id)
            assert.equal(await posts.getPostContent(shared).innerText(), original.content)
            assert.equal(await media.getAddImageButton(page).count(), 0)
            assert.equal(await media.getAddVideoButton(page).count(), 0)

            // Post it: the share has User1's text, and User2's post in it.
            await posts.getPostFormTextbox(page).fill(sharing)
            await posts.submitPost(page, '/')
            await posts.waitForPostList(page)
            const share = posts.getPostByText(page, sharing)
            assert.equal(await share.count(), 1, `Expected the share on User1's feed.`)
            assert.equal(await posts.getPostContent(share).innerText(), sharing)
            const inside = posts.getSharedPost(share)
            await inside.waitFor()
            assert.equal(await inside.getAttribute('id'), original.id)
            assert.equal(await posts.getPostContent(inside).innerText(), original.content)
        })

        it('As a user, I cannot share a private post.', { tags: [ 'full-regression' ] }, async function() {
            const privatePost = await createPost(user2.session, user2.user.id, {
                visibility: 'private',
                content: posts.uniqueText('A post for friends only')
            })
            const publicPost = await createPost(user2.session, user2.user.id, {
                visibility: 'public',
                content: posts.uniqueText('A post for anyone')
            })
            const { page } = await openAs('user1')

            // Of User2's posts on User1's feed, only the public one can be
            // shared.
            await openPage(page, '/')
            await posts.waitForPostList(page)
            const privateView = posts.getPostById(page, privatePost.id)
            const publicView = posts.getPostById(page, publicPost.id)
            assert.equal(await privateView.count(), 1, `Expected User2's private post on User1's feed.`)
            assert.equal(await publicView.count(), 1, `Expected User2's public post on User1's feed.`)
            assert.equal(await posts.getShareButton(privateView).count(), 0)
            assert.equal(await posts.getShareButton(publicView).count(), 1)
        })
    })
})

// Assert that `post` and the page on it fit in the window, `viewport`, which
// is called `name`: nothing runs past its sides, and it doesn't scroll
// sideways.
const assertFitsWindow = async function(page, post, name, viewport) {
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
