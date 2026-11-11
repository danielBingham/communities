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
 * Every case the integration tests don't cover. The posts each test edits
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
const { getMedia } = require('../../../lib/fixtures/media')

const { startBrowser, stopBrowser, openAs, cleanUp } = require('../../lib/browser')
const { checkSuite } = require('../../lib/suites')
const { openPage, followHeaderLink, logOut, logIn } = require('../../lib/app')
const posts = require('../../lib/posts')
const media = require('../../lib/media')

describe('Update Post', function() {

    // API sessions, for setting up and cleaning up.
    let user1 = null
    let user2 = null
    let user3 = null

    before(async function() {
        await startBrowser()

        user1 = await loginAs('user1')
        user2 = await loginAs('user2')
        user3 = await loginAs('user3')

        // User2 is User1's friend; User3 is a stranger.
        await clearRelationship(user1.session, user1.user.id, user2.session, user2.user.id)
        await clearRelationship(user1.session, user1.user.id, user3.session, user3.user.id)
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
        if ( user3 ) await logout(user3.session)
    })

    // A post of User1's to edit, made through the API: text, and an image
    // (a media key, 'image-1') or a link (one of NEWS_LINKS) if asked for.
    // The link goes at the end of the text, as a person would write it.
    const createPostToEdit = async function(label, { visibility = 'private', image = null, link = null } = {}) {
        const post = { visibility: visibility, content: posts.uniqueText(label) }
        if ( image !== null ) {
            post.files = [ (await uploadMedia(user1.session, user1.user.id, image)).id ]
        }
        if ( link !== null ) {
            post.content = `${post.content} ${link.url}`
            post.linkPreviewId = (await createLinkPreview(user1.session, link.url)).id
        }
        return await createPost(user1.session, user1.user.id, post)
    }

    // Swap the image in the post form for `image` (from getMedia()), and
    // return the new image's File id.
    const changeImage = async function(page, image) {
        await media.removeDraftFile(media.getDraftFiles(page).first())
        await media.attachMedia(page, [ image ])
        const ids = await media.getDraftFileIds(page)
        assert.equal(ids.length, 1, `Expected only the new image in the post form.`)
        return ids[0]
    }

    // Change the link in the post form: write `text`, with the new link in
    // it, and remove the old link's preview, so the form makes one for the
    // new link.
    const changeLink = async function(page, text, link) {
        await posts.getPostFormTextbox(page).fill(text)
        await media.removeLinkPreview(page)
        await media.waitForLinkPreview(page)
        assert.equal(await media.getLinkPreviewTitle(media.getLinkPreview(page)).innerText(), link.title)
    }

    // Assert that `post`, on the page, says `text` and shows the image with
    // File id `imageId`.
    const assertPostWithImage = async function(post, text, imageId) {
        assert.equal(await post.count(), 1, `Expected the post on the page.`)
        assert.equal(await posts.getPostContent(post).innerText(), text)
        const shown = media.getShownMedia(post)
        await shown.waitFor()
        assert.equal(await media.getFileId(shown), imageId)
    }

    // Assert that `post`, on the page, says `text` and shows a preview of
    // `link`.
    const assertPostWithLink = async function(post, text, link) {
        assert.equal(await post.count(), 1, `Expected the post on the page.`)
        assert.equal(await posts.getPostContent(post).innerText(), text)
        const preview = media.getLinkPreview(post)
        await preview.waitFor()
        assert.equal(await preview.count(), 1, `Expected the post to show one link preview.`)
        assert.equal(await media.getLinkPreviewTitle(preview).innerText(), link.title)
        assert.equal(await preview.getAttribute('href'), link.url)
    }

    it('As a user, I can edit the text of my post.', { tags: [ 'smoke-test', 'full-regression' ] }, async function() {
        const original = await createPostToEdit('Before the edit', { image: 'image-1' })
        const [ imageId ] = original.files
        const edited = posts.uniqueText('After the edit')
        const { page } = await openAs('user1')
        const post = posts.getPostById(page, original.id)
        const textbox = posts.getPostFormTextbox(page)

        await openPage(page, '/')
        await posts.waitForPostList(page)
        await assertPostWithImage(post, original.content, imageId)

        // The form starts with the post's text and image.
        await posts.editPost(page, post)
        assert.equal(await textbox.inputValue(), original.content)
        assert.deepEqual(await media.getDraftFileIds(page), [ imageId ])
        await textbox.fill(edited)
        await posts.saveEdit(page)

        // The post's page shows the edit, with the image still, and so does
        // the feed.
        await posts.waitForPermalinkPage(page)
        await assertPostWithImage(post, edited, imageId)

        await openPage(page, '/')
        await posts.waitForPostList(page)
        await assertPostWithImage(post, edited, imageId)
        assert.equal(await page.getByText(original.content).count(), 0)
    })

    describe('Post Editing', function() {

        it('As a user, I can edit a post with an image.', { tags: [ 'full-regression' ] }, async function() {
            const original = await createPostToEdit('A post with an image', { image: 'image-1' })
            const cancelled = posts.uniqueText('An edit to cancel')
            const { page } = await openAs('user1')
            const post = posts.getPostById(page, original.id)

            await openPage(page, '/')
            await posts.waitForPostList(page)

            // Change the image and save: the post has the new one.
            await posts.editPost(page, post)
            const imageId = await changeImage(page, getMedia('image-2'))
            await posts.saveEdit(page)
            await posts.waitForPermalinkPage(page)
            await assertPostWithImage(post, original.content, imageId)

            // Change the text and cancel: it isn't changed.
            await posts.editPost(page, post)
            await posts.getPostFormTextbox(page).fill(cancelled)
            await posts.discardPostForm(page)
            await posts.waitForPermalinkPage(page)
            await assertPostWithImage(post, original.content, imageId)
            assert.equal(await page.getByText(cancelled).count(), 0)

            // Change the image and cancel: it isn't changed either, here or
            // after a reload. (The form doesn't ask before discarding this
            // edit, as it does when the text changes: see cancelPostForm().)
            await posts.editPost(page, post)
            await changeImage(page, getMedia('image-3'))
            await posts.cancelPostForm(page)
            await posts.waitForPermalinkPage(page)
            await assertPostWithImage(post, original.content, imageId)

            await page.reload()
            await posts.waitForPermalinkPage(page)
            await assertPostWithImage(post, original.content, imageId)
        })

        it('As a user, I can edit a post with a link.', { tags: [ 'full-regression' ] }, async function() {
            const first = NEWS_LINKS.protocols
            const second = NEWS_LINKS.enshittification
            const original = await createPostToEdit('A post with a link', { link: first })
            const { page } = await openAs('user1')
            const post = posts.getPostById(page, original.id)
            const textbox = posts.getPostFormTextbox(page)

            await openPage(page, '/')
            await posts.waitForPostList(page)
            await assertPostWithLink(post, original.content, first)

            // Change the text and save: it's updated, with the same link.
            const savedText = `${posts.uniqueText('An edit to keep')} ${first.url}`
            await posts.editPost(page, post)
            await textbox.fill(savedText)
            await posts.saveEdit(page)
            await posts.waitForPermalinkPage(page)
            await assertPostWithLink(post, savedText, first)

            // Change the link and save: it has the new link's preview.
            const savedLink = `${posts.uniqueText('A new link')} ${second.url}`
            await posts.editPost(page, post)
            await changeLink(page, savedLink, second)
            await posts.saveEdit(page)
            await posts.waitForPermalinkPage(page)
            await assertPostWithLink(post, savedLink, second)

            // Change the text and cancel: it isn't changed.
            const cancelledText = `${posts.uniqueText('An edit to cancel')} ${second.url}`
            await posts.editPost(page, post)
            await textbox.fill(cancelledText)
            await posts.discardPostForm(page)
            await posts.waitForPermalinkPage(page)
            await assertPostWithLink(post, savedLink, second)

            // Change the link and cancel: it isn't changed either, here or
            // after a reload.
            await posts.editPost(page, post)
            await changeLink(page, `${posts.uniqueText('A link to cancel')} ${first.url}`, first)
            await posts.discardPostForm(page)
            await posts.waitForPermalinkPage(page)
            await assertPostWithLink(post, savedLink, second)

            await page.reload()
            await posts.waitForPermalinkPage(page)
            await assertPostWithLink(post, savedLink, second)
        })

        it('As a user, I can change who can see my post.', { tags: [ 'full-regression' ] }, async function() {
            const original = await createPostToEdit('A post to make public')
            const author = await openAs('user1')
            const stranger = await openAs('user3')
            const post = posts.getPostById(author.page, original.id)

            // It's for friends, and a stranger doesn't see it on User1's
            // profile.
            await openPage(stranger.page, `/${user1.fixture.username}`)
            await posts.waitForPostList(stranger.page)
            assert.equal(await posts.getPostById(stranger.page, original.id).count(), 0)

            await openPage(author.page, '/')
            await posts.waitForPostList(author.page)
            assert.equal(await posts.getPostVisibility(post).innerText(), 'Friends')

            // Make it public.
            await posts.editPost(author.page, post)
            assert.equal((await posts.getFormVisibility(author.page).innerText()).trim(), 'Friends')
            await posts.chooseVisibility(author.page, 'Public')
            await posts.saveEdit(author.page)
            await posts.waitForPermalinkPage(author.page)
            assert.equal(await posts.getPostVisibility(post).innerText(), 'Public')
            assert.equal(await posts.getPostContent(post).innerText(), original.content)

            // Now the stranger sees it.
            await openPage(stranger.page, `/${user1.fixture.username}`)
            await posts.waitForPostList(stranger.page)
            const seen = posts.getPostById(stranger.page, original.id)
            assert.equal(await seen.count(), 1, `Expected the post, now public, on User1's profile.`)
            assert.equal(await posts.getPostContent(seen).innerText(), original.content)
        })

        it('As a user, edits to a post I made propagate to shares of that post.', { tags: [ 'full-regression' ] }, async function() {
            const first = NEWS_LINKS.protocols
            const second = NEWS_LINKS.enshittification
            const original = await createPostToEdit('A post to share', { visibility: 'public', link: first })
            const sharing = posts.uniqueText('Sharing my friend\'s post')
            const edited = `${posts.uniqueText('The shared post, edited')} ${second.url}`

            const author = await openAs('user1')
            const sharer = await openAs('user2')

            // User2 shares the post.
            await openPage(sharer.page, `/${user1.fixture.username}/${original.id}`)
            await posts.waitForPermalinkPage(sharer.page)
            await posts.share(sharer.page, posts.getPostById(sharer.page, original.id), sharing)

            // User1 changes its text and link.
            const post = posts.getPostById(author.page, original.id)
            await openPage(author.page, '/')
            await posts.waitForPostList(author.page)
            await posts.editPost(author.page, post)
            await changeLink(author.page, edited, second)
            await posts.saveEdit(author.page)
            await posts.waitForPermalinkPage(author.page)
            await assertPostWithLink(post, edited, second)

            // User2's share still has their own text, and the post it
            // shares shows the edit, with the new link's preview.
            await openPage(sharer.page, '/')
            await posts.waitForPostList(sharer.page)
            const share = posts.getPostByText(sharer.page, sharing)
            assert.equal(await share.count(), 1, `Expected User2's share in their feed.`)
            assert.equal(await posts.getPostContent(share).innerText(), sharing)

            const shared = posts.getSharedPost(share)
            await shared.waitFor()
            assert.equal(await shared.getAttribute('id'), original.id)
            await assertPostWithLink(shared, edited, second)
        })

        it('As a user, I can only edit my own posts.', { tags: [ 'full-regression' ] }, async function() {
            const theirs = await createPostToEdit('A post of User1\'s')
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
            // edited by them.
            const theirActions = await getActions(theirs.id)
            assert.ok(theirActions.includes('Copy Link'), `Expected the menu to open: it has ${JSON.stringify(theirActions)}.`)
            assert.ok( ! theirActions.includes('Edit'), `Expected no Edit on someone else's post: ${JSON.stringify(theirActions)}.`)

            // Their own can.
            const myActions = await getActions(mine.id)
            assert.ok(myActions.includes('Edit'), `Expected Edit on one's own post: ${JSON.stringify(myActions)}.`)
        })
    })

    describe('Post Edit Drafts', function() {

        it('As a user, my edit draft of a post with an image is saved across reloads.', { tags: [ 'full-regression' ] }, async function() {
            const original = await createPostToEdit('Saved before the draft', { image: 'image-1' })
            const [ originalImageId ] = original.files
            const draft = posts.uniqueText('An edit in progress')
            const window = await openAs('user1')
            let page = window.page
            let post = posts.getPostById(page, original.id)

            await openPage(page, '/')
            await posts.waitForPostList(page)
            await posts.editPost(page, post)
            await posts.getPostFormTextbox(page).fill(draft)
            const draftImageId = await changeImage(page, getMedia('image-2'))

            // Editing it again picks up the draft: its text and image.
            const assertDraft = async function() {
                assert.equal(await posts.getPostFormTextbox(page).inputValue(), draft)
                assert.deepEqual(await media.getDraftFileIds(page), [ draftImageId ])
            }

            // Navigate away from the feed and back. The post is unchanged,
            // but editing it again picks up the draft.
            await followHeaderLink(page, 'Friends')
            await page.waitForURL('/friends')
            await followHeaderLink(page, 'Feeds')
            await posts.waitForPostList(page)
            await assertPostWithImage(post, original.content, originalImageId)

            await posts.editPost(page, post)
            await assertDraft()

            // Close the window, open a new one and load the feed: the same.
            await page.close()
            page = await window.context.newPage()
            post = posts.getPostById(page, original.id)
            await openPage(page, '/')
            await posts.waitForPostList(page)
            await assertPostWithImage(post, original.content, originalImageId)

            await posts.editPost(page, post)
            await assertDraft()

            // Post the draft: the post is updated, text and image.
            await posts.saveEdit(page)
            await posts.waitForPermalinkPage(page)
            await assertPostWithImage(post, draft, draftImageId)
            assert.equal(await page.getByText(original.content).count(), 0)
        })

        it('As a user, my edit draft of a post with an image is cleared when I log out.', { tags: [ 'full-regression' ] }, async function() {
            const original = await createPostToEdit('Saved before the lost draft', { image: 'image-1' })
            const [ originalImageId ] = original.files
            const draft = posts.uniqueText('An edit to lose')
            // Its own session, since logging out ends it.
            const { page, fixture } = await openAs('user1', { fresh: true })
            const post = posts.getPostById(page, original.id)

            await openPage(page, '/')
            await posts.waitForPostList(page)
            await posts.editPost(page, post)
            await posts.getPostFormTextbox(page).fill(draft)
            await changeImage(page, getMedia('image-2'))
            await followHeaderLink(page, 'Feeds')
            await posts.waitForPostList(page)

            await logOut(page)
            await logIn(page, fixture)
            await openPage(page, '/')

            // The post is unchanged, and editing it starts from what's
            // saved, not the draft.
            await posts.waitForPostList(page)
            await assertPostWithImage(post, original.content, originalImageId)

            await posts.editPost(page, post)
            assert.equal(await posts.getPostFormTextbox(page).inputValue(), original.content)
            assert.deepEqual(await media.getDraftFileIds(page), [ originalImageId ])
        })

        it('As a user, my edit draft of a post with a link is saved across reloads.', { tags: [ 'full-regression' ] }, async function() {
            const first = NEWS_LINKS.protocols
            const second = NEWS_LINKS.enshittification
            const original = await createPostToEdit('Saved before the link draft', { link: first })
            const draft = `${posts.uniqueText('A link edit in progress')} ${second.url}`
            const window = await openAs('user1')
            let page = window.page
            let post = posts.getPostById(page, original.id)

            await openPage(page, '/')
            await posts.waitForPostList(page)
            await posts.editPost(page, post)
            await changeLink(page, draft, second)

            // Editing it again picks up the draft: its text and link.
            const assertDraft = async function() {
                assert.equal(await posts.getPostFormTextbox(page).inputValue(), draft)
                await media.waitForLinkPreview(page)
                assert.equal(await media.getLinkPreviewTitle(media.getLinkPreview(page)).innerText(), second.title)
            }

            // Navigate away from the feed and back.
            await followHeaderLink(page, 'Friends')
            await page.waitForURL('/friends')
            await followHeaderLink(page, 'Feeds')
            await posts.waitForPostList(page)
            await assertPostWithLink(post, original.content, first)

            await posts.editPost(page, post)
            await assertDraft()

            // Close the window, open a new one and load the feed.
            await page.close()
            page = await window.context.newPage()
            post = posts.getPostById(page, original.id)
            await openPage(page, '/')
            await posts.waitForPostList(page)
            await assertPostWithLink(post, original.content, first)

            await posts.editPost(page, post)
            await assertDraft()

            // Post the draft: the post is updated, text and link.
            await posts.saveEdit(page)
            await posts.waitForPermalinkPage(page)
            await assertPostWithLink(post, draft, second)
        })

        it('As a user, my edit draft of a post with a link is cleared when I log out.', { tags: [ 'full-regression' ] }, async function() {
            const first = NEWS_LINKS.protocols
            const second = NEWS_LINKS.enshittification
            const original = await createPostToEdit('Saved before the lost link draft', { link: first })
            // Its own session, since logging out ends it.
            const { page, fixture } = await openAs('user1', { fresh: true })
            const post = posts.getPostById(page, original.id)

            await openPage(page, '/')
            await posts.waitForPostList(page)
            await posts.editPost(page, post)
            await changeLink(page, `${posts.uniqueText('A link edit to lose')} ${second.url}`, second)
            await followHeaderLink(page, 'Feeds')
            await posts.waitForPostList(page)

            await logOut(page)
            await logIn(page, fixture)
            await openPage(page, '/')

            // The post is unchanged, and editing it starts from what's
            // saved: its text and link.
            await posts.waitForPostList(page)
            await assertPostWithLink(post, original.content, first)

            await posts.editPost(page, post)
            assert.equal(await posts.getPostFormTextbox(page).inputValue(), original.content)
            await media.waitForLinkPreview(page)
            assert.equal(await media.getLinkPreviewTitle(media.getLinkPreview(page)).innerText(), first.title)
        })
    })
})
