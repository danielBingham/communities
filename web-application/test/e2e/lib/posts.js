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
 * Posts in the browser: the post form, finding posts on a page, and what a
 * post's controls do (its menu, reactions, comments, sharing).
 *
 * The get...() functions return a Locator (or, where they say so, a value
 * read from the page) and do nothing to the page; the rest are actions.
 *
 * Images, videos and link previews, in the form and in posts, are in
 * media.js.
 *
 * For creating posts as a test's starting point, without the UI, use
 * test/lib/posts.js.
 ******************************************************************************/

const crypto = require('node:crypto')

const { eventually } = require('./wait')

const RUN = crypto.randomBytes(3).toString('hex')
let written = 0

/**
 * Text for a test to post: `label`, made unique, so the test can find its own
 * post among whatever else is on the page (on staging, other people's
 * posts, and other test runs').
 */
const uniqueText = function(label) {
    written += 1
    return `${label} (e2e ${RUN}-${written})`
}

// ============================================================================
// Post lists
// ============================================================================

/**
 * Wait for the post list on the page to have loaded: its header counts the
 * posts ('0 posts', '1 to 3 of 3 Posts') once it has them, and they're on the
 * page.
 */
const waitForPostList = async function(page) {
    await page.getByText(/^(0 posts|\d+ to \d+ of \d+ Posts)$/).waitFor()
}

/**
 * Get the button that opens a post list's sort menu. Its name is the sort
 * it's showing: 'Sort: Newest', 'Sort: Most Activity' or 'Sort: Recent
 * Activity'.
 */
const getSortButton = function(page) {
    return page.getByRole('button', { name: /^Sort: / })
}

/**
 * Sort the post list on the page by 'Newest', 'Most Activity' or 'Recent
 * Activity', and wait for the button to say so. The list reloads after,
 * on its own time: check its order with eventually().
 */
const chooseSort = async function(page, sort) {
    await getSortButton(page).click()
    await page.getByRole('menuitem', { name: sort, exact: true }).click()
    await page.getByRole('button', { name: `Sort: ${sort}`, exact: true }).waitFor()
}

// A post, as a list or a permalink page shows it. Posts aren't the only
// articles on a page (comments and the profile card beside a permalink are
// too), so it's found by its class as well as its role. A post that's shared
// shows inside the post sharing it, as an article of its own with the same id
// (SHARED_POST), and isn't one of these.
const POST = '.post[role="article"]:not(.shared)'
const SHARED_POST = '.post.shared[role="article"]'

/**
 * Wait for the page a post's permalink opens to have loaded: either the post,
 * or the 404 error saying it doesn't exist or can't be seen.
 */
const waitForPermalinkPage = async function(page) {
    await page.locator(POST).or(getPostNotFoundError(page)).first().waitFor()
}

/**
 * Get the post with this id in `scope` (a page, or part of one).
 *
 * To check what a post shows, get it by its id, which doesn't change, and
 * then check its content: getting it by the text you expect it to show would
 * only find it if it did.
 */
const getPostById = function(scope, id) {
    return scope.locator(`${POST}[id="${id}"]`)
}

/**
 * Get the ids of the posts in `scope` (a page, or part of one), in the order
 * they're shown. A value, read from the page.
 */
const getPostIds = async function(scope) {
    return await scope.locator(POST).evaluateAll((shown) => shown.map((post) => post.id))
}

/**
 * Get the posts in `scope` (a page, or part of one) whose text includes
 * `text`. For a post the test made in the browser, whose id it doesn't know.
 *
 * Neither the shared post inside a post that shares it, nor the post sharing
 * it, counts as including the shared post's text; getSharedPost() gets that.
 */
const getPostByText = function(scope, text) {
    const page = typeof scope.page === 'function' ? scope.page() : scope
    return scope.locator(POST).filter({
        hasText: text,
        hasNot: page.locator(SHARED_POST, { hasText: text })
    })
}

/**
 * Get the text the author wrote in `post`: its own content, without anything
 * it shares. Its innerText() is the post as it reads, with mentions shown as
 * '@' and the name of the person mentioned.
 */
const getPostContent = function(post) {
    return post.locator(':scope > .post__content')
}

/**
 * Get the post that `post` shares, which shows inside it.
 */
const getSharedPost = function(post) {
    return post.locator(`:scope > ${SHARED_POST}`)
}

/**
 * Get where `post` lives: the link on its timestamp, which is what a user
 * copies to share it. A path, like '/test-1a2b3c4d-user1/<post id>'. A
 * value, read from the page.
 */
const getPermalink = async function(post) {
    const id = await post.getAttribute('id')
    return await post.locator(`a[href$="/${id}"]`).first().getAttribute('href')
}

/**
 * Get who `post` is for, as it says under its author's name: 'Friends' or
 * 'Public'. Found by class: it's plain text with an icon.
 */
const getPostVisibility = function(post) {
    return post.locator(':scope > .post__header .post__visibility .text')
}

/**
 * Get the type a site admin's announcement or info post shows under its
 * author's name: 'Announcement' or 'Info'. Feed posts don't show one. Found
 * by class, like getPostVisibility().
 */
const getPostType = function(post) {
    return post.locator(':scope > .post__header .post__type')
}

/**
 * Get the link that shows the rest of a post longer than 1,000 characters.
 */
const getShowMoreLink = function(post) {
    return post.getByRole('link', { name: 'Show More.', exact: true })
}

/**
 * Get `post`'s "Share" button, which only public posts (and shares of them)
 * have.
 */
const getShareButton = function(post) {
    return post.getByRole('button', { name: 'Share post' })
}

/**
 * Get the 404 error a permalink shows when the post doesn't exist or the user
 * can't see it.
 */
const getPostNotFoundError = function(page) {
    return page.getByRole('heading', { name: '404 Error' })
}

// ============================================================================
// The post form
// ============================================================================

/**
 * Get the link at the top of a feed that opens the post form. It shows the
 * draft, if there is one, and otherwise 'Write a new post to your feed...'.
 *
 * Since its name is whatever the draft says, it's found by its class instead.
 */
const getCreatePostLink = function(page) {
    return page.locator('a.create-post__button')
}

/**
 * Get the post form's text box.
 */
const getPostFormTextbox = function(page) {
    return page.getByRole('combobox', { name: 'Write a post to your feed...' })
}

/**
 * Get who the post in the form is for, as the form shows it: 'Friends' or
 * 'Public'. Normally that's the visibility menu's button, but announcement
 * and info posts are public with no choice, and show it as plain text, so
 * it's found by class.
 */
const getFormVisibility = function(page) {
    return page.locator('.post-form .post-visibility-control')
}

/**
 * Get the post a post in the form shares, as the form shows it.
 */
const getSharedPostInForm = function(page) {
    return page.locator(`.post-form ${SHARED_POST}`)
}

/**
 * Get the button that opens the post form's visibility menu. It shows who the
 * post is for: 'Friends' or 'Public'.
 *
 * Its accessible name is broken ('Post visibility: [object Object]'), so it's
 * found by the start of it.
 */
const getVisibilityButton = function(page) {
    return page.getByRole('button', { name: /^Post visibility:/ })
}

/**
 * Choose who the post in the form is for: 'Friends' or 'Public'.
 */
const chooseVisibility = async function(page, visibility) {
    await getVisibilityButton(page).click()
    await page.getByRole('menuitem', { name: visibility, exact: true }).click()
    await eventually(async () => {
        const shown = (await getVisibilityButton(page).innerText()).trim()
        if ( shown !== visibility ) {
            throw new Error(`The post form's visibility is '${shown}', not '${visibility}'.`)
        }
    })
}

/**
 * Get the button that opens the post form's post type menu, which only site
 * admins have. It shows the post's type: 'Feed', 'Info' or 'Announcement'.
 *
 * Its accessible name is broken like the visibility button's ('Post
 * type:[object Object]').
 */
const getPostTypeButton = function(page) {
    return page.getByRole('button', { name: /^Post type:/ })
}

/**
 * Choose the type of the post in the form: 'Feed', 'Info' or 'Announcement'.
 */
const choosePostType = async function(page, type) {
    await getPostTypeButton(page).click()
    await page.getByRole('menuitem', { name: type, exact: true }).click()
    await eventually(async () => {
        const shown = (await getPostTypeButton(page).innerText()).trim()
        if ( shown !== type ) {
            throw new Error(`The post form's type is '${shown}', not '${type}'.`)
        }
    })
}

/**
 * Get the confirmation the post form asks for before it discards a post or
 * an edit with changes in it.
 */
const getDiscardDialog = function(page) {
    return page.getByRole('alertdialog').filter({ hasText: /Are you sure you want to discard your (post|edits)\?/ })
}

/**
 * Open the post form from the feed's create post link.
 */
const openPostForm = async function(page) {
    await getCreatePostLink(page).click()
    await page.waitForURL(/\/create\?/)
    await getPostFormTextbox(page).waitFor()
}

/**
 * Post what's in the post form. The form goes back to the page it was opened
 * from, `origin`.
 */
const submitPost = async function(page, origin = '/') {
    await page.getByRole('button', { name: 'Post', exact: true }).click()
    await page.waitForURL((url) => url.pathname === origin)
}

/**
 * Cancel the post form with changes in it, confirming that they should be
 * discarded. The form goes back to the page it was opened from.
 */
const discardPostForm = async function(page) {
    await page.getByRole('button', { name: 'Cancel', exact: true }).click()
    await getDiscardDialog(page).getByRole('button', { name: /^Discard (Post|Edits)$/ }).click()
    await page.waitForURL((url) => url.pathname !== '/create')
}

/**
 * Cancel the post form, and go back to the page it was opened from, without
 * minding whether it asks first: if it asks whether to discard the changes,
 * discard them. For the changes the form doesn't notice: it asks before
 * discarding an edit that changes a post's text, but not one that only
 * swaps an image for another, since it only compares how many there are.
 * Where the form should ask, use discardPostForm(), which expects it to.
 */
const cancelPostForm = async function(page) {
    const dialog = getDiscardDialog(page)
    await page.getByRole('button', { name: 'Cancel', exact: true }).click()
    await eventually(async () => {
        if ( new URL(page.url()).pathname === '/create' && ! await dialog.isVisible() ) {
            throw new Error(`The post form neither closed nor asked whether to discard it.`)
        }
    })
    if ( new URL(page.url()).pathname === '/create' ) {
        await dialog.getByRole('button', { name: /^Discard (Post|Edits)$/ }).click()
        await page.waitForURL((url) => url.pathname !== '/create')
    }
}

// ============================================================================
// A post's controls
// ============================================================================

/**
 * Get the items in `post`'s menu ('Copy Link', 'Edit', ...), once it's open.
 */
const getPostMenuItems = function(post) {
    return post.getByRole('menuitem')
}

/**
 * Open `post`'s menu.
 */
const openPostMenu = async function(post) {
    await post.getByRole('button', { name: 'More options' }).click()
    await getPostMenuItems(post).first().waitFor()
}

/**
 * Choose `action` ('Edit', 'Delete', 'Copy Link', ...) from the post's menu.
 */
const choosePostAction = async function(post, action) {
    await openPostMenu(post)
    await post.getByRole('menuitem', { name: action, exact: true }).click()
}

/**
 * Open the post form to edit `post`.
 */
const editPost = async function(page, post) {
    const id = await post.getAttribute('id')
    await choosePostAction(post, 'Edit')
    await page.waitForURL((url) => url.pathname === '/create' && url.searchParams.get('postId') === id)
    await getPostFormTextbox(page).waitFor()
}

/**
 * Save the edit in the post form. The form goes to the post's permalink.
 */
const saveEdit = async function(page) {
    const id = new URL(page.url()).searchParams.get('postId')
    await page.getByRole('button', { name: 'Edit Post', exact: true }).click()
    await page.waitForURL((url) => url.pathname.endsWith(`/${id}`))
}

/**
 * Delete `post` through its menu, and wait for it to go.
 */
const deletePost = async function(page, post) {
    await choosePostAction(post, 'Delete')
    await page.getByRole('alertdialog').getByRole('button', { name: 'Yes', exact: true }).click()
    await post.waitFor({ state: 'detached' })
}

/**
 * React to `post` with 'Like' or 'Dislike', and wait for the reaction to
 * register.
 */
const react = async function(post, reaction) {
    await post.getByRole('button', { name: reaction, exact: true }).click()
    await post.getByRole('button', { name: reaction, exact: true, pressed: true }).waitFor()
}

/**
 * Comment on `post`, and wait for the comment to show.
 */
const comment = async function(post, text) {
    await post.getByRole('link', { name: 'Start a comment...' }).click()
    await post.getByRole('combobox', { name: 'Write a comment...' }).fill(text)
    await post.getByRole('button', { name: 'Comment', exact: true }).click()
    await post.getByText(text).waitFor()
}

/**
 * Share `post`, with `text` of one's own, from the page it's on.
 */
const share = async function(page, post, text) {
    const origin = new URL(page.url()).pathname
    await post.getByRole('button', { name: 'Share post' }).click()
    await page.waitForURL(/\/create\?.*sharedPostId=/)
    await getPostFormTextbox(page).fill(text)
    await submitPost(page, origin)
}

module.exports = {
    uniqueText: uniqueText,

    waitForPostList: waitForPostList,
    getSortButton: getSortButton,
    chooseSort: chooseSort,
    waitForPermalinkPage: waitForPermalinkPage,
    getPostById: getPostById,
    getPostIds: getPostIds,
    getPostByText: getPostByText,
    getPostContent: getPostContent,
    getSharedPost: getSharedPost,
    getPermalink: getPermalink,
    getPostVisibility: getPostVisibility,
    getPostType: getPostType,
    getShowMoreLink: getShowMoreLink,
    getShareButton: getShareButton,
    getPostNotFoundError: getPostNotFoundError,

    getCreatePostLink: getCreatePostLink,
    getPostFormTextbox: getPostFormTextbox,
    getFormVisibility: getFormVisibility,
    getSharedPostInForm: getSharedPostInForm,
    getVisibilityButton: getVisibilityButton,
    chooseVisibility: chooseVisibility,
    getPostTypeButton: getPostTypeButton,
    choosePostType: choosePostType,
    getDiscardDialog: getDiscardDialog,
    openPostForm: openPostForm,
    submitPost: submitPost,
    discardPostForm: discardPostForm,
    cancelPostForm: cancelPostForm,

    getPostMenuItems: getPostMenuItems,
    openPostMenu: openPostMenu,
    choosePostAction: choosePostAction,
    editPost: editPost,
    saveEdit: saveEdit,
    deletePost: deletePost,
    react: react,
    comment: comment,
    share: share
}
