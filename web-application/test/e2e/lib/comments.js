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
 * Comments in the browser: a post's comment thread, the comment form, and
 * what a comment's controls do (its menu, "Reply").
 *
 * Comments are found in their post (posts.getPostById(), or getPostByText()
 * for one the test made in the browser), since a page can show more than one
 * post's.
 *
 * The get...() functions return a Locator (or, where they say so, a value
 * read from the page) and do nothing to the page; the rest are actions.
 *
 * For creating comments as a test's starting point, without the UI, use
 * test/lib/postComments.js.
 *
 * The notifications a comment sends are in the header's notification menu
 * (app.js). The ...NotificationText() functions at the end give the text of
 * each, as the server words it, for a test to find and check them by.
 ******************************************************************************/

// A comment, as a post's thread shows it: an article inside the post's, with
// the id 'comment-<id>'. It's found by its class as well as its role, like a
// post (see posts.js): the profile card beside a permalink is an article too.
const COMMENT = '.post-comment[role="article"]'

// The comment form: the one at the end of the thread for a new comment, and
// the one an edit opens in the comment's place. They have no role or name to
// find them by, so they're found by class, and told apart by their buttons.
const COMMENT_FORM = '.post-comment-form'

// ============================================================================
// The thread
// ============================================================================

/**
 * Get the comment with this id in `scope` (a page, a post, or part of one).
 *
 * As with posts, to check what a comment shows, get it by its id, which
 * doesn't change, and then check its content.
 */
const getCommentById = function(scope, id) {
    return scope.locator(`${COMMENT}[id="comment-${id}"]`)
}

/**
 * Get the comments `post` shows, in the order it shows them.
 */
const getComments = function(post) {
    return post.locator(COMMENT)
}

/**
 * Get the ids of the comments `post` shows, in the order it shows them. A
 * value, read from the page.
 */
const getCommentIds = async function(post) {
    return await getComments(post).evaluateAll((shown) => shown.map((comment) => comment.id.replace(/^comment-/, '')))
}

/**
 * Get the comments in `post` whose text includes `text`. For a comment the
 * test made in the browser, whose id it doesn't know.
 */
const getCommentByText = function(post, text) {
    return getComments(post).filter({ hasText: text })
}

/**
 * Get what `comment` says: its innerText() is the comment as it reads, with
 * mentions shown as '@' and the name of the person mentioned. For a comment
 * a moderator removed, it's the notice saying so. Found by class: it's the
 * comment's text, with nothing around it to find it by.
 */
const getCommentContent = function(comment) {
    return comment.locator(':scope > .post-comment__content')
}

/**
 * Get the link to the profile of the user who wrote `comment`, which is
 * named for them. The first link in its header, which is found by class.
 */
const getCommentAuthor = function(comment) {
    return comment.locator(':scope > .post-comment__header').getByRole('link').first()
}

/**
 * Get the link that shows `post`'s comments, which a feed folds away: 'Show 2
 * comments.'
 */
const getShowCommentsLink = function(post) {
    return post.getByRole('link', { name: /^Show \d+ comments\.$/ })
}

/**
 * Get the link that folds `post`'s comments away again: 'Hide 2 comments.'
 */
const getHideCommentsLink = function(post) {
    return post.getByRole('link', { name: /^Hide \d+ comments\.$/ })
}

/**
 * Get `comment`'s "Reply" link, which is named for who it replies to: 'Reply
 * to Test User1'.
 */
const getReplyLink = function(comment) {
    return comment.getByRole('link', { name: /^Reply to / })
}

/**
 * Get the items in `comment`'s menu ('Copy Link', 'edit', 'delete', ...),
 * once it's open.
 */
const getCommentMenuItems = function(comment) {
    return comment.getByRole('menuitem')
}

/**
 * Get the confirmation the app asks for before it deletes a comment.
 */
const getDeleteCommentDialog = function(page) {
    return page.getByRole('alertdialog').filter({ hasText: 'Are you sure you want to delete this comment?' })
}

// ============================================================================
// The comment form
// ============================================================================

/**
 * Get the link at the end of `post`'s thread that opens the form for a new
 * comment.
 */
const getStartCommentLink = function(post) {
    return post.getByRole('link', { name: 'Start a comment...', exact: true })
}

/**
 * Get the form for a new comment on `post`, at the end of its thread, once
 * it's open.
 */
const getCommentForm = function(post) {
    return post.locator(COMMENT_FORM).filter({ has: post.page().getByRole('button', { name: 'Comment', exact: true }) })
}

/**
 * Get the form editing a comment on `post`, which takes the comment's place
 * in the thread while it's open.
 */
const getEditForm = function(post) {
    return post.locator(COMMENT_FORM).filter({ has: post.page().getByRole('button', { name: 'Save Edit', exact: true }) })
}

/**
 * Get the text box of `form`, from getCommentForm() or getEditForm().
 */
const getCommentTextbox = function(form) {
    return form.getByRole('combobox', { name: 'Write a comment...' })
}

/**
 * Get the list of users the comment form (or the post form) suggests while a
 * mention is being written: options named for each user, the highlighted one
 * selected.
 */
const getMentionSuggestions = function(page) {
    return page.getByRole('listbox', { name: 'User suggestions' })
}

/**
 * Get the confirmation the comment form asks for before it discards a
 * comment or an edit with changes in it.
 */
const getDiscardCommentDialog = function(page) {
    return page.getByRole('alertdialog').filter({ hasText: /Are you sure you want to discard your (comment|edits)\?/ })
}

/**
 * Get the error the app shows when posting a comment or saving an edit
 * fails: a dialog saying what went wrong, 'Attempt to create comment failed.
 * This is probably a network error.', say.
 */
const getCommentErrorDialog = function(page) {
    return page.getByRole('dialog').filter({ hasText: /^Attempt to (create|edit) comment/ })
}

/**
 * Open the form for a new comment on `post`. If it's already open (with a
 * draft in it, say), leave it as it is.
 */
const openCommentForm = async function(post) {
    const textbox = getCommentTextbox(getCommentForm(post))
    await getStartCommentLink(post).or(textbox).first().waitFor()
    if ( ! await textbox.isVisible() ) {
        await getStartCommentLink(post).click()
    }
    await textbox.waitFor()
}

/**
 * Start a comment on `post` and write `text` in it, without posting it: a
 * draft.
 */
const writeComment = async function(post, text) {
    await openCommentForm(post)
    await getCommentTextbox(getCommentForm(post)).fill(text)
}

/**
 * Type `keys` into `textbox` (a comment form's, or the post form's), where
 * they continue a mention, and wait for the suggestions for it: `mention` is
 * the whole of it so far, without the '@' ('Test Us'). The form asks the
 * server for them once typing stops, and until they come, it shows the ones
 * it had before, which may be the same names, so a check of the list could
 * pass on them, only for it to change under the next keystroke.
 */
const typeMention = async function(textbox, keys, mention) {
    const suggested = textbox.page().waitForResponse((response) => {
        const url = new URL(response.url())
        return url.pathname.endsWith('/users') && url.searchParams.get('mention') === mention
    })
    await textbox.pressSequentially(keys)
    await suggested
}

/**
 * Wait for `done`, which shows once the comment form has done what the test
 * just clicked. If the request it made fails instead, the app says why, and
 * this throws with what it said rather than waiting out the timeout.
 */
const waitForCommentRequest = async function(page, done, action) {
    const failed = getCommentErrorDialog(page)
    await done.or(failed).first().waitFor()
    if ( await failed.isVisible() ) {
        throw new Error(`${action} failed. The app says: "${await failed.innerText()}"`)
    }
}

/**
 * Post the new comment in `post`'s comment form, and wait for it to be
 * posted: the form closes, leaving the link to start another.
 */
const submitComment = async function(post) {
    await getCommentForm(post).getByRole('button', { name: 'Comment', exact: true }).click()
    await waitForCommentRequest(post.page(), getStartCommentLink(post), 'Posting the comment')
}

/**
 * Comment `text` on `post`, through the comment form, and wait for it to be
 * posted.
 */
const commentOn = async function(post, text) {
    await writeComment(post, text)
    await submitComment(post)
}

/**
 * Cancel `form` (from getCommentForm() or getEditForm()) with changes in it,
 * confirming that they should be discarded, and wait for it to close.
 */
const discardCommentForm = async function(form) {
    const page = form.page()
    await form.getByRole('button', { name: 'Cancel', exact: true }).click()
    await getDiscardCommentDialog(page).getByRole('button', { name: /^Discard (Comment|Edits)$/ }).click()
    await form.waitFor({ state: 'detached' })
}

// ============================================================================
// A comment's controls
// ============================================================================

/**
 * Open `comment`'s menu.
 */
const openCommentMenu = async function(comment) {
    await comment.getByRole('button', { name: 'More options' }).click()
    await getCommentMenuItems(comment).first().waitFor()
}

/**
 * Choose `action` ('Copy Link', 'edit', 'delete', 'Flag for Site
 * Moderators') from `comment`'s menu.
 */
const chooseCommentAction = async function(comment, action) {
    await openCommentMenu(comment)
    await comment.getByRole('menuitem', { name: action, exact: true }).click()
}

/**
 * Open the form to edit `comment`, on `post`. The form takes the comment's
 * place in the thread.
 */
const editComment = async function(post, comment) {
    await chooseCommentAction(comment, 'edit')
    await getCommentTextbox(getEditForm(post)).waitFor()
}

/**
 * Save the edit of `comment` open in `post`'s thread, and wait for it to be
 * saved: the form closes, and the comment is back in its place.
 */
const saveCommentEdit = async function(post, comment) {
    await getEditForm(post).getByRole('button', { name: 'Save Edit', exact: true }).click()
    await waitForCommentRequest(post.page(), comment, 'Saving the edit')
}

/**
 * Delete `comment` through its menu, confirming it, and wait for it to go.
 */
const deleteComment = async function(comment) {
    await chooseCommentAction(comment, 'delete')
    await getDeleteCommentDialog(comment.page()).getByRole('button', { name: 'Yes', exact: true }).click()
    await comment.waitFor({ state: 'detached' })
}

/**
 * Flag `comment` for the site moderators through its menu, confirming it,
 * and wait for its menu to say so.
 */
const flagComment = async function(comment) {
    const question = comment.page().getByRole('alertdialog').filter({ hasText: 'Are you sure you want to flag this comment for Site moderators?' })
    await chooseCommentAction(comment, 'Flag for Site Moderators')
    await question.getByRole('button', { name: 'Yes', exact: true }).click()
    await question.waitFor({ state: 'detached' })
    await openCommentMenu(comment)
    await comment.getByRole('menuitem', { name: 'Flagged', exact: true }).waitFor()
}

// ============================================================================
// Notifications about comments
// ============================================================================

// A notification quotes the first 20 characters of the comment and the post.
const intro = function(text) {
    return text.length > 20 ? `${text.substring(0, 20)}...` : text
}

/**
 * The text of the notification a user gets when `commenter` mentions them in
 * `comment` on `postAuthor`'s `post`, as the server words it. Names are the
 * users' names; `comment` and `post` are their content.
 *
 * Notifications are told apart by what they quote, the first 20 characters
 * of each, so a test that looks for one starts its comment with a short
 * uniqueText(), which is unique in its first 20.
 */
const mentionNotificationText = function({ commenter, comment, postAuthor, post }) {
    return `${commenter} mentioned you in their comment, "${intro(comment)}", on a post by ${postAuthor}, "${intro(post)}".`
}

/**
 * The text of the notification a user subscribed to `post` gets when
 * `commenter` comments `comment` on it.
 */
const subscriberNotificationText = function({ commenter, comment, post }) {
    return `${commenter} commented, "${intro(comment)}", on a post, "${intro(post)}", you subscribe to.`
}

/**
 * The text of the notification `post`'s author gets when `commenter`
 * comments `comment` on it.
 */
const authorNotificationText = function({ commenter, comment, post }) {
    return `${commenter} commented, "${intro(comment)}", on your post, "${intro(post)}"`
}

module.exports = {
    getCommentById: getCommentById,
    getComments: getComments,
    getCommentIds: getCommentIds,
    getCommentByText: getCommentByText,
    getCommentContent: getCommentContent,
    getCommentAuthor: getCommentAuthor,
    getShowCommentsLink: getShowCommentsLink,
    getHideCommentsLink: getHideCommentsLink,
    getReplyLink: getReplyLink,
    getCommentMenuItems: getCommentMenuItems,
    getDeleteCommentDialog: getDeleteCommentDialog,

    getStartCommentLink: getStartCommentLink,
    getCommentForm: getCommentForm,
    getEditForm: getEditForm,
    getCommentTextbox: getCommentTextbox,
    getMentionSuggestions: getMentionSuggestions,
    typeMention: typeMention,
    getDiscardCommentDialog: getDiscardCommentDialog,
    getCommentErrorDialog: getCommentErrorDialog,
    openCommentForm: openCommentForm,
    writeComment: writeComment,
    submitComment: submitComment,
    commentOn: commentOn,
    discardCommentForm: discardCommentForm,

    openCommentMenu: openCommentMenu,
    chooseCommentAction: chooseCommentAction,
    editComment: editComment,
    saveCommentEdit: saveCommentEdit,
    deleteComment: deleteComment,
    flagComment: flagComment,

    mentionNotificationText: mentionNotificationText,
    subscriberNotificationText: subscriberNotificationText,
    authorNotificationText: authorNotificationText
}
