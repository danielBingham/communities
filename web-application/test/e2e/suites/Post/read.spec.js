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
 * Read Post: documentation/testing/test-cases/Post/read.md
 *
 * Every case the integration tests don't cover. The integration tests also
 * cover the Smoke Test's permissions at the API
 * (PostController/getPost.spec.js); these check the pages show what the API
 * allows.
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
const { uploadMedia } = require('../../../lib/files')
const { makeFriends, clearRelationship } = require('../../../lib/relationships')

const { startBrowser, stopBrowser, openAs, cleanUp } = require('../../lib/browser')
const { checkSuite } = require('../../lib/suites')
const config = require('../../lib/config')
const { openPage } = require('../../lib/app')
const posts = require('../../lib/posts')
const media = require('../../lib/media')
const { eventually } = require('../../lib/wait')

describe('Read Post', function() {

    // API sessions, for setting up and cleaning up.
    let user1 = null
    let user2 = null
    let user3 = null

    // User1's posts, made through the API before the tests.
    let publicPost = null
    let privatePost = null

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
        publicPost = await createPost(user1.session, user1.user.id, {
            visibility: 'public',
            content: posts.uniqueText('A public post')
        })
        privatePost = await createPost(user1.session, user1.user.id, {
            visibility: 'private',
            content: posts.uniqueText('A private post')
        })
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


    const permalinkOf = (post) => `/${user1.fixture.username}/${post.id}`

    it('A user can see a public post.', { tags: [ 'smoke-test', 'full-regression' ] }, async function() {
        // A stranger: the user least likely to see it.
        const { page } = await openAs('user3')
        const post = posts.getPostById(page, publicPost.id)

        // On its permalink...
        await openPage(page, permalinkOf(publicPost))
        await posts.waitForPermalinkPage(page)
        assert.equal(await post.count(), 1, `Expected the public post on its permalink.`)
        assert.equal(await posts.getPostContent(post).innerText(), publicPost.content)

        // ... and on User1's profile.
        await openPage(page, `/${user1.fixture.username}`)
        await posts.waitForPostList(page)
        assert.equal(await post.count(), 1, `Expected the public post on User1's profile.`)
        assert.equal(await posts.getPostContent(post).innerText(), publicPost.content)
    })

    it(`A friend of a user can see that user's private post.`, { tags: [ 'smoke-test', 'full-regression' ] }, async function() {
        const { page } = await openAs('user2')
        const post = posts.getPostById(page, privatePost.id)

        // In their feed...
        await openPage(page, '/')
        await posts.waitForPostList(page)
        assert.equal(await post.count(), 1, `Expected the private post in User2's feed.`)
        assert.equal(await posts.getPostContent(post).innerText(), privatePost.content)

        // ... and on its permalink.
        await openPage(page, permalinkOf(privatePost))
        await posts.waitForPermalinkPage(page)
        assert.equal(await post.count(), 1, `Expected the private post on its permalink.`)
        assert.equal(await posts.getPostContent(post).innerText(), privatePost.content)
    })

    it(`A stranger cannot see a user's private post.`, { tags: [ 'smoke-test', 'full-regression' ] }, async function() {
        const { page } = await openAs('user3')

        // Its permalink shows the 404 instead.
        await openPage(page, permalinkOf(privatePost))
        await posts.waitForPermalinkPage(page)
        assert.equal(await posts.getPostNotFoundError(page).isVisible(), true, `Expected the 404 on the private post's permalink.`)
        assert.equal(await posts.getPostById(page, privatePost.id).count(), 0)
        assert.equal(await page.getByText(privatePost.content).count(), 0)

        // On User1's profile, the public post shows and the private one
        // doesn't.
        await openPage(page, `/${user1.fixture.username}`)
        await posts.waitForPostList(page)
        const shown = posts.getPostById(page, publicPost.id)
        assert.equal(await shown.count(), 1, `Expected the public post on User1's profile.`)
        assert.equal(await posts.getPostContent(shown).innerText(), publicPost.content)
        assert.equal(await posts.getPostById(page, privatePost.id).count(), 0)
        assert.equal(await page.getByText(privatePost.content).count(), 0)
    })

    it('As a user, a post I cannot see is not reachable by permalink.', { tags: [ 'full-regression' ] }, async function() {
        const author = await openAs('user1')
        const stranger = await openAs('user3')
        const text = posts.uniqueText('A private post to keep to friends')

        // Make a private post (the form's default) and copy its
        // permalink.
        await openPage(author.page, '/')
        await posts.openPostForm(author.page)
        await posts.getPostFormTextbox(author.page).fill(text)
        await posts.submitPost(author.page, '/')

        await posts.waitForPostList(author.page)
        const post = posts.getPostByText(author.page, text)
        assert.equal(await post.count(), 1, `Expected the post on User1's feed.`)
        const id = await post.getAttribute('id')
        const permalink = await posts.getPermalink(post)
        assert.equal(permalink, `/${user1.fixture.username}/${id}`)

        // The stranger gets the 404, and not the post.
        await openPage(stranger.page, permalink)
        await posts.waitForPermalinkPage(stranger.page)
        assert.equal(await posts.getPostNotFoundError(stranger.page).isVisible(), true, `Expected the 404 on the permalink.`)
        assert.equal(await posts.getPostById(stranger.page, id).count(), 0)
        assert.equal(await stranger.page.getByText(text).count(), 0)
    })

    it('As a user, I can copy a link to a post.', { tags: [ 'full-regression' ] }, async function() {
        const { page, context } = await openAs('user1')
        const post = posts.getPostById(page, publicPost.id)

        // Let the page use the clipboard, as a person's browser does once
        // they've allowed it. (These are Chromium's names for it.)
        await context.grantPermissions([ 'clipboard-read', 'clipboard-write' ])

        await openPage(page, '/')
        await posts.waitForPostList(page)
        await posts.choosePostAction(post, 'Copy Link')

        // It says so, and the link to the post is on the clipboard.
        const copied = page.getByRole('alert').filter({ hasText: 'Link copied.' })
        await copied.waitFor()
        assert.equal(await copied.innerText(), 'Link copied.')
        const link = await page.evaluate(() => navigator.clipboard.readText())
        assert.equal(link, new URL(permalinkOf(publicPost), config.BASE_URL).href)

        // The link opens the post.
        await openPage(page, link)
        await posts.waitForPermalinkPage(page)
        assert.equal(await post.count(), 1, `Expected the copied link to open the post.`)
        assert.equal(await posts.getPostContent(post).innerText(), publicPost.content)
    })

    it('As a user, a long post is shortened until I choose to see all of it.', { tags: [ 'full-regression' ] }, async function() {
        const long = await createPost(user1.session, user1.user.id, {
            visibility: 'private',
            content: `${posts.uniqueText('A long post:')} ${'This post goes on and on. '.repeat(60).trim()}`
        })
        assert.ok(long.content.length > 1000, `The post has to be longer than 1,000 characters, but it's ${long.content.length}.`)
        const { page } = await openAs('user1')
        const post = posts.getPostById(page, long.id)
        const showMore = posts.getShowMoreLink(post)

        // The feed shows its first 1,000 characters, and a link to the rest.
        await openPage(page, '/')
        await posts.waitForPostList(page)
        assert.equal(await post.count(), 1, `Expected the long post on the feed.`)
        assert.equal(await showMore.count(), 1, `Expected a "Show More." link.`)
        assert.equal(await posts.getPostContent(post).innerText(), `${long.content.substring(0, 1000)}...\nShow More.`)

        // Show more: all of it, and no link.
        await showMore.click()
        await showMore.waitFor({ state: 'detached' })
        assert.equal(await posts.getPostContent(post).innerText(), long.content)
    })

    it('As a user, I can page through the images in a post.', { tags: [ 'full-regression' ] }, async function() {
        const images = []
        for (const key of [ 'image-1', 'image-2', 'image-3' ]) {
            images.push(await uploadMedia(user1.session, user1.user.id, key))
        }
        const gallery = await createPost(user1.session, user1.user.id, {
            visibility: 'private',
            content: posts.uniqueText('A post with three images'),
            files: images.map((image) => image.id)
        })
        const { page } = await openAs('user1')
        const post = posts.getPostById(page, gallery.id)
        const position = media.getGalleryPosition(post)
        const next = media.getNextItemButton(post)
        const previous = media.getPreviousItemButton(post)

        // What the gallery is showing: `index` of the images, which are
        // numbered from 1, and the buttons either side.
        const assertShowing = async function(index, { hasPrevious, hasNext }) {
            await eventually(async () => assert.equal(await position.innerText(), `${index} / 3`))
            await media.waitForMedia(media.getShownMedia(post))
            assert.equal(await media.getFileId(media.getShownMedia(post)), images[index - 1].id)
            assert.equal(await previous.count(), hasPrevious ? 1 : 0)
            assert.equal(await next.count(), hasNext ? 1 : 0)
        }

        await openPage(page, '/')
        await posts.waitForPostList(page)
        assert.equal(await post.count(), 1, `Expected the post on the feed.`)
        await position.waitFor()
        await assertShowing(1, { hasPrevious: false, hasNext: true })

        await next.click()
        await assertShowing(2, { hasPrevious: true, hasNext: true })

        await next.click()
        await assertShowing(3, { hasPrevious: true, hasNext: false })

        await previous.click()
        await assertShowing(2, { hasPrevious: true, hasNext: true })
    })

    describe('Post lists', function() {

        it('As a user, I can sort my feed.', { tags: [ 'full-regression' ] }, async function() {
            const made = []
            for (const label of [ 'The first post', 'The second post', 'The third post' ]) {
                made.push(await createPost(user1.session, user1.user.id, {
                    visibility: 'private',
                    content: posts.uniqueText(label)
                }))
            }
            const [ first, second, third ] = made.map((post) => post.id)

            // User2 comments on the second twice, then the first once: the
            // second has the most activity, and the first the most recent.
            await addComment(user2.session, second, posts.uniqueText('A comment'))
            await addComment(user2.session, second, posts.uniqueText('Another comment'))
            await addComment(user2.session, first, posts.uniqueText('A later comment'))

            const { page } = await openAs('user1')

            // The order the feed shows these three in, among its others.
            const getOrder = async function() {
                return (await posts.getPostIds(page)).filter((id) => [ first, second, third ].includes(id))
            }

            // Newest first, unless told otherwise.
            await openPage(page, '/')
            await posts.waitForPostList(page)
            assert.equal((await posts.getSortButton(page).innerText()).trim(), 'Newest')
            assert.deepEqual(await getOrder(), [ third, second, first ])

            // The list reloads in its new order once it's chosen.
            await posts.chooseSort(page, 'Most Activity')
            await eventually(async () => assert.deepEqual(await getOrder(), [ second, first, third ]))

            await posts.chooseSort(page, 'Recent Activity')
            await eventually(async () => assert.deepEqual(await getOrder(), [ first, second, third ]))

            await posts.chooseSort(page, 'Newest')
            await eventually(async () => assert.deepEqual(await getOrder(), [ third, second, first ]))
        })
    })
})
