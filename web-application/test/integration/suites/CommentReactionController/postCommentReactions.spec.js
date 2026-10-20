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
const { addComment, getPostComments } = require('../../lib/postComments')
const { blockUser, clearRelationship } = require('../../lib/relationships')
const { isFeatureEnabled } = require('../../lib/system')
const {
    COMMENT_REACTIONS_FEATURE,
    postCommentReaction,
    addCommentReaction
} = require('../../lib/commentReactions')

// user1 writes the post, user2 comments on it, and user3 reacts to the
// comment.  Each test creates its own post and comment, and the `after`
// cleans up posts (which cascades to comments and reactions) and any blocks.
describe('POST /post/:postId/comment/:commentId/reactions', function() {

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
        await clearRelationship(author.session, author.user.id, reactor.session, reactor.user.id)
        await clearRelationship(commenter.session, commenter.user.id, reactor.session, reactor.user.id)
        await deleteAllPostsForUser(author.session, author.user.id)

        await logout(author.session)
        await logout(commenter.session)
        await logout(reactor.session)
    })

    // A public post, so that every fixture user can see it, with a comment on it.
    const createCommentedPost = async function(visibility = 'public') {
        const post = await createPost(author.session, author.user.id, { visibility: visibility })
        const comment = await addComment(commenter.session, post.id, 'A comment to react to.')
        return { post, comment }
    }

    it(`Should reject an unauthenticated request`, async function(t) {
        if ( ! enabled ) { t.skip(`${COMMENT_REACTIONS_FEATURE} feature is not enabled`); return }

        const session = await initialize()

        const response = await postCommentReaction(session, crypto.randomUUID(), crypto.randomUUID(), { reaction: 'like' })

        assert.equal(response.status, 401)
        assert.equal(response.content?.error?.type, 'not-authenticated')
    })

    it(`Should let a user like a comment they can see`, async function(t) {
        if ( ! enabled ) { t.skip(`${COMMENT_REACTIONS_FEATURE} feature is not enabled`); return }

        const { post, comment } = await createCommentedPost()

        const response = await postCommentReaction(reactor.session, post.id, comment.id, { reaction: 'like' })

        assert.equal(response.status, 201)

        const entity = response.content.entity
        assert.equal(entity.postId, post.id)
        assert.equal(entity.commentId, comment.id)
        assert.equal(entity.userId, reactor.user.id)
        assert.equal(entity.reaction, 'like')

        // The comment comes back as a relation, with the reaction in its list.
        const updatedComment = response.content.relations?.postComments?.[comment.id]
        assert.ok(updatedComment, 'The PostComment should be returned as a relation.')
        assert.deepEqual(updatedComment.reactions, [ entity.id ])
    })

    it(`Should not let a user like their own comment`, async function(t) {
        if ( ! enabled ) { t.skip(`${COMMENT_REACTIONS_FEATURE} feature is not enabled`); return }

        const { post, comment } = await createCommentedPost()

        const response = await postCommentReaction(commenter.session, post.id, comment.id, { reaction: 'like' })

        assert.equal(response.status, 403)
        assert.equal(response.content?.error?.type, 'not-authorized')

        // And no reaction was created.
        const commentsResponse = await getPostComments(commenter.session, post.id)
        assert.equal(commentsResponse.status, 200)
        assert.deepEqual(commentsResponse.content.dictionary?.[comment.id]?.reactions, [])
    })

    it(`Should let the post's author like other users' comments on their post`, async function(t) {
        if ( ! enabled ) { t.skip(`${COMMENT_REACTIONS_FEATURE} feature is not enabled`); return }

        const { post, comment } = await createCommentedPost()

        const response = await postCommentReaction(author.session, post.id, comment.id, { reaction: 'like' })

        assert.equal(response.status, 201)
        assert.equal(response.content.entity.userId, author.user.id)
    })

    it(`Should not let a user like the same comment twice`, async function(t) {
        if ( ! enabled ) { t.skip(`${COMMENT_REACTIONS_FEATURE} feature is not enabled`); return }

        const { post, comment } = await createCommentedPost()
        await addCommentReaction(reactor.session, post.id, comment.id)

        const response = await postCommentReaction(reactor.session, post.id, comment.id, { reaction: 'like' })

        assert.equal(response.status, 400)
        assert.equal(response.content?.error?.type, 'invalid')
    })

    it(`Should reject reactions other than 'like'`, async function(t) {
        if ( ! enabled ) { t.skip(`${COMMENT_REACTIONS_FEATURE} feature is not enabled`); return }

        const { post, comment } = await createCommentedPost()

        for ( const reaction of [ 'dislike', 'block', 'love', null, undefined ] ) {
            const response = await postCommentReaction(reactor.session, post.id, comment.id, { reaction: reaction })

            assert.equal(response.status, 400, `Reaction '${reaction}' should be rejected.`)
            assert.equal(response.content?.error?.type, 'invalid')
        }
    })

    it(`Should return 404 for a comment that doesn't exist`, async function(t) {
        if ( ! enabled ) { t.skip(`${COMMENT_REACTIONS_FEATURE} feature is not enabled`); return }

        const { post } = await createCommentedPost()

        const response = await postCommentReaction(reactor.session, post.id, crypto.randomUUID(), { reaction: 'like' })

        assert.equal(response.status, 404)
        assert.equal(response.content?.error?.type, 'not-found')
    })

    it(`Should return 404 when the comment isn't on the post in the path`, async function(t) {
        if ( ! enabled ) { t.skip(`${COMMENT_REACTIONS_FEATURE} feature is not enabled`); return }

        const first = await createCommentedPost()
        const second = await createCommentedPost()

        const response = await postCommentReaction(reactor.session, second.post.id, first.comment.id, { reaction: 'like' })

        assert.equal(response.status, 404)
        assert.equal(response.content?.error?.type, 'not-found')
    })

    it(`Should return 404 for a comment on a post the user can't view`, async function(t) {
        if ( ! enabled ) { t.skip(`${COMMENT_REACTIONS_FEATURE} feature is not enabled`); return }

        // The author can always comment on their own private post, but the
        // reactor isn't their friend so can't see it.
        const post = await createPost(author.session, author.user.id, { visibility: 'private' })
        const comment = await addComment(author.session, post.id, 'A comment on a private post.')

        const response = await postCommentReaction(reactor.session, post.id, comment.id, { reaction: 'like' })

        assert.equal(response.status, 404)
        assert.equal(response.content?.error?.type, 'not-found')
    })

    it(`Should return 404 when the comment's author has blocked the user`, async function(t) {
        if ( ! enabled ) { t.skip(`${COMMENT_REACTIONS_FEATURE} feature is not enabled`); return }

        try {
            const { post, comment } = await createCommentedPost()
            await blockUser(commenter.session, commenter.user.id, reactor.user.id)

            const response = await postCommentReaction(reactor.session, post.id, comment.id, { reaction: 'like' })

            assert.equal(response.status, 404)
            assert.equal(response.content?.error?.type, 'not-found')
        } finally {
            await clearRelationship(commenter.session, commenter.user.id, reactor.session, reactor.user.id)
        }
    })

    it(`Should return 404 when the user has blocked the comment's author`, async function(t) {
        if ( ! enabled ) { t.skip(`${COMMENT_REACTIONS_FEATURE} feature is not enabled`); return }

        try {
            const { post, comment } = await createCommentedPost()
            await blockUser(reactor.session, reactor.user.id, commenter.user.id)

            const response = await postCommentReaction(reactor.session, post.id, comment.id, { reaction: 'like' })

            assert.equal(response.status, 404)
            assert.equal(response.content?.error?.type, 'not-found')
        } finally {
            await clearRelationship(commenter.session, commenter.user.id, reactor.session, reactor.user.id)
        }
    })
})
