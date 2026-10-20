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

const { fetchEndpoint } = require('./fetchEndpoint')

// CommentReactions are gated behind this server feature flag.  The suites
// that use these helpers skip themselves when it isn't enabled.
const COMMENT_REACTIONS_FEATURE = 'feat-585-comment-reactions'

// POST a reaction to a comment and return the raw response (without throwing
// on non-2xx) so callers can assert on the status.
const postCommentReaction = async function(session, postId, commentId, body) {
    return await fetchEndpoint('POST', `/post/${encodeURIComponent(postId)}/comment/${encodeURIComponent(commentId)}/reactions`, { session: session, body: body })
}

// DELETE the current user's reaction to a comment and return the raw response
// (without throwing on non-2xx) so callers can assert on the status.
const deleteCommentReaction = async function(session, postId, commentId) {
    return await fetchEndpoint('DELETE', `/post/${encodeURIComponent(postId)}/comment/${encodeURIComponent(commentId)}/reaction`, { session: session })
}

// React to a comment as the authenticated user and return the created
// CommentReaction.  For setting up tests, so it throws on failure.
const addCommentReaction = async function(session, postId, commentId, reaction = 'like') {
    const response = await postCommentReaction(session, postId, commentId, { reaction: reaction })
    if ( ! response.ok ) {
        throw new Error(`Failed to react to Comment(${commentId}) on Post(${postId}): ${response.status} ${JSON.stringify(response.content)}`)
    }
    return response.content.entity
}

module.exports = {
    COMMENT_REACTIONS_FEATURE: COMMENT_REACTIONS_FEATURE,
    postCommentReaction: postCommentReaction,
    deleteCommentReaction: deleteCommentReaction,
    addCommentReaction: addCommentReaction
}
