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
const { describe, it, before, after } = require('node:test')
const assert = require('node:assert/strict')

const { initialize, logout, loginAs } = require('../../lib/authentication')
const { createPost, deleteAllPostsForUser } = require('../../lib/posts')
const { addComment } = require('../../lib/postComments')
const { clearRelationship } = require('../../lib/relationships')
const { isFeatureEnabled } = require('../../lib/system')
const {
    COMMENT_REACTIONS_FEATURE,
    deleteCommentReaction,
    addCommentReaction
} = require('../../lib/commentReactions')

// user1 writes the post, user2 comments on it, and user3 reacts to the
// comment.
describe('DELETE /post/:postId/comment/:commentId/reaction', function() {

    let enabled = false
    let author = null
    let commenter = null
    let reactor = null

    before(async function() {
        enabled = await isFeatureEnabled(COMMENT_REACTIONS_FEATURE)

        author = await loginAs('user1')
        commenter = await loginAs('user2')
        reactor = await loginAs('user3')

        await clearRelationship(author.session, author.user.id, reactor.session, reactor.user.id)
        await clearRelationship(commenter.session, commenter.user.id, reactor.session, reactor.user.id)
        await deleteAllPostsForUser(author.session, author.user.id)
    })

    after(async function() {
        await deleteAllPostsForUser(author.session, author.user.id)

        await logout(author.session)
        await logout(commenter.session)
        await logout(reactor.session)
    })

    const createCommentedPost = async function() {
        const post = await createPost(author.session, author.user.id, { visibility: 'public' })
        const comment = await addComment(commenter.session, post.id, 'A comment to react to.')
        return { post, comment }
    }

    it(`Should reject an unauthenticated request`, async function(t) {
        if ( ! enabled ) { t.skip(`${COMMENT_REACTIONS_FEATURE} feature is not enabled`); return }

        const session = await initialize()

        const response = await deleteCommentReaction(session, crypto.randomUUID(), crypto.randomUUID())

        assert.equal(response.status, 401)
        assert.equal(response.content?.error?.type, 'not-authenticated')
    })

    it(`Should let a user remove their like`, async function(t) {
        if ( ! enabled ) { t.skip(`${COMMENT_REACTIONS_FEATURE} feature is not enabled`); return }

        const { post, comment } = await createCommentedPost()
        const reaction = await addCommentReaction(reactor.session, post.id, comment.id)

        const response = await deleteCommentReaction(reactor.session, post.id, comment.id)

        assert.equal(response.status, 200)
        // The deleted reaction comes back so the client can remove it.
        assert.equal(response.content?.entity?.id, reaction.id)

        // The comment comes back as a relation, without the reaction.
        const updatedComment = response.content.relations?.postComments?.[comment.id]
        assert.ok(updatedComment, 'The PostComment should be returned as a relation.')
        assert.deepEqual(updatedComment.reactions, [])
    })

    it(`Should only remove the current user's like`, async function(t) {
        if ( ! enabled ) { t.skip(`${COMMENT_REACTIONS_FEATURE} feature is not enabled`); return }

        const { post, comment } = await createCommentedPost()
        const authorReaction = await addCommentReaction(author.session, post.id, comment.id)
        await addCommentReaction(reactor.session, post.id, comment.id)

        const response = await deleteCommentReaction(reactor.session, post.id, comment.id)

        assert.equal(response.status, 200)
        assert.deepEqual(response.content.relations?.postComments?.[comment.id]?.reactions, [ authorReaction.id ])
    })

    it(`Should let a user like a comment again after removing their like`, async function(t) {
        if ( ! enabled ) { t.skip(`${COMMENT_REACTIONS_FEATURE} feature is not enabled`); return }

        const { post, comment } = await createCommentedPost()
        await addCommentReaction(reactor.session, post.id, comment.id)

        const deleteResponse = await deleteCommentReaction(reactor.session, post.id, comment.id)
        assert.equal(deleteResponse.status, 200)

        const reaction = await addCommentReaction(reactor.session, post.id, comment.id)
        assert.equal(reaction.userId, reactor.user.id)
    })

    it(`Should return 404 when the user hasn't liked the comment`, async function(t) {
        if ( ! enabled ) { t.skip(`${COMMENT_REACTIONS_FEATURE} feature is not enabled`); return }

        const { post, comment } = await createCommentedPost()
        // Someone else's like isn't the reactor's to remove.
        await addCommentReaction(author.session, post.id, comment.id)

        const response = await deleteCommentReaction(reactor.session, post.id, comment.id)

        assert.equal(response.status, 404)
        assert.equal(response.content?.error?.type, 'not-found')
    })

    it(`Should return 404 when the comment isn't on the post in the path`, async function(t) {
        if ( ! enabled ) { t.skip(`${COMMENT_REACTIONS_FEATURE} feature is not enabled`); return }

        const first = await createCommentedPost()
        const second = await createCommentedPost()
        await addCommentReaction(reactor.session, first.post.id, first.comment.id)

        const response = await deleteCommentReaction(reactor.session, second.post.id, first.comment.id)

        assert.equal(response.status, 404)
        assert.equal(response.content?.error?.type, 'not-found')
    })
})
