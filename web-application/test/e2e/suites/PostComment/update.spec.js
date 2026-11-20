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
 * Update PostComment: documentation/testing/test-cases/PostComment/update.md
 *
 * Every case. The post the comments are on, and the comments each test
 * edits, are made through the API (../../../lib/posts.js and
 * ../../../lib/postComments.js).
 *
 * One case covers a bug that hasn't been fixed: editing a comment to mention
 * someone doesn't notify them. Its test is a to-do (Node's test runner's
 * `todo` option), which runs and reports how it went without failing the
 * run, until the bug is fixed and the option can come off.
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
const { makeFriends, clearRelationship } = require('../../../lib/relationships')

const { startBrowser, stopBrowser, openAs, cleanUp } = require('../../lib/browser')
const { checkSuite } = require('../../lib/suites')
const { openPage, followHeaderLink, logOut, logIn, getNotifications, waitForNotification } = require('../../lib/app')
const posts = require('../../lib/posts')
const comments = require('../../lib/comments')

describe('Update PostComment', function() {

    // API sessions, for setting up and cleaning up.
    let user1 = null
    let user2 = null
    let user3 = null

    // User1's public post, which the tests comment on, made through the API.
    let post = null

    before(async function() {
        await startBrowser()

        user1 = await loginAs('user1')
        user2 = await loginAs('user2')
        user3 = await loginAs('user3')

        // User3 is User2's friend, to mention. User1 is a stranger to both,
        // and they see the post because it's public.
        await clearRelationship(user1.session, user1.user.id, user2.session, user2.user.id)
        await clearRelationship(user1.session, user1.user.id, user3.session, user3.user.id)
        await clearRelationship(user2.session, user2.user.id, user3.session, user3.user.id)
        await makeFriends(user2.session, user2.user.id, user3.session, user3.user.id)

        await deleteAllPostsForUser(user1.session, user1.user.id)
        post = await createPost(user1.session, user1.user.id, {
            visibility: 'public',
            content: posts.uniqueText('A post to comment on')
        })
    })

    afterEach(async function(t) {
        await cleanUp(t)
        checkSuite(t)
    })

    after(async function() {
        await stopBrowser()

        // Deleting the post deletes its comments.
        if ( user1 ) {
            await deleteAllPostsForUser(user1.session, user1.user.id)
            await clearRelationship(user2.session, user2.user.id, user3.session, user3.user.id)
            await logout(user1.session)
        }
        if ( user2 ) await logout(user2.session)
        if ( user3 ) await logout(user3.session)
    })

    const permalink = () => `/${user1.fixture.username}/${post.id}`

    // Open User1's post on its own page, where its comments show, and return
    // it.
    const openPost = async function(page) {
        await openPage(page, permalink())
        await posts.waitForPermalinkPage(page)
        const view = posts.getPostById(page, post.id)
        assert.equal(await view.count(), 1, `Expected User1's post on its page.`)
        return view
    }

    // A comment of User2's on the post, made through the API, to edit.
    const createCommentToEdit = async function(content) {
        return await addComment(user2.session, post.id, content)
    }

    // Assert that `view`, User1's post, shows the comment with this id, saying
    // `text`, and not in an edit.
    const assertComment = async function(view, id, text) {
        const shown = comments.getCommentById(view, id)
        assert.equal(await shown.count(), 1, `Expected the comment on User1's post.`)
        assert.equal(await comments.getCommentContent(shown).innerText(), text)
        assert.equal(await comments.getEditForm(view).count(), 0, `Expected no edit open.`)
    }

    // Assert that `view` shows the edit of a comment open, with `text` in it.
    const assertEditing = async function(view, text) {
        await comments.waitForEditForm(view)
        assert.equal(await comments.getCommentTextbox(comments.getEditForm(view)).inputValue(), text)
    }

    it('As a user, I can edit my comments.', { tags: [ 'smoke-test', 'full-regression' ] }, async function() {
        const original = await createCommentToEdit(posts.uniqueText('Before the edit'))
        const edited = posts.uniqueText('After the edit')
        const { page } = await openAs('user2')

        const view = await openPost(page)
        const comment = comments.getCommentById(view, original.id)
        await assertComment(view, original.id, original.content)

        // The edit starts with the comment's text.
        await comments.editComment(view, comment)
        const textbox = comments.getCommentTextbox(comments.getEditForm(view))
        assert.equal(await textbox.inputValue(), original.content)
        await textbox.fill(edited)
        await comments.saveCommentEdit(view, comment)

        // The comment shows the edit, here and after a reload.
        await assertComment(view, original.id, edited)
        assert.equal(await view.getByText(original.content).count(), 0)

        await page.reload()
        await posts.waitForPermalinkPage(page)
        await assertComment(view, original.id, edited)
        assert.equal(await view.getByText(original.content).count(), 0)
    })

    it('As a user, I can cancel edits on my comments.', { tags: [ 'full-regression' ] }, async function() {
        const original = await createCommentToEdit(posts.uniqueText('A comment to keep'))
        const cancelled = posts.uniqueText('An edit to cancel')
        const { page } = await openAs('user2')

        const view = await openPost(page)
        const comment = comments.getCommentById(view, original.id)
        await comments.editComment(view, comment)
        await comments.getCommentTextbox(comments.getEditForm(view)).fill(cancelled)
        await comments.discardCommentForm(comments.getEditForm(view))

        // The comment shows its original text, here and after a reload.
        await assertComment(view, original.id, original.content)
        assert.equal(await view.getByText(cancelled).count(), 0)

        await page.reload()
        await posts.waitForPermalinkPage(page)
        await assertComment(view, original.id, original.content)
    })

    it(`As a user, I'm asked before my edits to a comment are discarded.`, { tags: [ 'full-regression' ] }, async function() {
        const original = await createCommentToEdit(posts.uniqueText('A comment to change'))
        const changed = posts.uniqueText('A change to discard')
        const { page } = await openAs('user2')
        const dialog = comments.getDiscardCommentDialog(page)

        const view = await openPost(page)
        const comment = comments.getCommentById(view, original.id)
        const form = comments.getEditForm(view)
        const textbox = comments.getCommentTextbox(form)

        // Without a change, Cancel closes the edit without asking.
        await comments.editComment(view, comment)
        await form.getByRole('button', { name: 'Cancel', exact: true }).click()
        await comment.waitFor()
        assert.equal(await dialog.count(), 0)
        await assertComment(view, original.id, original.content)

        // With one, it asks.
        await comments.editComment(view, comment)
        await textbox.fill(changed)
        await form.getByRole('button', { name: 'Cancel', exact: true }).click()
        await dialog.waitFor()
        assert.equal(await dialog.isVisible(), true, `Expected to be asked whether to discard the edits.`)

        // Keep editing: the edit still has the change.
        await dialog.getByRole('button', { name: 'Keep Editing', exact: true }).click()
        await dialog.waitFor({ state: 'detached' })
        await assertEditing(view, changed)

        // Discard it: the comment is as it was.
        await comments.discardCommentForm(form)
        await assertComment(view, original.id, original.content)
        assert.equal(await view.getByText(changed).count(), 0)
    })

    it(`A user cannot edit another user's comment.`, { tags: [ 'full-regression' ] }, async function() {
        const comment = await createCommentToEdit(posts.uniqueText(`A comment of User2's`))
        const author = await openAs('user1')
        const commenter = await openAs('user2')

        const getActions = async function(page) {
            const shown = comments.getCommentById(await openPost(page), comment.id)
            assert.equal(await shown.count(), 1, `Expected User2's comment on User1's post.`)
            await comments.openCommentMenu(shown)
            return (await comments.getCommentMenuItems(shown).allInnerTexts()).map((item) => item.trim())
        }

        // User1, whose post it's on, isn't offered "edit" on User2's comment.
        const theirActions = await getActions(author.page)
        assert.ok(theirActions.includes('Copy Link'), `Expected the menu to open: it has ${JSON.stringify(theirActions)}.`)
        assert.ok( ! theirActions.includes('edit'), `Expected no edit on someone else's comment: ${JSON.stringify(theirActions)}.`)

        // User2 is, on their own.
        const myActions = await getActions(commenter.page)
        assert.ok(myActions.includes('edit'), `Expected edit on one's own comment: ${JSON.stringify(myActions)}.`)
    })

    describe('Mentions', function() {

        // The notification User3 gets when User2 mentions them in `content`.
        const getMention = function(page, content) {
            return getNotifications(page, comments.mentionNotificationText({
                commenter: user2.fixture.name,
                comment: content,
                postAuthor: user1.fixture.name,
                post: post.content
            }))
        }

        it('As a user, I am not notified again when a comment mentioning me is edited.', { tags: [ 'full-regression' ] }, async function() {
            // The notification quotes the comment's first 20 characters,
            // which the short uniqueText() makes unique to it. The edit keeps
            // them, so a second notification would quote them too.
            const intro = posts.uniqueText('Hi')
            const original = await createCommentToEdit(`${intro} @${user3.fixture.username}, before the edit.`)
            const edited = `${intro} @${user3.fixture.username}, after the edit.`
            const mentioned = await openAs('user3')
            const commenter = await openAs('user2')
            const notification = getMention(mentioned.page, original.content)

            // User3 is notified of the mention.
            await waitForNotification(mentioned.page, notification)
            assert.equal(await notification.count(), 1, `Expected one notification of the mention.`)

            // User2 edits the comment, keeping the mention.
            const view = await openPost(commenter.page)
            const comment = comments.getCommentById(view, original.id)
            await comments.editComment(view, comment)
            await comments.getCommentTextbox(comments.getEditForm(view)).fill(edited)
            await comments.saveCommentEdit(view, comment)

            // Then mentions User3 again in a new comment. Once User3 has
            // been notified of that, the worker has done whatever it was
            // going to do about the edit, which came first.
            const later = await addComment(user2.session, post.id, `${posts.uniqueText('Hi')} @${user3.fixture.username}, again.`)
            await waitForNotification(mentioned.page, getMention(mentioned.page, later.content))

            // User3 has still only been notified of the first mention once.
            assert.equal(await notification.count(), 1, `Expected the edit not to notify User3 again.`)
        })

        it('As a user, I am notified when I am newly mentioned during a comment edit.', {
            tags: [ 'full-regression' ],
            todo: 'Editing a comment sends no notifications, so a mention added in an edit goes unannounced.'
        }, async function() {
            const intro = posts.uniqueText('Hi')
            const original = await createCommentToEdit(`${intro}, no mentions yet.`)
            const edited = `${intro}, now mentioning @${user3.fixture.username}.`
            const mentioned = await openAs('user3')
            const commenter = await openAs('user2')

            // User2 adds a mention of User3 in an edit.
            const view = await openPost(commenter.page)
            const comment = comments.getCommentById(view, original.id)
            await comments.editComment(view, comment)
            await comments.getCommentTextbox(comments.getEditForm(view)).fill(edited)
            await comments.saveCommentEdit(view, comment)

            // User3 is notified: of a mention in the comment. Found by what it
            // quotes, since the bug's fix may word it differently from a
            // mention in a new comment.
            const notification = getNotifications(mentioned.page, `"${edited.substring(0, 20)}...", on a post by ${user1.fixture.name}`)
            await waitForNotification(mentioned.page, notification)
            assert.match(await notification.innerText(), new RegExp(`^${user2.fixture.name} mentioned you in their comment`))
        })
    })

    describe('Drafts', function() {

        it('As a user, my comment edit drafts are saved.', { tags: [ 'full-regression' ] }, async function() {
            const original = await createCommentToEdit(posts.uniqueText('Saved before the draft'))
            const draft = posts.uniqueText('An edit in progress')
            const reader = await openAs('user1')
            const commenter = await openAs('user2')
            const page = commenter.page

            const view = await openPost(page)
            const comment = comments.getCommentById(view, original.id)
            await comments.editComment(view, comment)
            await comments.getCommentTextbox(comments.getEditForm(view)).fill(draft)

            // Reload: the edit is still open, with the draft in it.
            await page.reload()
            await posts.waitForPermalinkPage(page)
            await assertEditing(view, draft)
            assert.equal(await comment.count(), 0, `Expected the edit in the comment's place.`)

            // Navigate away and back: the same.
            await followHeaderLink(page, 'Friends')
            await page.waitForURL('/friends')
            await page.goBack()
            await page.waitForURL((url) => url.pathname === permalink())
            await posts.waitForPermalinkPage(page)
            await assertEditing(view, draft)

            // User1 sees the comment as it's saved, without the draft.
            const theirView = await openPost(reader.page)
            await assertComment(theirView, original.id, original.content)
            assert.equal(await theirView.getByText(draft).count(), 0)

            // User2 saves it: the comment shows the edit, for both.
            await comments.saveCommentEdit(view, comment)
            await assertComment(view, original.id, draft)

            await reader.page.reload()
            await posts.waitForPermalinkPage(reader.page)
            await assertComment(theirView, original.id, draft)
            assert.equal(await theirView.getByText(original.content).count(), 0)
        })

        it('As a user, my comment edit drafts are deleted when I log out.', { tags: [ 'full-regression' ] }, async function() {
            const original = await createCommentToEdit(posts.uniqueText('Saved before the lost draft'))
            const draft = posts.uniqueText('An edit to lose')
            // Its own session, since logging out ends it.
            const { page, fixture } = await openAs('user2', { fresh: true })

            const view = await openPost(page)
            const comment = comments.getCommentById(view, original.id)
            await comments.editComment(view, comment)
            await comments.getCommentTextbox(comments.getEditForm(view)).fill(draft)

            await logOut(page)
            await logIn(page, fixture)

            // The comment is as it was, with no edit open, and editing it
            // starts from what's saved.
            await openPost(page)
            await assertComment(view, original.id, original.content)
            assert.equal(await view.getByText(draft).count(), 0)

            await comments.editComment(view, comment)
            await assertEditing(view, original.content)
        })

        it('As a user, I can cancel a comment edit and the draft is deleted.', { tags: [ 'full-regression' ] }, async function() {
            const original = await createCommentToEdit(posts.uniqueText('Saved before the cancelled draft'))
            const draft = posts.uniqueText('An edit to cancel')
            const { page } = await openAs('user2')

            const view = await openPost(page)
            const comment = comments.getCommentById(view, original.id)
            await comments.editComment(view, comment)
            await comments.getCommentTextbox(comments.getEditForm(view)).fill(draft)

            // Reload: the draft is still there.
            await page.reload()
            await posts.waitForPermalinkPage(page)
            await assertEditing(view, draft)

            // Cancel it: the comment is as it was, and stays that way after a
            // reload, with no edit open.
            await comments.discardCommentForm(comments.getEditForm(view))
            await assertComment(view, original.id, original.content)

            await page.reload()
            await posts.waitForPermalinkPage(page)
            await assertComment(view, original.id, original.content)
            assert.equal(await view.getByText(draft).count(), 0)
        })
    })
})
