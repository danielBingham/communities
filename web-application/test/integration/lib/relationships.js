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

// Send a friend request from the authenticated user (`requesterId`) to
// `targetId`.  Leaves the relationship in the 'pending' state.
const sendFriendRequest = async function(requesterSession, requesterId, targetId) {
    const body = { relationId: targetId, status: 'pending' }

    const response = await fetchEndpoint('POST', `/user/${encodeURIComponent(requesterId)}/relationships`, { session: requesterSession, body: body })
    if ( ! response.ok ) {
        throw new Error(`Failed to send friend request from User(${requesterId}) to User(${targetId}): ${response.status} ${JSON.stringify(response.content)}`)
    }

    return response.content
}

// Accept a pending friend request.  `accepterSession` belongs to the user who
// received the request.  Posting the reciprocal relationship confirms it.
const acceptFriendRequest = async function(accepterSession, accepterId, requesterId) {
    const body = { relationId: requesterId, status: 'confirmed' }

    const response = await fetchEndpoint('POST', `/user/${encodeURIComponent(accepterId)}/relationships`, { session: accepterSession, body: body })
    if ( ! response.ok ) {
        throw new Error(`Failed to accept friend request for User(${accepterId}) from User(${requesterId}): ${response.status} ${JSON.stringify(response.content)}`)
    }

    return response.content
}

// Establish a confirmed friendship between two users.  Requires a session for
// each: the first sends the request, the second accepts it.
const makeFriends = async function(sessionA, userIdA, sessionB, userIdB) {
    await sendFriendRequest(sessionA, userIdA, userIdB)
    return await acceptFriendRequest(sessionB, userIdB, userIdA)
}

// Block `targetId` on behalf of the authenticated user (`blockerId`).
const blockUser = async function(blockerSession, blockerId, targetId) {
    const body = { relationId: targetId, status: 'blocked' }

    const response = await fetchEndpoint('POST', `/user/${encodeURIComponent(blockerId)}/relationships`, { session: blockerSession, body: body })
    if ( ! response.ok ) {
        throw new Error(`Failed to block User(${targetId}) as User(${blockerId}): ${response.status} ${JSON.stringify(response.content)}`)
    }

    return response.content
}

// Delete any relationship (in either direction) between two users.  Safe to
// call in teardown even if a test failed partway; missing relationships are
// ignored.
const deleteRelationship = async function(session, userId, relationId) {
    const response = await fetchEndpoint('DELETE', `/user/${encodeURIComponent(userId)}/relationship/${encodeURIComponent(relationId)}`, { session: session })
    // A 404 just means there was nothing to delete -- fine for teardown.
    if ( ! response.ok && response.status !== 404 ) {
        throw new Error(`Failed to delete relationship between User(${userId}) and User(${relationId}): ${response.status}`)
    }
    return response.content
}

// Fetch a single relationship and return the raw response (without throwing on
// non-2xx) so callers can assert on the status.  This is the endpoint under
// test in the getUserRelationship suite.
//
// NOTE: the lookup behind this route is symmetric -- it matches
// (user_id, friend_id) in EITHER order -- so `userId` and `relationId` are
// interchangeable in the path.  Tests exercise both orderings deliberately.
const getUserRelationship = async function(session, userId, relationId) {
    return await fetchEndpoint('GET', `/user/${encodeURIComponent(userId)}/relationship/${encodeURIComponent(relationId)}`, { session: session })
}

// Teardown helper: guarantee that no relationship of any kind exists between
// two users, whichever of them created it.
//
// `deleteRelationship` above is only safe when the caller is allowed to delete
// the relationship.  A *block* may only be deleted by the blocker, so a
// teardown that always deletes from one fixed side will 403 when the other side
// did the blocking.  This attempts the delete from both sides and swallows the
// expected teardown statuses (404 nothing-to-delete, 403 not-mine-to-delete),
// which makes it safe to call in a `before` to normalize leftover state from an
// earlier suite as well as in an `after`.
const clearRelationship = async function(sessionA, userIdA, sessionB, userIdB) {
    const sides = [
        { session: sessionA, userId: userIdA, relationId: userIdB },
        { session: sessionB, userId: userIdB, relationId: userIdA }
    ]

    for ( const side of sides ) {
        const response = await fetchEndpoint('DELETE', `/user/${encodeURIComponent(side.userId)}/relationship/${encodeURIComponent(side.relationId)}`, { session: side.session })
        if ( ! response.ok && response.status !== 404 && response.status !== 403 ) {
            throw new Error(`Failed to clear relationship between User(${side.userId}) and User(${side.relationId}): ${response.status} ${JSON.stringify(response.content)}`)
        }
    }
}

module.exports = {
    sendFriendRequest: sendFriendRequest,
    acceptFriendRequest: acceptFriendRequest,
    makeFriends: makeFriends,
    blockUser: blockUser,
    deleteRelationship: deleteRelationship,
    getUserRelationship: getUserRelationship,
    clearRelationship: clearRelationship
}
