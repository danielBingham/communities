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

// Create a group owned by the currently authenticated user and return the
// created entity.  The creator is automatically made an 'admin' member.
//
// `overrides` may set any group field.  By default this creates an 'open'
// group that anyone may post to, with a unique slug/title so that concurrent
// or repeated runs don't collide.
const createGroup = async function(session, overrides = {}) {
    const unique = crypto.randomUUID()

    const submission = {
        type: 'open',
        postPermissions: 'anyone',
        title: `Test Group ${unique}`,
        slug: `test-group-${unique}`,
        about: 'A group created by the integration test suite.',
        ...overrides
    }

    const response = await fetchEndpoint('POST', '/groups', { session: session, body: submission })
    if ( ! response.ok ) {
        throw new Error(`Failed to create group: ${response.status} ${JSON.stringify(response.content)}`)
    }

    return response.content.entity
}

// Create a subgroup (child group) beneath `parentId`, owned by the currently
// authenticated user, and return the created entity.
//
// The creator must be an admin of the parent group -- the parent's creator is,
// by default, so the same session that created the parent may create its
// children.  As with createGroup(), the creator is automatically made an
// 'admin' member of the new subgroup.
//
// A subgroup's `type` is bounded by its parent: an "open" subgroup of a private
// parent is a 'private-open' group; an "open" subgroup of a hidden parent is a
// 'hidden-open' group; a "private" subgroup of a hidden parent is a
// 'hidden-private' group.  Pass the resulting compound `type` here directly.
// `overrides` may set any other group field.  This is a thin convenience
// wrapper around createGroup() that just fixes `parentId` and `type` and
// defaults postPermissions to 'members'.
const createSubgroup = async function(session, parentId, type, overrides = {}) {
    return await createGroup(session, {
        type: type,
        postPermissions: type === 'open' ? 'anyone' : 'members',
        parentId: parentId,
        ...overrides
    })
}

// Delete a group by id.  The creator (admin) must be the one deleting it.
// Deleting a group cascades to its posts and members in the database, so this
// is sufficient to tear down everything created for a group post test.
const deleteGroup = async function(session, groupId) {
    const response = await fetchEndpoint('DELETE', `/group/${encodeURIComponent(groupId)}`, { session: session })
    if ( ! response.ok ) {
        throw new Error(`Failed to delete Group(${groupId}): ${response.status}`)
    }
    return response.content
}

// Add a member to an open group by having them join it directly.  `session`
// must belong to the joining user.  Only valid for 'open' groups, where a
// non-member may add themselves with status 'member'.
const joinOpenGroup = async function(session, groupId, userId) {
    const member = {
        userId: userId,
        groupId: groupId,
        status: 'member',
        role: 'member'
    }

    const response = await fetchEndpoint('POST', `/group/${encodeURIComponent(groupId)}/members`, { session: session, body: member })
    if ( ! response.ok ) {
        throw new Error(`Failed to join Group(${groupId}): ${response.status} ${JSON.stringify(response.content)}`)
    }

    return response.content
}

// Invite a user to a group.  `adminSession` must belong to a group admin or
// moderator.  Produces a 'pending-invited' membership.
const inviteToGroup = async function(adminSession, groupId, userId) {
    const member = {
        userId: userId,
        groupId: groupId,
        status: 'pending-invited',
        role: 'member'
    }

    const response = await fetchEndpoint('POST', `/group/${encodeURIComponent(groupId)}/members`, { session: adminSession, body: member })
    if ( ! response.ok ) {
        throw new Error(`Failed to invite User(${userId}) to Group(${groupId}): ${response.status} ${JSON.stringify(response.content)}`)
    }

    return response.content
}

// Accept a pending invitation.  `memberSession` must belong to the invited
// user.  Transitions their membership from 'pending-invited' to 'member'.
const acceptGroupInvite = async function(memberSession, groupId, userId) {
    const member = {
        userId: userId,
        groupId: groupId,
        status: 'member'
    }

    const response = await fetchEndpoint('PATCH', `/group/${encodeURIComponent(groupId)}/member/${encodeURIComponent(userId)}`, { session: memberSession, body: member })
    if ( ! response.ok ) {
        throw new Error(`Failed to accept invite to Group(${groupId}) for User(${userId}): ${response.status} ${JSON.stringify(response.content)}`)
    }

    return response.content
}

// Make a user a confirmed member of any group type via the invite + accept
// flow.  `adminSession` invites; `memberSession` (the invited user's session)
// accepts.  Works for open, private, and hidden groups.
const addConfirmedMember = async function(adminSession, memberSession, groupId, userId) {
    await inviteToGroup(adminSession, groupId, userId)
    return await acceptGroupInvite(memberSession, groupId, userId)
}

// Set the status of an existing member (e.g. to 'banned').  `adminSession`
// must belong to a group admin or moderator.
const setGroupMemberStatus = async function(adminSession, groupId, userId, status) {
    const member = {
        userId: userId,
        groupId: groupId,
        status: status
    }

    const response = await fetchEndpoint('PATCH', `/group/${encodeURIComponent(groupId)}/member/${encodeURIComponent(userId)}`, { session: adminSession, body: member })
    if ( ! response.ok ) {
        throw new Error(`Failed to set status '${status}' for User(${userId}) in Group(${groupId}): ${response.status} ${JSON.stringify(response.content)}`)
    }

    return response.content
}

// Set the role of an existing, confirmed member (e.g. promote a 'member' to
// 'admin' or 'moderator').  `adminSession` must belong to a group admin.  This
// is how a second group admin is created for tests -- for example, promoting a
// user to admin of a *parent* group so they inherit admin/moderator rights over
// its subgroups.
const setGroupMemberRole = async function(adminSession, groupId, userId, role) {
    const member = {
        userId: userId,
        groupId: groupId,
        role: role
    }

    const response = await fetchEndpoint('PATCH', `/group/${encodeURIComponent(groupId)}/member/${encodeURIComponent(userId)}`, { session: adminSession, body: member })
    if ( ! response.ok ) {
        throw new Error(`Failed to set role '${role}' for User(${userId}) in Group(${groupId}): ${response.status} ${JSON.stringify(response.content)}`)
    }

    return response.content
}

// Remove a member from a group.  `adminSession` must belong to a group admin
// or moderator (or the member themselves).  Used to tear down transient
// memberships set up for a single test case (e.g. a member who is banned for a
// ban test) without disturbing the shared state of the surrounding describe.
const removeGroupMember = async function(adminSession, groupId, userId) {
    const response = await fetchEndpoint('DELETE', `/group/${encodeURIComponent(groupId)}/member/${encodeURIComponent(userId)}`, { session: adminSession })
    if ( ! response.ok ) {
        throw new Error(`Failed to remove User(${userId}) from Group(${groupId}): ${response.status} ${JSON.stringify(response.content)}`)
    }

    return response.content
}

module.exports = {
    createGroup: createGroup,
    createSubgroup: createSubgroup,
    deleteGroup: deleteGroup,
    joinOpenGroup: joinOpenGroup,
    inviteToGroup: inviteToGroup,
    acceptGroupInvite: acceptGroupInvite,
    addConfirmedMember: addConfirmedMember,
    setGroupMemberStatus: setGroupMemberStatus,
    setGroupMemberRole: setGroupMemberRole,
    removeGroupMember: removeGroupMember
}
