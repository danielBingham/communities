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
 * For creating posts as a test's starting point, without the UI, use
 * test/lib/posts.js.
 ******************************************************************************/

const crypto = require('node:crypto')

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
 * posts ('0 posts', '1 to 3 of 3 Posts') once it has them. Before checking a
 * post isn't on a page, wait for this, or the check passes because nothing
 * has loaded yet.
 */
const waitForPostList = async function(page) {
    await page.getByText(/^(0 posts|\d+ to \d+ of \d+ Posts)$/).waitFor()
}

/**
 * The posts in `scope` (a page, or part of one) that include `text`.
 *
 * A shared post shows inside the post that shares it, as an article of its
 * own. Neither that article nor the post sharing it counts as including the
 * shared post's text; findSharedPost() finds it there.
 */
const findPost = function(scope, text) {
    const page = typeof scope.page === 'function' ? scope.page() : scope
    return scope.locator('[role="article"]:not(.shared)').filter({
        hasText: text,
        hasNot: page.locator('[role="article"].shared', { hasText: text })
    })
}

/**
 * The post shared by `post` that includes `text`.
 */
const findSharedPost = function(post, text) {
    return post.locator('[role="article"].shared').filter({ hasText: text })
}

/**
 * Where `post` lives: the link on its timestamp, which is what a user copies
 * to share it. A path, like '/test-1a2b3c4d-user1/<post id>'.
 */
const permalink = async function(post) {
    const id = await post.getAttribute('id')
    return await post.locator(`a[href$="/${id}"]`).first().getAttribute('href')
}

/**
 * The 404 a permalink shows when the post doesn't exist or the user can't see
 * it.
 */
const postNotFound = function(page) {
    return page.getByRole('heading', { name: '404 Error' })
}

// ============================================================================
// The post form
// ============================================================================

const PLACEHOLDER = 'Write a new post to your feed...'

/**
 * The link at the top of a feed that opens the post form. It shows the draft,
 * if there is one, and otherwise invites a new post.
 */
const createPostLink = function(page, draft) {
    return page.getByRole('link', { name: draft ?? PLACEHOLDER })
}

/**
 * The post form's text box.
 */
const postTextbox = function(page) {
    return page.getByRole('combobox', { name: 'Write a post to your feed...' })
}

/**
 * Open the post form from the feed's create post link (showing `draft`, if
 * there is one).
 */
const openPostForm = async function(page, draft) {
    await createPostLink(page, draft).click()
    await page.waitForURL(/\/create\?/)
    await postTextbox(page).waitFor()
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
    await page.getByRole('alertdialog').getByRole('button', { name: /^Discard (Post|Edits)$/ }).click()
    await page.waitForURL((url) => url.pathname !== '/create')
}

// ============================================================================
// A post's controls
// ============================================================================

/**
 * Choose `action` ('Edit', 'Delete', ...) from the post's menu.
 */
const choosePostAction = async function(post, action) {
    await post.getByRole('button', { name: 'More options' }).click()
    await post.getByRole('menuitem', { name: action, exact: true }).click()
}

/**
 * Open the post form to edit `post`.
 */
const editPost = async function(page, post) {
    const id = await post.getAttribute('id')
    await choosePostAction(post, 'Edit')
    await page.waitForURL((url) => url.pathname === '/create' && url.searchParams.get('postId') === id)
    await postTextbox(page).waitFor()
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
    await postTextbox(page).fill(text)
    await submitPost(page, origin)
}

module.exports = {
    uniqueText: uniqueText,

    waitForPostList: waitForPostList,
    findPost: findPost,
    findSharedPost: findSharedPost,
    permalink: permalink,
    postNotFound: postNotFound,

    createPostLink: createPostLink,
    postTextbox: postTextbox,
    openPostForm: openPostForm,
    submitPost: submitPost,
    discardPostForm: discardPostForm,

    choosePostAction: choosePostAction,
    editPost: editPost,
    saveEdit: saveEdit,
    deletePost: deletePost,
    react: react,
    comment: comment,
    share: share
}
