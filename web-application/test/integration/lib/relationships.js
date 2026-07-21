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

module.exports = {
    sendFriendRequest: sendFriendRequest,
    acceptFriendRequest: acceptFriendRequest,
    makeFriends: makeFriends,
    blockUser: blockUser,
    deleteRelationship: deleteRelationship
}
