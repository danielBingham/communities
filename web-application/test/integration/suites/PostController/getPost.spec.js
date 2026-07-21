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
const { describe, it, before } = require('node:test')
const assert = require('node:assert/strict')

const { initialize, logout, loginAs } = require('../../lib/authentication')
const { fetchEndpoint } = require('../../lib/fetchEndpoint')
const { getPost, createPost, createGroupPost, deleteAllPostsForUser } = require('../../lib/posts')
const {
    createGroup,
    createSubgroup,
    deleteGroup,
    joinOpenGroup,
    addConfirmedMember,
    setGroupMemberStatus,
    setGroupMemberRole
} = require('../../lib/groups')
const { makeFriends, sendFriendRequest, blockUser, deleteRelationship } = require('../../lib/relationships')
const { isFeatureEnabled } = require('../../lib/system')

// Subgroups (child groups) and their compound types ('private-open',
// 'hidden-open', 'hidden-private') are gated behind this server feature flag.
// When it is off the compound types and the `parentId` column do not exist, so
// the subgroup tests below skip themselves rather than failing spuriously.
const SUBGROUPS_FEATURE = 'issue-165-subgroups'

describe('GET /post/:id', function() {

    // Detected once, up front: are subgroups available on the target server?
    // The subgroup tests further down consult this and skip themselves when the
    // feature is disabled.
    let subgroupsEnabled = false

    before(async function() {
        subgroupsEnabled = await isFeatureEnabled(SUBGROUPS_FEATURE)
    })

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

    describe("for posts to a user's feed", function() {
        // ======================================================================
        // Feed posts: visibility x relationship matrix.
        //
        // user1 owns the post; user2 is the viewer.  Each test sets up exactly the
        // relationship it needs and removes it again afterward.
        // ======================================================================

        describe("for PUBLIC posts", function() {
            it(`Should let anyone view another user's PUBLIC post`, async function() {
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

            it(`Should let a confirmed friend view a PUBLIC post`, async function() {
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
        })

        describe("for PRIVATE posts", function() {
            it(`Should NOT let a stranger view another user's PRIVATE post`, async function() {
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

            it(`Should let a confirmed friend view a PRIVATE post`, async function() {
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

            it(`Should NOT let a user with a pending friend request view a PRIVATE post`, async function() {
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

            it(`Should NOT let a blocked user view a PRIVATE post`, async function() {
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

            // Site moderators can view any post.
            it(`Should let a site moderator view another user's PRIVATE post`, async function() {
                const owner = await loginAs('user1')
                const moderator = await loginAs('user-site-moderator')
                try {
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await deleteRelationship(owner.session, owner.user.id, moderator.user.id)

                    const created = await createPost(owner.session, owner.user.id, { visibility: 'private' })

                    const response = await getPost(moderator.session, created.id)

                    assert.equal(response.status, 200)
                    assert.equal(response.content?.entity?.id, created.id)
                    assert.deepEqual(response.content?.entity, created)
                } finally {
                    await deleteRelationship(owner.session, owner.user.id, moderator.user.id)
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await logout(owner.session)
                    await logout(moderator.session)
                }
            })
        })
    })

    describe("for posts to a group", function() {
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

        describe("for Open groups", function() {
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
        })

        describe("for Private groups", function() {
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

            it(`Should NOT let a banned member view a post in a PRIVATE group`, async function() {
                const owner = await loginAs('user1')
                const viewer = await loginAs('user2')
                let group = null
                try {
                    group = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })
                    const created = await createGroupPost(owner.session, owner.user.id, group.id, 'private')

                    // The viewer becomes a confirmed member and is then banned.
                    await addConfirmedMember(owner.session, viewer.session, group.id, viewer.user.id)
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

            it(`Should let a site moderator view a PRIVATE group post they are not a member of`, async function() {
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

        describe("for Hidden groups", function() {
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

            it(`Should NOT let a banned member view a post in a HIDDEN group`, async function() {
                const owner = await loginAs('user1')
                const viewer = await loginAs('user2')
                let group = null
                try {
                    group = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })
                    const created = await createGroupPost(owner.session, owner.user.id, group.id, 'hidden')

                    await addConfirmedMember(owner.session, viewer.session, group.id, viewer.user.id)
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

            it(`Should let a site moderator view a HIDDEN group post they are not a member of`, async function() {
                const owner = await loginAs('user1')
                const moderator = await loginAs('user-site-moderator')
                let group = null
                try {
                    group = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })
                    const created = await createGroupPost(owner.session, owner.user.id, group.id, 'hidden')

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

        describe("For Subgroups", function() {
            // ======================================================================
            // Subgroups (child groups): post view permissions.
            //
            // A subgroup is a group with a `parentId`.  Subgroups are ordinary groups
            // in every respect, EXCEPT that they are bounded by their parent and parent
            // admins inherit rights over them.  For viewing a subgroup's *posts*
            // (canViewGroupPost / the GET /posts visibility filter):
            //
            //   - 'private-open' / 'hidden-open':  behave like an OPEN group to members
            //     of the PARENT group -- a (non-banned) parent member may view, as may a
            //     confirmed member of the subgroup itself.
            //   - 'hidden-private':               behaves like a PRIVATE group even to
            //     parent members -- ONLY confirmed members of the subgroup itself may
            //     view.  Parent membership alone is NOT sufficient.
            //
            // Across all subgroup types: banned subgroup members are denied; a parent
            // group ADMIN inherits moderator rights over the subgroup and may therefore
            // view any of its posts (even a 'hidden-private' one) without joining it;
            // and site moderators may always view.  Denied views return 404.
            //
            // Fixture roles (all reused; no new fixtures required):
            //   - user1                -- owner: creates the parent, the subgroup, and
            //                             the post.  Admin of both groups.
            //   - user2                -- the viewer under test (parent member, subgroup
            //                             member, or -- once promoted -- parent admin).
            //   - user4                -- a stranger: member of neither group.
            //   - user-site-moderator  -- a site moderator (member of neither group).
            //
            // Each test builds its own parent + subgroup + post and tears them down.
            // Deleting the subgroup cascades to its members and posts; deleting the
            // parent cascades to the subgroup.  We delete the child then the parent.
            // ======================================================================

            describe("For subgroups of Public groups", function() {
                describe("For an OPEN subgroup of a PUBLIC group", function() {

                })

                describe("For a PRIVATE subgroup of a PUBLIC group", function() {

                })

                describe("For a HIDDEN subgroup of a PUBLIC group", function() {

                })
            })

            describe("For subgroups of Private groups", function() {
                // ---- 'private-open' subgroup (nested under a 'private' parent) ----
                describe("For an OPEN subgroup of a PRIVATE group (PRIVATE-OPEN)", function() {
                    it(`Should let the author view their own post in a private-open subgroup`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }

                        const owner = await loginAs('user1')
                        let parent = null
                        let child = null
                        try {
                            parent = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })
                            child = await createSubgroup(owner.session, parent.id, 'private-open')

                            const created = await createGroupPost(owner.session, owner.user.id, child.id, 'private-open')

                            const response = await getPost(owner.session, created.id)

                            assert.equal(response.status, 200)
                            assert.equal(response.content?.entity?.id, created.id)
                            assert.equal(response.content?.entity?.groupId, child.id)
                            assert.deepEqual(response.content.entity, created)
                        } finally {
                            if ( child ) await deleteGroup(owner.session, child.id)
                            if ( parent ) await deleteGroup(owner.session, parent.id)
                            await logout(owner.session)
                        }
                    })

                    it(`Should let a member of the PARENT group view a post in a private-open subgroup`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }

                        const owner = await loginAs('user1')
                        const viewer = await loginAs('user2')
                        let parent = null
                        let child = null
                        try {
                            parent = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })
                            child = await createSubgroup(owner.session, parent.id, 'private-open')

                            const created = await createGroupPost(owner.session, owner.user.id, child.id, 'private-open')

                            // The viewer is a confirmed member of the PARENT group only -- NOT
                            // of the subgroup.  For 'private-open' that parent membership is
                            // enough to view the subgroup's posts.
                            await addConfirmedMember(owner.session, viewer.session, parent.id, viewer.user.id)

                            const response = await getPost(viewer.session, created.id)

                            assert.equal(response.status, 200)
                            assert.equal(response.content?.entity?.id, created.id)
                            assert.deepEqual(response.content.entity, created)
                        } finally {
                            if ( child ) await deleteGroup(owner.session, child.id)
                            if ( parent ) await deleteGroup(owner.session, parent.id)
                            await logout(owner.session)
                            await logout(viewer.session)
                        }
                    })

                    it(`Should let a confirmed member of the subgroup view a post in a private-open subgroup`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }

                        const owner = await loginAs('user1')
                        const viewer = await loginAs('user2')
                        let parent = null
                        let child = null
                        try {
                            parent = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })
                            child = await createSubgroup(owner.session, parent.id, 'private-open')

                            const created = await createGroupPost(owner.session, owner.user.id, child.id, 'private-open')

                            await addConfirmedMember(owner.session, viewer.session, child.id, viewer.user.id)

                            const response = await getPost(viewer.session, created.id)

                            assert.equal(response.status, 200)
                            assert.equal(response.content?.entity?.id, created.id)
                            assert.deepEqual(response.content.entity, created)
                        } finally {
                            if ( child ) await deleteGroup(owner.session, child.id)
                            if ( parent ) await deleteGroup(owner.session, parent.id)
                            await logout(owner.session)
                            await logout(viewer.session)
                        }
                    })

                    it(`Should NOT let a non-member view a post in a private-open subgroup`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }

                        const owner = await loginAs('user1')
                        const viewer = await loginAs('user4')
                        let parent = null
                        let child = null
                        try {
                            parent = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })
                            child = await createSubgroup(owner.session, parent.id, 'private-open')

                            const created = await createGroupPost(owner.session, owner.user.id, child.id, 'private-open')

                            // Member of neither the parent nor the subgroup.
                            const response = await getPost(viewer.session, created.id)

                            assert.equal(response.status, 404)
                            assert.equal(response.content?.error?.type, 'not-found')
                        } finally {
                            if ( child ) await deleteGroup(owner.session, child.id)
                            if ( parent ) await deleteGroup(owner.session, parent.id)
                            await logout(owner.session)
                            await logout(viewer.session)
                        }
                    })

                    it(`Should NOT let a banned subgroup member view a private-open subgroup post even when they are a parent member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }

                        const owner = await loginAs('user1')
                        const viewer = await loginAs('user2')
                        let parent = null
                        let child = null
                        try {
                            parent = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })
                            child = await createSubgroup(owner.session, parent.id, 'private-open')

                            const created = await createGroupPost(owner.session, owner.user.id, child.id, 'private-open')

                            // The viewer is a parent member (which would normally grant view of
                            // a 'private-open' post) but is banned in the subgroup itself.  The
                            // ban wins -- they see nothing.
                            await addConfirmedMember(owner.session, viewer.session, parent.id, viewer.user.id)
                            await addConfirmedMember(owner.session, viewer.session, child.id, viewer.user.id)
                            await setGroupMemberStatus(owner.session, child.id, viewer.user.id, 'banned')

                            const response = await getPost(viewer.session, created.id)

                            assert.equal(response.status, 404)
                            assert.equal(response.content?.error?.type, 'not-found')
                        } finally {
                            if ( child ) await deleteGroup(owner.session, child.id)
                            if ( parent ) await deleteGroup(owner.session, parent.id)
                            await logout(owner.session)
                            await logout(viewer.session)
                        }
                    })

                    it(`Should let a PARENT group admin view a private-open subgroup post they have not joined`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }

                        const owner = await loginAs('user1')
                        const admin = await loginAs('user2')
                        let parent = null
                        let child = null
                        try {
                            parent = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })

                            // Promote `admin` to an admin of the PARENT group.  They never join
                            // the subgroup -- their view rights are inherited from the parent.
                            await addConfirmedMember(owner.session, admin.session, parent.id, admin.user.id)
                            await setGroupMemberRole(owner.session, parent.id, admin.user.id, 'admin')

                            child = await createSubgroup(owner.session, parent.id, 'private-open')
                            const created = await createGroupPost(owner.session, owner.user.id, child.id, 'private-open')

                            const response = await getPost(admin.session, created.id)

                            assert.equal(response.status, 200)
                            assert.equal(response.content?.entity?.id, created.id)
                        } finally {
                            if ( child ) await deleteGroup(owner.session, child.id)
                            if ( parent ) await deleteGroup(owner.session, parent.id)
                            await logout(owner.session)
                            await logout(admin.session)
                        }
                    })
                })

                describe("For a PRIVATE subgroup of a PRIVATE group", function() {

                })

                describe("For a HIDDEN subgroup of a PRIVATE group", function() {

                })
            })

            describe("For subgroups of HIDDEN groups", function() {
                // ---- 'hidden-open' subgroup (nested under a 'hidden' parent) ----
                describe("For an OPEN subgroup of a HIDDEN group (HIDDEN-OPEN)", function() {
                    it(`Should let a member of the PARENT group view a post in a hidden-open subgroup`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }

                        const owner = await loginAs('user1')
                        const viewer = await loginAs('user2')
                        let parent = null
                        let child = null
                        try {
                            parent = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })
                            child = await createSubgroup(owner.session, parent.id, 'hidden-open')

                            const created = await createGroupPost(owner.session, owner.user.id, child.id, 'hidden-open')

                            // Parent membership only -- not a subgroup member.
                            await addConfirmedMember(owner.session, viewer.session, parent.id, viewer.user.id)

                            const response = await getPost(viewer.session, created.id)

                            assert.equal(response.status, 200)
                            assert.equal(response.content?.entity?.id, created.id)
                            assert.deepEqual(response.content.entity, created)
                        } finally {
                            if ( child ) await deleteGroup(owner.session, child.id)
                            if ( parent ) await deleteGroup(owner.session, parent.id)
                            await logout(owner.session)
                            await logout(viewer.session)
                        }
                    })

                    it(`Should let a confirmed member of the subgroup view a post in a hidden-open subgroup`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }

                        const owner = await loginAs('user1')
                        const viewer = await loginAs('user2')
                        let parent = null
                        let child = null
                        try {
                            parent = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })
                            child = await createSubgroup(owner.session, parent.id, 'hidden-open')

                            const created = await createGroupPost(owner.session, owner.user.id, child.id, 'hidden-open')

                            await addConfirmedMember(owner.session, viewer.session, child.id, viewer.user.id)

                            const response = await getPost(viewer.session, created.id)

                            assert.equal(response.status, 200)
                            assert.equal(response.content?.entity?.id, created.id)
                            assert.deepEqual(response.content.entity, created)
                        } finally {
                            if ( child ) await deleteGroup(owner.session, child.id)
                            if ( parent ) await deleteGroup(owner.session, parent.id)
                            await logout(owner.session)
                            await logout(viewer.session)
                        }
                    })

                    it(`Should NOT let a non-member view a post in a hidden-open subgroup`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }

                        const owner = await loginAs('user1')
                        const viewer = await loginAs('user4')
                        let parent = null
                        let child = null
                        try {
                            parent = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })
                            child = await createSubgroup(owner.session, parent.id, 'hidden-open')

                            const created = await createGroupPost(owner.session, owner.user.id, child.id, 'hidden-open')

                            const response = await getPost(viewer.session, created.id)

                            assert.equal(response.status, 404)
                            assert.equal(response.content?.error?.type, 'not-found')
                        } finally {
                            if ( child ) await deleteGroup(owner.session, child.id)
                            if ( parent ) await deleteGroup(owner.session, parent.id)
                            await logout(owner.session)
                            await logout(viewer.session)
                        }
                    })

                    it(`Should let a PARENT group admin view a hidden-open subgroup post they have not joined`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }

                        const owner = await loginAs('user1')
                        const admin = await loginAs('user2')
                        let parent = null
                        let child = null
                        try {
                            parent = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })

                            await addConfirmedMember(owner.session, admin.session, parent.id, admin.user.id)
                            await setGroupMemberRole(owner.session, parent.id, admin.user.id, 'admin')

                            child = await createSubgroup(owner.session, parent.id, 'hidden-open')
                            const created = await createGroupPost(owner.session, owner.user.id, child.id, 'hidden-open')

                            const response = await getPost(admin.session, created.id)

                            assert.equal(response.status, 200)
                            assert.equal(response.content?.entity?.id, created.id)
                        } finally {
                            if ( child ) await deleteGroup(owner.session, child.id)
                            if ( parent ) await deleteGroup(owner.session, parent.id)
                            await logout(owner.session)
                            await logout(admin.session)
                        }
                    })
                })

                // ---- 'hidden-private' subgroup (nested under a 'hidden' parent) ----
                //
                // Unlike the '-open' subgroups, parent membership is NOT sufficient here.
                describe("For a PRIVATE subgroup of a HIDDEN group (HIDDEN-PRIVATE)", function() {
                    it(`Should let a confirmed member of the subgroup view a post in a hidden-private subgroup`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }

                        const owner = await loginAs('user1')
                        const viewer = await loginAs('user2')
                        let parent = null
                        let child = null
                        try {
                            parent = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })
                            child = await createSubgroup(owner.session, parent.id, 'hidden-private')

                            const created = await createGroupPost(owner.session, owner.user.id, child.id, 'hidden-private')

                            await addConfirmedMember(owner.session, viewer.session, child.id, viewer.user.id)

                            const response = await getPost(viewer.session, created.id)

                            assert.equal(response.status, 200)
                            assert.equal(response.content?.entity?.id, created.id)
                            assert.deepEqual(response.content.entity, created)
                        } finally {
                            if ( child ) await deleteGroup(owner.session, child.id)
                            if ( parent ) await deleteGroup(owner.session, parent.id)
                            await logout(owner.session)
                            await logout(viewer.session)
                        }
                    })

                    it(`Should NOT let a member of the PARENT group (who is not a subgroup member) view a post in a hidden-private subgroup`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }

                        const owner = await loginAs('user1')
                        const viewer = await loginAs('user2')
                        let parent = null
                        let child = null
                        try {
                            parent = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })
                            child = await createSubgroup(owner.session, parent.id, 'hidden-private')

                            const created = await createGroupPost(owner.session, owner.user.id, child.id, 'hidden-private')

                            // Confirmed member of the PARENT group but NOT of the subgroup.  For
                            // 'hidden-private' that is not enough.
                            await addConfirmedMember(owner.session, viewer.session, parent.id, viewer.user.id)

                            const response = await getPost(viewer.session, created.id)

                            assert.equal(response.status, 404)
                            assert.equal(response.content?.error?.type, 'not-found')
                        } finally {
                            if ( child ) await deleteGroup(owner.session, child.id)
                            if ( parent ) await deleteGroup(owner.session, parent.id)
                            await logout(owner.session)
                            await logout(viewer.session)
                        }
                    })

                    it(`Should NOT let a non-member view a post in a hidden-private subgroup`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }

                        const owner = await loginAs('user1')
                        const viewer = await loginAs('user4')
                        let parent = null
                        let child = null
                        try {
                            parent = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })
                            child = await createSubgroup(owner.session, parent.id, 'hidden-private')

                            const created = await createGroupPost(owner.session, owner.user.id, child.id, 'hidden-private')

                            const response = await getPost(viewer.session, created.id)

                            assert.equal(response.status, 404)
                            assert.equal(response.content?.error?.type, 'not-found')
                        } finally {
                            if ( child ) await deleteGroup(owner.session, child.id)
                            if ( parent ) await deleteGroup(owner.session, parent.id)
                            await logout(owner.session)
                            await logout(viewer.session)
                        }
                    })

                    it(`Should let a PARENT group admin view a hidden-private subgroup post they have not joined`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }

                        // The distinguishing case: a plain parent *member* cannot view a
                        // 'hidden-private' subgroup post (asserted above), but a parent *admin*
                        // inherits moderator rights over the subgroup and therefore can --
                        // without ever joining it.
                        const owner = await loginAs('user1')
                        const admin = await loginAs('user2')
                        let parent = null
                        let child = null
                        try {
                            parent = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })

                            await addConfirmedMember(owner.session, admin.session, parent.id, admin.user.id)
                            await setGroupMemberRole(owner.session, parent.id, admin.user.id, 'admin')

                            child = await createSubgroup(owner.session, parent.id, 'hidden-private')
                            const created = await createGroupPost(owner.session, owner.user.id, child.id, 'hidden-private')

                            const response = await getPost(admin.session, created.id)

                            assert.equal(response.status, 200)
                            assert.equal(response.content?.entity?.id, created.id)
                        } finally {
                            if ( child ) await deleteGroup(owner.session, child.id)
                            if ( parent ) await deleteGroup(owner.session, parent.id)
                            await logout(owner.session)
                            await logout(admin.session)
                        }
                    })

                    it(`Should let a site moderator view a hidden-private subgroup post they are not a member of`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }

                        const owner = await loginAs('user1')
                        const moderator = await loginAs('user-site-moderator')
                        let parent = null
                        let child = null
                        try {
                            parent = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })
                            child = await createSubgroup(owner.session, parent.id, 'hidden-private')

                            const created = await createGroupPost(owner.session, owner.user.id, child.id, 'hidden-private')

                            // Member of neither group; visible by virtue of site moderation.
                            const response = await getPost(moderator.session, created.id)

                            assert.equal(response.status, 200)
                            assert.equal(response.content?.entity?.id, created.id)
                        } finally {
                            if ( child ) await deleteGroup(owner.session, child.id)
                            if ( parent ) await deleteGroup(owner.session, parent.id)
                            await logout(owner.session)
                            await logout(moderator.session)
                        }
                    })
                })

                describe("For a HIDDEN subgroup of a HIDDEN group", function() {

                })
            })
        })
    })
})
