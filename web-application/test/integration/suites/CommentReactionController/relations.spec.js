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
const { describe, it, before, after, afterEach } = require('node:test')
const assert = require('node:assert/strict')

const { logout, loginAs } = require('../../lib/authentication')
const { getPost, createPost, deleteAllPostsForUser } = require('../../lib/posts')
const { addComment, getPostComments } = require('../../lib/postComments')
const { blockUser, clearRelationship } = require('../../lib/relationships')
const { isFeatureEnabled } = require('../../lib/system')
const {
    COMMENT_REACTIONS_FEATURE,
    addCommentReaction
} = require('../../lib/commentReactions')

// CommentReactions are sent to the client as `commentReactions` relations of
// the PostComments they are on, by both GET /post/:id and
// GET /post/:postId/comments.  Reactions from users who are blocked by, or
// have blocked, the viewer must never be sent.
//
// user1 writes a public post, user2 comments on it, user3 and user4 like the
// comment, and user5 views it.
describe('CommentReaction relations', function() {

    let enabled = false

    let author = null
    let commenter = null
    let liker = null
    let otherLiker = null
    let viewer = null

    let post = null
    let comment = null
    let like = null
    let otherLike = null

    const clearBlocks = async function() {
        await clearRelationship(liker.session, liker.user.id, viewer.session, viewer.user.id)
        await clearRelationship(otherLiker.session, otherLiker.user.id, viewer.session, viewer.user.id)
    }

    before(async function() {
        enabled = await isFeatureEnabled(COMMENT_REACTIONS_FEATURE)

        author = await loginAs('user1')
        commenter = await loginAs('user2')
        liker = await loginAs('user3')
        otherLiker = await loginAs('user4')
        viewer = await loginAs('user5')

        await deleteAllPostsForUser(author.session, author.user.id)
        await clearRelationship(author.session, author.user.id, viewer.session, viewer.user.id)
        await clearRelationship(commenter.session, commenter.user.id, viewer.session, viewer.user.id)
        await clearBlocks()

        if ( ! enabled ) {
            return
        }

        post = await createPost(author.session, author.user.id, { visibility: 'public' })
        comment = await addComment(commenter.session, post.id, 'A comment people like.')
        like = await addCommentReaction(liker.session, post.id, comment.id)
        otherLike = await addCommentReaction(otherLiker.session, post.id, comment.id)
    })

    afterEach(async function() {
        await clearBlocks()
    })

    after(async function() {
        await deleteAllPostsForUser(author.session, author.user.id)

        await logout(author.session)
        await logout(commenter.session)
        await logout(liker.session)
        await logout(otherLiker.session)
        await logout(viewer.session)
    })

    // Both endpoints that send PostComments should send their reactions.
    // GET /post/:id sends the comments as relations, while
    // GET /post/:postId/comments sends them as its results.
    const endpoints = [
        {
            name: 'GET /post/:id',
            get: (session) => getPost(session, post.id),
            getComment: (content) => content.relations?.postComments?.[comment.id]
        },
        {
            name: 'GET /post/:postId/comments',
            get: (session) => getPostComments(session, post.id),
            getComment: (content) => content.dictionary?.[comment.id]
        }
    ]

    for ( const endpoint of endpoints ) {
        describe(endpoint.name, function() {

            it(`Should send the comment's reactions as relations`, async function(t) {
                if ( ! enabled ) { t.skip(`${COMMENT_REACTIONS_FEATURE} feature is not enabled`); return }

                const response = await endpoint.get(viewer.session)

                assert.equal(response.status, 200)

                assert.deepEqual(endpoint.getComment(response.content)?.reactions, [ like.id, otherLike.id ])

                const relations = response.content.relations
                assert.deepEqual(Object.keys(relations.commentReactions ?? {}).sort(), [ like.id, otherLike.id ].sort())
                assert.deepEqual(relations.commentReactions[like.id], like)
            })

            it(`Should not send reactions from users who have blocked the viewer`, async function(t) {
                if ( ! enabled ) { t.skip(`${COMMENT_REACTIONS_FEATURE} feature is not enabled`); return }

                await blockUser(liker.session, liker.user.id, viewer.user.id)

                const response = await endpoint.get(viewer.session)

                assert.equal(response.status, 200)
                assert.deepEqual(Object.keys(response.content.relations.commentReactions ?? {}), [ otherLike.id ])
            })

            it(`Should not send reactions from users the viewer has blocked`, async function(t) {
                if ( ! enabled ) { t.skip(`${COMMENT_REACTIONS_FEATURE} feature is not enabled`); return }

                await blockUser(viewer.session, viewer.user.id, otherLiker.user.id)

                const response = await endpoint.get(viewer.session)

                assert.equal(response.status, 200)
                assert.deepEqual(Object.keys(response.content.relations.commentReactions ?? {}), [ like.id ])
            })

            it(`Should still send reactions to users who aren't part of the block`, async function(t) {
                if ( ! enabled ) { t.skip(`${COMMENT_REACTIONS_FEATURE} feature is not enabled`); return }

                await blockUser(liker.session, liker.user.id, viewer.user.id)

                const response = await endpoint.get(author.session)

                assert.equal(response.status, 200)
                assert.deepEqual(Object.keys(response.content.relations.commentReactions ?? {}).sort(), [ like.id, otherLike.id ].sort())
            })
        })
    }
})
