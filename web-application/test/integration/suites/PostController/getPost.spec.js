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
const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

const { initialize, logout, loginAs } = require('../../lib/authentication')
const { fetchEndpoint } = require('../../lib/fetchEndpoint')
const { getPost, createPost, createGroupPost, deleteAllPostsForUser } = require('../../lib/posts')
const {
    createGroup,
    deleteGroup,
    joinOpenGroup,
    addConfirmedMember,
    setGroupMemberStatus
} = require('../../lib/groups')
const { makeFriends, sendFriendRequest, blockUser, deleteRelationship } = require('../../lib/relationships')

describe('GET /post/:id', function() {

    // ======================================================================
    // Basics: authentication, existence, and owner access.
    // ======================================================================

    it(`Should return the requested post`, async function() {
        const { user, session } = await loginAs('user1')
        try {
            // Clear out User1's posts before running out test.
            await deleteAllPostsForUser(session, user.id)

            // Create the post we're going to test.
            const postSubmission = {
                type: 'feed',
                visibility: 'private',
                userId: user.id,
                files: [],
                linkPreviewId: null,
                sharedPostId: null,
                content: 'This is a test post.'
            }
            const createResponse = await fetchEndpoint('POST', '/posts', { session: session, body: postSubmission })

            if ( ! createResponse.ok ) {
                assert.fail('Failed to create post under test.')
            }

            const createdPost = createResponse.content.entity
            assert.equal(postSubmission.type, createdPost.type)
            assert.equal(postSubmission.visibility, createdPost.visibility)
            assert.equal(postSubmission.userId, createdPost.userId)
            assert.deepEqual(postSubmission.files, createdPost.files)
            assert.equal(postSubmission.linkPreviewId, createdPost.linkPreviewId)
            assert.equal(postSubmission.sharedPostId, createdPost.sharedPostId)
            assert.equal(postSubmission.content, createdPost.content)

            const response = await fetchEndpoint('GET', `/post/${encodeURIComponent(createResponse.content.entity.id)}`, { session: session })

            if ( ! response.ok ) {
                assert.fail('Failed to retreive the post under test.')
            }

            const post = response.content.entity

            assert.equal(createdPost.id, post.id)
            assert.equal(postSubmission.type, post.type)
            assert.equal(postSubmission.visibility, post.visibility)
            assert.equal(postSubmission.userId, post.userId)
            assert.deepEqual(postSubmission.files, post.files)
            assert.equal(postSubmission.linkPreviewId, post.linkPreviewId)
            assert.equal(postSubmission.sharedPostId, post.sharedPostId)
            assert.equal(postSubmission.content, post.content)
        } finally {
            // Clear test state.
            await deleteAllPostsForUser(session, user.id)
            await logout(session)
        }
    })

    it(`Should let a user view their own public post`, async function() {
        const { session, user } = await loginAs('user1')
        try {
            await deleteAllPostsForUser(session, user.id)

            const created = await createPost(session, user.id, { visibility: 'public', content: 'My own public post.' })

            const response = await getPost(session, created.id)

            assert.equal(response.status, 200)
            assert.equal(response.content?.entity?.id, created.id)
            assert.equal(response.content?.entity?.visibility, 'public')
            assert.equal(response.content?.entity?.content, 'My own public post.')
        } finally {
            await deleteAllPostsForUser(session, user.id)
            await logout(session)
        }
    })

    it(`Should reject an unauthenticated request`, async function() {
        // The authentication check happens before the post is even looked up,
        // so any id (even one that doesn't exist) exercises this path.
        const session = await initialize()

        const response = await getPost(session, crypto.randomUUID())

        assert.equal(response.status, 401)
        assert.equal(response.content?.error?.type, 'not-authenticated')
    })

    it(`Should return 404 for a post that doesn't exist`, async function() {
        const { session, user } = await loginAs('user1')
        try {
            const response = await getPost(session, crypto.randomUUID())

            assert.equal(response.status, 404)
            assert.equal(response.content?.error?.type, 'not-found')
        } finally {
            await logout(session)
        }
    })

    // ======================================================================
    // Feed posts: visibility x relationship matrix.
    //
    // user1 owns the post; user2 is the viewer.  Each test sets up exactly the
    // relationship it needs and removes it again afterward.
    // ======================================================================

    it(`Should let anyone view another user's public post`, async function() {
        const owner = await loginAs('user1')
        const viewer = await loginAs('user2')
        try {
            await deleteAllPostsForUser(owner.session, owner.user.id)
            await deleteRelationship(owner.session, owner.user.id, viewer.user.id)

            const created = await createPost(owner.session, owner.user.id, { visibility: 'public' })

            const response = await getPost(viewer.session, created.id)

            assert.equal(response.status, 200)
            assert.equal(response.content?.entity?.id, created.id)
            assert.deepEqual(response.content.entity, created)
        } finally {
            await deleteRelationship(owner.session, owner.user.id, viewer.user.id)
            await deleteAllPostsForUser(owner.session, owner.user.id)
            await logout(owner.session)
            await logout(viewer.session)
        }
    })

    it(`Should NOT let a stranger view another user's private post`, async function() {
        const owner = await loginAs('user1')
        const viewer = await loginAs('user2')
        try {
            await deleteAllPostsForUser(owner.session, owner.user.id)
            await deleteRelationship(owner.session, owner.user.id, viewer.user.id)

            const created = await createPost(owner.session, owner.user.id, { visibility: 'private' })

            const response = await getPost(viewer.session, created.id)

            // Denied views are reported as 404 so we don't leak the post's
            // existence.
            assert.equal(response.status, 404)
            assert.equal(response.content?.error?.type, 'not-found')
        } finally {
            await deleteRelationship(owner.session, owner.user.id, viewer.user.id)
            await deleteAllPostsForUser(owner.session, owner.user.id)
            await logout(owner.session)
            await logout(viewer.session)
        }
    })

    it(`Should let a confirmed friend view a private post`, async function() {
        const owner = await loginAs('user1')
        const viewer = await loginAs('user2')
        try {
            await deleteAllPostsForUser(owner.session, owner.user.id)
            await deleteRelationship(owner.session, owner.user.id, viewer.user.id)

            const created = await createPost(owner.session, owner.user.id, { visibility: 'private' })
            await makeFriends(owner.session, owner.user.id, viewer.session, viewer.user.id)

            const response = await getPost(viewer.session, created.id)

            assert.equal(response.status, 200)
            assert.equal(response.content?.entity?.id, created.id)
            assert.deepEqual(response.content.entity, created)
        } finally {
            await deleteRelationship(owner.session, owner.user.id, viewer.user.id)
            await deleteAllPostsForUser(owner.session, owner.user.id)
            await logout(owner.session)
            await logout(viewer.session)
        }
    })

    it(`Should let a confirmed friend view a public post`, async function() {
        const owner = await loginAs('user1')
        const viewer = await loginAs('user2')
        try {
            await deleteAllPostsForUser(owner.session, owner.user.id)
            await deleteRelationship(owner.session, owner.user.id, viewer.user.id)

            const created = await createPost(owner.session, owner.user.id, { visibility: 'public' })
            await makeFriends(owner.session, owner.user.id, viewer.session, viewer.user.id)

            const response = await getPost(viewer.session, created.id)

            assert.equal(response.status, 200)
            assert.equal(response.content?.entity?.id, created.id)
            assert.deepEqual(response.content.entity, created)
        } finally {
            await deleteRelationship(owner.session, owner.user.id, viewer.user.id)
            await deleteAllPostsForUser(owner.session, owner.user.id)
            await logout(owner.session)
            await logout(viewer.session)
        }
    })

    it(`Should NOT let a user with a pending friend request view a private post`, async function() {
        const owner = await loginAs('user1')
        const viewer = await loginAs('user2')
        try {
            await deleteAllPostsForUser(owner.session, owner.user.id)
            await deleteRelationship(owner.session, owner.user.id, viewer.user.id)

            const created = await createPost(owner.session, owner.user.id, { visibility: 'private' })
            // A request that has been sent but not yet accepted is not a
            // confirmed friendship.
            await sendFriendRequest(owner.session, owner.user.id, viewer.user.id)

            const response = await getPost(viewer.session, created.id)

            assert.equal(response.status, 404)
            assert.equal(response.content?.error?.type, 'not-found')
        } finally {
            await deleteRelationship(owner.session, owner.user.id, viewer.user.id)
            await deleteAllPostsForUser(owner.session, owner.user.id)
            await logout(owner.session)
            await logout(viewer.session)
        }
    })

    it(`Should NOT let a blocked user view a private post`, async function() {
        const owner = await loginAs('user1')
        const viewer = await loginAs('user2')
        try {
            await deleteAllPostsForUser(owner.session, owner.user.id)
            await deleteRelationship(owner.session, owner.user.id, viewer.user.id)

            const created = await createPost(owner.session, owner.user.id, { visibility: 'private' })
            await blockUser(owner.session, owner.user.id, viewer.user.id)

            const response = await getPost(viewer.session, created.id)

            assert.equal(response.status, 404)
            assert.equal(response.content?.error?.type, 'not-found')
        } finally {
            await deleteRelationship(owner.session, owner.user.id, viewer.user.id)
            await deleteAllPostsForUser(owner.session, owner.user.id)
            await logout(owner.session)
            await logout(viewer.session)
        }
    })

    it(`Should NOT let a blocked user view even a PUBLIC post`, async function() {
        // A block overrides public visibility -- the blocked user cannot see
        // the post at all.
        const owner = await loginAs('user1')
        const viewer = await loginAs('user2')
        try {
            await deleteAllPostsForUser(owner.session, owner.user.id)
            await deleteRelationship(owner.session, owner.user.id, viewer.user.id)

            const created = await createPost(owner.session, owner.user.id, { visibility: 'public' })
            await blockUser(owner.session, owner.user.id, viewer.user.id)

            const response = await getPost(viewer.session, created.id)

            assert.equal(response.status, 404)
            assert.equal(response.content?.error?.type, 'not-found')
        } finally {
            await deleteRelationship(owner.session, owner.user.id, viewer.user.id)
            await deleteAllPostsForUser(owner.session, owner.user.id)
            await logout(owner.session)
            await logout(viewer.session)
        }
    })

    // ======================================================================
    // Site moderators can view any post.
    // ======================================================================

    it(`Should let a site moderator view another user's private post`, async function() {
        const owner = await loginAs('user1')
        const moderator = await loginAs('user-site-moderator')
        try {
            await deleteAllPostsForUser(owner.session, owner.user.id)
            await deleteRelationship(owner.session, owner.user.id, moderator.user.id)

            const created = await createPost(owner.session, owner.user.id, { visibility: 'private' })

            const response = await getPost(moderator.session, created.id)

            assert.equal(response.status, 200)
            assert.equal(response.content?.entity?.id, created.id)
        } finally {
            await deleteRelationship(owner.session, owner.user.id, moderator.user.id)
            await deleteAllPostsForUser(owner.session, owner.user.id)
            await logout(owner.session)
            await logout(moderator.session)
        }
    })

    // ======================================================================
    // Group posts: group permissions override post permissions entirely.
    // ======================================================================

    it(`Should let the author view their own group post`, async function() {
        const owner = await loginAs('user1')
        let group = null
        try {
            group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
            const created = await createGroupPost(owner.session, owner.user.id, group.id, 'open')

            const response = await getPost(owner.session, created.id)

            assert.equal(response.status, 200)
            assert.equal(response.content?.entity?.id, created.id)
            assert.equal(response.content?.entity?.groupId, group.id)
        } finally {
            if ( group ) await deleteGroup(owner.session, group.id)
            await logout(owner.session)
        }
    })

    it(`Should let anyone view a post in an OPEN group`, async function() {
        const owner = await loginAs('user1')
        const viewer = await loginAs('user2')
        let group = null
        try {
            group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
            const created = await createGroupPost(owner.session, owner.user.id, group.id, 'open')

            // viewer is NOT a member -- open group content is visible to all.
            const response = await getPost(viewer.session, created.id)

            assert.equal(response.status, 200)
            assert.equal(response.content?.entity?.id, created.id)
        } finally {
            if ( group ) await deleteGroup(owner.session, group.id)
            await logout(owner.session)
            await logout(viewer.session)
        }
    })

    it(`Should NOT let a banned member view an open group post`, async function() {
        const owner = await loginAs('user1')
        const viewer = await loginAs('user2')
        let group = null
        try {
            group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
            const created = await createGroupPost(owner.session, owner.user.id, group.id, 'open')

            // viewer joins, then gets banned by the admin.
            await joinOpenGroup(viewer.session, group.id, viewer.user.id)
            await setGroupMemberStatus(owner.session, group.id, viewer.user.id, 'banned')

            const response = await getPost(viewer.session, created.id)

            assert.equal(response.status, 404)
            assert.equal(response.content?.error?.type, 'not-found')
        } finally {
            if ( group ) await deleteGroup(owner.session, group.id)
            await logout(owner.session)
            await logout(viewer.session)
        }
    })

    it(`Should NOT let a non-member view a post in a PRIVATE group`, async function() {
        const owner = await loginAs('user1')
        const viewer = await loginAs('user2')
        let group = null
        try {
            group = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })
            const created = await createGroupPost(owner.session, owner.user.id, group.id, 'private')

            const response = await getPost(viewer.session, created.id)

            assert.equal(response.status, 404)
            assert.equal(response.content?.error?.type, 'not-found')
        } finally {
            if ( group ) await deleteGroup(owner.session, group.id)
            await logout(owner.session)
            await logout(viewer.session)
        }
    })

    it(`Should let a confirmed member view a post in a PRIVATE group`, async function() {
        const owner = await loginAs('user1')
        const viewer = await loginAs('user2')
        let group = null
        try {
            group = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })
            const created = await createGroupPost(owner.session, owner.user.id, group.id, 'private')

            // Invite the viewer and have them accept, making them a member.
            await addConfirmedMember(owner.session, viewer.session, group.id, viewer.user.id)

            const response = await getPost(viewer.session, created.id)

            assert.equal(response.status, 200)
            assert.equal(response.content?.entity?.id, created.id)
        } finally {
            if ( group ) await deleteGroup(owner.session, group.id)
            await logout(owner.session)
            await logout(viewer.session)
        }
    })

    it(`Should NOT let a non-member view a post in a HIDDEN group`, async function() {
        const owner = await loginAs('user1')
        const viewer = await loginAs('user2')
        let group = null
        try {
            group = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })
            const created = await createGroupPost(owner.session, owner.user.id, group.id, 'hidden')

            const response = await getPost(viewer.session, created.id)

            assert.equal(response.status, 404)
            assert.equal(response.content?.error?.type, 'not-found')
        } finally {
            if ( group ) await deleteGroup(owner.session, group.id)
            await logout(owner.session)
            await logout(viewer.session)
        }
    })

    it(`Should let a confirmed member view a post in a HIDDEN group`, async function() {
        const owner = await loginAs('user1')
        const viewer = await loginAs('user2')
        let group = null
        try {
            group = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })
            const created = await createGroupPost(owner.session, owner.user.id, group.id, 'hidden')

            await addConfirmedMember(owner.session, viewer.session, group.id, viewer.user.id)

            const response = await getPost(viewer.session, created.id)

            assert.equal(response.status, 200)
            assert.equal(response.content?.entity?.id, created.id)
        } finally {
            if ( group ) await deleteGroup(owner.session, group.id)
            await logout(owner.session)
            await logout(viewer.session)
        }
    })

    it(`Should let a site moderator view a private group post they are not a member of`, async function() {
        const owner = await loginAs('user1')
        const moderator = await loginAs('user-site-moderator')
        let group = null
        try {
            group = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })
            const created = await createGroupPost(owner.session, owner.user.id, group.id, 'private')

            const response = await getPost(moderator.session, created.id)

            assert.equal(response.status, 200)
            assert.equal(response.content?.entity?.id, created.id)
        } finally {
            if ( group ) await deleteGroup(owner.session, group.id)
            await logout(owner.session)
            await logout(moderator.session)
        }
    })

})
