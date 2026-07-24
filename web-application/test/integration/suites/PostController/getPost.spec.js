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
const { fetchEndpoint } = require('../../lib/fetchEndpoint')
const { getPost, createPost, createGroupPost, deleteAllPostsForUser } = require('../../lib/posts')
const {
    createGroup,
    createSubgroup,
    deleteGroup,
    joinOpenGroup,
    inviteToGroup,
    addConfirmedMember,
    setGroupMemberStatus,
    setGroupMemberRole,
    removeGroupMember
} = require('../../lib/groups')
const { makeFriends, sendFriendRequest, blockUser, deleteRelationship } = require('../../lib/relationships')
const { isFeatureEnabled } = require('../../lib/system')

// Subgroups (child groups) and their compound types ('private-open',
// 'hidden-open', 'hidden-private') are gated behind this server feature flag.
// When it is off the compound types and the `parentId` column do not exist, so
// the subgroup tests below skip themselves rather than failing spuriously.
const SUBGROUPS_FEATURE = 'issue-165-subgroups'

// Small, branch-free assertion helpers.  These only wrap the HTTP round-trip
// and the status/body checks -- they compute nothing about *who* should be
// allowed.  Each test states its own expectation by choosing which one to call
// (assertCanView / assertCanView for a permitted view, assertCannotView for a
// denied one), so the expected outcome is always visible in the test itself.
//
//   assertCanView   -- 200 + the exact post entity (used for plain viewers:
//                      confirmed members and parent members).
//   assertCanView -- 200 + matching id only (used for elevated viewers --
//                      admins, moderators, site moderators -- where we don't
//                      want a deep-equality check to be sensitive to any extra
//                      fields an elevated role might hydrate).
//   assertCannotView-- 404 + error.type 'not-found' (a denied single-post view).
async function assertCanView(session, expectedPost) {
    const response = await getPost(session, expectedPost.id)
    assert.equal(response.status, 200)
    assert.equal(response.content?.entity?.id, expectedPost.id)
    assert.deepEqual(response.content.entity, expectedPost)
}

async function assertCannotView(session, postId) {
    const response = await getPost(session, postId)
    assert.equal(response.status, 404)
    assert.equal(response.content?.error?.type, 'not-found')
}

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
        // Group posts: group permissions govern who can view a post.  Cases mirror
        // documentation/testing/test-cases/GroupPost/regression/read.md.  Setup is
        // shared per describe: a top-level group (with its members + post) is built
        // once per group type; for subgroups the parent group + its role members
        // are built once per parent type and reused across that parent's three
        // subgroup describes, and each subgroup builds its own child group + post.
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

        // ---- Top-level groups ----
        describe("for Open groups", function() {
            let owner, moderator, member, invited, nonMember, siteModerator
            let group = null
            let post = null

            before(async function() {
                owner = await loginAs('user1')            // group admin (and post author)
                moderator = await loginAs('user2')        // group moderator
                member = await loginAs('user3')           // confirmed member
                invited = await loginAs('user8')          // invited (pending) member
                nonMember = await loginAs('user7')        // non-member
                siteModerator = await loginAs('user-site-moderator')

                group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })

                await joinOpenGroup(moderator.session, group.id, moderator.user.id)
                await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
                await joinOpenGroup(member.session, group.id, member.user.id)
                await inviteToGroup(owner.session, group.id, invited.user.id)

                post = await createGroupPost(owner.session, owner.user.id, group.id, 'open')
            })

            after(async function() {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(moderator.session)
                await logout(member.session)
                await logout(invited.session)
                await logout(nonMember.session)
                await logout(siteModerator.session)
            })

            it(`Should let a Group Admin view the post`, async function() {
                await assertCanView(owner.session, post)
            })

            it(`Should let a Group Moderator view the post`, async function() {
                await assertCanView(moderator.session, post)
            })

            it(`Should let a Member view the post`, async function() {
                await assertCanView(member.session, post)
            })

            it(`Should let a Non-member view the post`, async function() {
                await assertCanView(nonMember.session, post)
            })

            it(`Should let an Invited/Requested (pending) member view the post`, async function() {
                await assertCanView(invited.session, post)
            })

            it(`Should let a site moderator view the post`, async function() {
                await assertCanView(siteModerator.session, post)
            })

            it(`Should NOT let a banned member view the post`, async function() {
                // Borrow the non-member transiently: make them a member, ban them,
                // assert, then remove them so the non-member case is unaffected.
                try {
                    await joinOpenGroup(nonMember.session, group.id, nonMember.user.id)
                    await setGroupMemberStatus(owner.session, group.id, nonMember.user.id, 'banned')
                    await assertCannotView(nonMember.session, post.id)
                } finally {
                    await removeGroupMember(owner.session, group.id, nonMember.user.id)
                }
            })
        })

        describe("for Private groups", function() {
            let owner, moderator, member, invited, nonMember, siteModerator
            let group = null
            let post = null

            before(async function() {
                owner = await loginAs('user1')            // group admin (and post author)
                moderator = await loginAs('user2')        // group moderator
                member = await loginAs('user3')           // confirmed member
                invited = await loginAs('user8')          // invited (pending) member
                nonMember = await loginAs('user7')        // non-member
                siteModerator = await loginAs('user-site-moderator')

                group = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })

                await addConfirmedMember(owner.session, moderator.session, group.id, moderator.user.id)
                await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
                await addConfirmedMember(owner.session, member.session, group.id, member.user.id)
                await inviteToGroup(owner.session, group.id, invited.user.id)

                post = await createGroupPost(owner.session, owner.user.id, group.id, 'private')
            })

            after(async function() {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(moderator.session)
                await logout(member.session)
                await logout(invited.session)
                await logout(nonMember.session)
                await logout(siteModerator.session)
            })

            it(`Should let a Group Admin view the post`, async function() {
                await assertCanView(owner.session, post)
            })

            it(`Should let a Group Moderator view the post`, async function() {
                await assertCanView(moderator.session, post)
            })

            it(`Should let a Member view the post`, async function() {
                await assertCanView(member.session, post)
            })

            it(`Should NOT let a Non-member view the post`, async function() {
                await assertCannotView(nonMember.session, post.id)
            })

            it(`Should NOT let an Invited/Requested (pending) member view the post`, async function() {
                await assertCannotView(invited.session, post.id)
            })

            it(`Should let a site moderator view the post`, async function() {
                await assertCanView(siteModerator.session, post)
            })

            it(`Should NOT let a banned member view the post`, async function() {
                // Borrow the non-member transiently: make them a member, ban them,
                // assert, then remove them so the non-member case is unaffected.
                try {
                    await addConfirmedMember(owner.session, nonMember.session, group.id, nonMember.user.id)
                    await setGroupMemberStatus(owner.session, group.id, nonMember.user.id, 'banned')
                    await assertCannotView(nonMember.session, post.id)
                } finally {
                    await removeGroupMember(owner.session, group.id, nonMember.user.id)
                }
            })
        })

        describe("for Hidden groups", function() {
            let owner, moderator, member, invited, nonMember, siteModerator
            let group = null
            let post = null

            before(async function() {
                owner = await loginAs('user1')            // group admin (and post author)
                moderator = await loginAs('user2')        // group moderator
                member = await loginAs('user3')           // confirmed member
                invited = await loginAs('user8')          // invited (pending) member
                nonMember = await loginAs('user7')        // non-member
                siteModerator = await loginAs('user-site-moderator')

                group = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })

                await addConfirmedMember(owner.session, moderator.session, group.id, moderator.user.id)
                await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
                await addConfirmedMember(owner.session, member.session, group.id, member.user.id)
                await inviteToGroup(owner.session, group.id, invited.user.id)

                post = await createGroupPost(owner.session, owner.user.id, group.id, 'hidden')
            })

            after(async function() {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(moderator.session)
                await logout(member.session)
                await logout(invited.session)
                await logout(nonMember.session)
                await logout(siteModerator.session)
            })

            it(`Should let a Group Admin view the post`, async function() {
                await assertCanView(owner.session, post)
            })

            it(`Should let a Group Moderator view the post`, async function() {
                await assertCanView(moderator.session, post)
            })

            it(`Should let a Member view the post`, async function() {
                await assertCanView(member.session, post)
            })

            it(`Should NOT let a Non-member view the post`, async function() {
                await assertCannotView(nonMember.session, post.id)
            })

            it(`Should NOT let an Invited/Requested (pending) member view the post`, async function() {
                await assertCannotView(invited.session, post.id)
            })

            it(`Should let a site moderator view the post`, async function() {
                await assertCanView(siteModerator.session, post)
            })

            it(`Should NOT let a banned member view the post`, async function() {
                // Borrow the non-member transiently: make them a member, ban them,
                // assert, then remove them so the non-member case is unaffected.
                try {
                    await addConfirmedMember(owner.session, nonMember.session, group.id, nonMember.user.id)
                    await setGroupMemberStatus(owner.session, group.id, nonMember.user.id, 'banned')
                    await assertCannotView(nonMember.session, post.id)
                } finally {
                    await removeGroupMember(owner.session, group.id, nonMember.user.id)
                }
            })
        })

        // ---- Subgroups ----
        // Stored `type` per (parent, child choice):
        //   PUBLIC parent:  open->'open'          private->'private'        hidden->'hidden'
        //   PRIVATE parent: open->'private-open'  private->'private'        hidden->'hidden'
        //   HIDDEN parent:  open->'hidden-open'   private->'hidden-private' hidden->'hidden'
        // Parent admins can always view (moderation inherited); parent members and
        // moderators can view only the '-open' family (via the parent path).
        describe("For Subgroups", function() {

            describe("For subgroups of Public groups", function() {
                let owner, parentAdmin, parentModerator, parentMember, invitedParentMember, nonMember, siteModerator
                let parent = null

                before(async function() {
                    if ( ! subgroupsEnabled ) return
                    owner = await loginAs('user1')                    // admin of every group; post author
                    parentAdmin = await loginAs('user4')              // admin of the parent only
                    parentModerator = await loginAs('user5')          // moderator of the parent only
                    parentMember = await loginAs('user6')             // member of the parent only
                    invitedParentMember = await loginAs('user9')      // parent member; invited into each subgroup
                    nonMember = await loginAs('user7')                // member of nothing
                    siteModerator = await loginAs('user-site-moderator')

                    parent = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })

                    await joinOpenGroup(parentAdmin.session, parent.id, parentAdmin.user.id)
                    await setGroupMemberRole(owner.session, parent.id, parentAdmin.user.id, 'admin')
                    await joinOpenGroup(parentModerator.session, parent.id, parentModerator.user.id)
                    await setGroupMemberRole(owner.session, parent.id, parentModerator.user.id, 'moderator')
                    await joinOpenGroup(parentMember.session, parent.id, parentMember.user.id)
                    await joinOpenGroup(invitedParentMember.session, parent.id, invitedParentMember.user.id)
                })

                after(async function() {
                    if ( ! subgroupsEnabled ) return
                    if ( parent ) await deleteGroup(owner.session, parent.id)
                    await logout(owner.session)
                    await logout(parentAdmin.session)
                    await logout(parentModerator.session)
                    await logout(parentMember.session)
                    await logout(invitedParentMember.session)
                    await logout(nonMember.session)
                    await logout(siteModerator.session)
                })

                describe("For an OPEN subgroup of a PUBLIC group", function() {
                    let subModerator, subMember, invited
                    let child = null
                    let post = null

                    before(async function() {
                        if ( ! subgroupsEnabled ) return
                        subModerator = await loginAs('user2')     // subgroup moderator
                        subMember = await loginAs('user3')        // confirmed subgroup member
                        invited = await loginAs('user8')          // invited to subgroup; NOT a parent member

                        child = await createSubgroup(owner.session, parent.id, 'open')

                        await addConfirmedMember(owner.session, subModerator.session, child.id, subModerator.user.id)
                        await setGroupMemberRole(owner.session, child.id, subModerator.user.id, 'moderator')
                        await addConfirmedMember(owner.session, subMember.session, child.id, subMember.user.id)

                        // Two pending (invited) members: one who is not a parent member and
                        // one (user9) who is also a member of the parent group.
                        await inviteToGroup(owner.session, child.id, invited.user.id)
                        await inviteToGroup(owner.session, child.id, invitedParentMember.user.id)

                        post = await createGroupPost(owner.session, owner.user.id, child.id, 'open')
                    })

                    after(async function() {
                        if ( ! subgroupsEnabled ) return
                        if ( child ) await deleteGroup(owner.session, child.id)
                        await logout(subModerator.session)
                        await logout(subMember.session)
                        await logout(invited.session)
                    })

                    it(`Should let a Group Admin view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(owner.session, post)
                    })

                    it(`Should let a Group Moderator view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(subModerator.session, post)
                    })

                    it(`Should let a Member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(subMember.session, post)
                    })

                    it(`Should let a Parent Group Admin view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(parentAdmin.session, post)
                    })

                    it(`Should let a Parent Group Moderator view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(parentModerator.session, post)
                    })

                    it(`Should let a Parent Group Member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(parentMember.session, post)
                    })

                    it(`Should let a Non-member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(nonMember.session, post)
                    })

                    it(`Should let an Invited/Requested (pending) member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(invited.session, post)
                    })

                    it(`Should let an Invited/Requested (pending) member who is a Parent Group Member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(invitedParentMember.session, post)
                    })

                    it(`Should let a site moderator view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(siteModerator.session, post)
                    })

                    it(`Should NOT let a banned subgroup member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        // Borrow the non-member transiently: add to the subgroup, ban, assert,
                        // then remove.  The ban overrides even the parent-member path.
                        try {
                            await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                            await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                            await assertCannotView(nonMember.session, post.id)
                        } finally {
                            await removeGroupMember(owner.session, child.id, nonMember.user.id)
                        }
                    })
                })

                describe("For a PRIVATE subgroup of a PUBLIC group", function() {
                    let subModerator, subMember, invited
                    let child = null
                    let post = null

                    before(async function() {
                        if ( ! subgroupsEnabled ) return
                        subModerator = await loginAs('user2')     // subgroup moderator
                        subMember = await loginAs('user3')        // confirmed subgroup member
                        invited = await loginAs('user8')          // invited to subgroup; NOT a parent member

                        child = await createSubgroup(owner.session, parent.id, 'private')

                        await addConfirmedMember(owner.session, subModerator.session, child.id, subModerator.user.id)
                        await setGroupMemberRole(owner.session, child.id, subModerator.user.id, 'moderator')
                        await addConfirmedMember(owner.session, subMember.session, child.id, subMember.user.id)

                        // Two pending (invited) members: one who is not a parent member and
                        // one (user9) who is also a member of the parent group.
                        await inviteToGroup(owner.session, child.id, invited.user.id)
                        await inviteToGroup(owner.session, child.id, invitedParentMember.user.id)

                        post = await createGroupPost(owner.session, owner.user.id, child.id, 'private')
                    })

                    after(async function() {
                        if ( ! subgroupsEnabled ) return
                        if ( child ) await deleteGroup(owner.session, child.id)
                        await logout(subModerator.session)
                        await logout(subMember.session)
                        await logout(invited.session)
                    })

                    it(`Should let a Group Admin view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(owner.session, post)
                    })

                    it(`Should let a Group Moderator view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(subModerator.session, post)
                    })

                    it(`Should let a Member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(subMember.session, post)
                    })

                    it(`Should let a Parent Group Admin view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(parentAdmin.session, post)
                    })

                    it(`Should NOT let a Parent Group Moderator view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(parentModerator.session, post.id)
                    })

                    it(`Should NOT let a Parent Group Member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(parentMember.session, post.id)
                    })

                    it(`Should NOT let a Non-member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(nonMember.session, post.id)
                    })

                    it(`Should NOT let an Invited/Requested (pending) member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(invited.session, post.id)
                    })

                    it(`Should NOT let an Invited/Requested (pending) member who is a Parent Group Member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(invitedParentMember.session, post.id)
                    })

                    it(`Should let a site moderator view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(siteModerator.session, post)
                    })

                    it(`Should NOT let a banned subgroup member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        // Borrow the non-member transiently: add to the subgroup, ban, assert,
                        // then remove.  The ban overrides even the parent-member path.
                        try {
                            await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                            await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                            await assertCannotView(nonMember.session, post.id)
                        } finally {
                            await removeGroupMember(owner.session, child.id, nonMember.user.id)
                        }
                    })
                })

                describe("For a HIDDEN subgroup of a PUBLIC group", function() {
                    let subModerator, subMember, invited
                    let child = null
                    let post = null

                    before(async function() {
                        if ( ! subgroupsEnabled ) return
                        subModerator = await loginAs('user2')     // subgroup moderator
                        subMember = await loginAs('user3')        // confirmed subgroup member
                        invited = await loginAs('user8')          // invited to subgroup; NOT a parent member

                        child = await createSubgroup(owner.session, parent.id, 'hidden')

                        await addConfirmedMember(owner.session, subModerator.session, child.id, subModerator.user.id)
                        await setGroupMemberRole(owner.session, child.id, subModerator.user.id, 'moderator')
                        await addConfirmedMember(owner.session, subMember.session, child.id, subMember.user.id)

                        // Two pending (invited) members: one who is not a parent member and
                        // one (user9) who is also a member of the parent group.
                        await inviteToGroup(owner.session, child.id, invited.user.id)
                        await inviteToGroup(owner.session, child.id, invitedParentMember.user.id)

                        post = await createGroupPost(owner.session, owner.user.id, child.id, 'hidden')
                    })

                    after(async function() {
                        if ( ! subgroupsEnabled ) return
                        if ( child ) await deleteGroup(owner.session, child.id)
                        await logout(subModerator.session)
                        await logout(subMember.session)
                        await logout(invited.session)
                    })

                    it(`Should let a Group Admin view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(owner.session, post)
                    })

                    it(`Should let a Group Moderator view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(subModerator.session, post)
                    })

                    it(`Should let a Member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(subMember.session, post)
                    })

                    it(`Should let a Parent Group Admin view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(parentAdmin.session, post)
                    })

                    it(`Should NOT let a Parent Group Moderator view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(parentModerator.session, post.id)
                    })

                    it(`Should NOT let a Parent Group Member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(parentMember.session, post.id)
                    })

                    it(`Should NOT let a Non-member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(nonMember.session, post.id)
                    })

                    it(`Should NOT let an Invited/Requested (pending) member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(invited.session, post.id)
                    })

                    it(`Should NOT let an Invited/Requested (pending) member who is a Parent Group Member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(invitedParentMember.session, post.id)
                    })

                    it(`Should let a site moderator view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(siteModerator.session, post)
                    })

                    it(`Should NOT let a banned subgroup member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        // Borrow the non-member transiently: add to the subgroup, ban, assert,
                        // then remove.  The ban overrides even the parent-member path.
                        try {
                            await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                            await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                            await assertCannotView(nonMember.session, post.id)
                        } finally {
                            await removeGroupMember(owner.session, child.id, nonMember.user.id)
                        }
                    })
                })

            })

            describe("For subgroups of Private groups", function() {
                let owner, parentAdmin, parentModerator, parentMember, invitedParentMember, nonMember, siteModerator
                let parent = null

                before(async function() {
                    if ( ! subgroupsEnabled ) return
                    owner = await loginAs('user1')                    // admin of every group; post author
                    parentAdmin = await loginAs('user4')              // admin of the parent only
                    parentModerator = await loginAs('user5')          // moderator of the parent only
                    parentMember = await loginAs('user6')             // member of the parent only
                    invitedParentMember = await loginAs('user9')      // parent member; invited into each subgroup
                    nonMember = await loginAs('user7')                // member of nothing
                    siteModerator = await loginAs('user-site-moderator')

                    parent = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })

                    await addConfirmedMember(owner.session, parentAdmin.session, parent.id, parentAdmin.user.id)
                    await setGroupMemberRole(owner.session, parent.id, parentAdmin.user.id, 'admin')
                    await addConfirmedMember(owner.session, parentModerator.session, parent.id, parentModerator.user.id)
                    await setGroupMemberRole(owner.session, parent.id, parentModerator.user.id, 'moderator')
                    await addConfirmedMember(owner.session, parentMember.session, parent.id, parentMember.user.id)
                    await addConfirmedMember(owner.session, invitedParentMember.session, parent.id, invitedParentMember.user.id)
                })

                after(async function() {
                    if ( ! subgroupsEnabled ) return
                    if ( parent ) await deleteGroup(owner.session, parent.id)
                    await logout(owner.session)
                    await logout(parentAdmin.session)
                    await logout(parentModerator.session)
                    await logout(parentMember.session)
                    await logout(invitedParentMember.session)
                    await logout(nonMember.session)
                    await logout(siteModerator.session)
                })

                describe("For an OPEN subgroup of a PRIVATE group (PRIVATE-OPEN)", function() {
                    let subModerator, subMember, invited
                    let child = null
                    let post = null

                    before(async function() {
                        if ( ! subgroupsEnabled ) return
                        subModerator = await loginAs('user2')     // subgroup moderator
                        subMember = await loginAs('user3')        // confirmed subgroup member
                        invited = await loginAs('user8')          // invited to subgroup; NOT a parent member

                        child = await createSubgroup(owner.session, parent.id, 'private-open')

                        await addConfirmedMember(owner.session, subModerator.session, child.id, subModerator.user.id)
                        await setGroupMemberRole(owner.session, child.id, subModerator.user.id, 'moderator')
                        await addConfirmedMember(owner.session, subMember.session, child.id, subMember.user.id)

                        // Two pending (invited) members: one who is not a parent member and
                        // one (user9) who is also a member of the parent group.
                        await inviteToGroup(owner.session, child.id, invited.user.id)
                        await inviteToGroup(owner.session, child.id, invitedParentMember.user.id)

                        post = await createGroupPost(owner.session, owner.user.id, child.id, 'private-open')
                    })

                    after(async function() {
                        if ( ! subgroupsEnabled ) return
                        if ( child ) await deleteGroup(owner.session, child.id)
                        await logout(subModerator.session)
                        await logout(subMember.session)
                        await logout(invited.session)
                    })

                    it(`Should let a Group Admin view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(owner.session, post)
                    })

                    it(`Should let a Group Moderator view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(subModerator.session, post)
                    })

                    it(`Should let a Member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(subMember.session, post)
                    })

                    it(`Should let a Parent Group Admin view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(parentAdmin.session, post)
                    })

                    it(`Should let a Parent Group Moderator view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(parentModerator.session, post)
                    })

                    it(`Should let a Parent Group Member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(parentMember.session, post)
                    })

                    it(`Should NOT let a Non-member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(nonMember.session, post.id)
                    })

                    it(`Should NOT let an Invited/Requested (pending) member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(invited.session, post.id)
                    })

                    it(`Should let an Invited/Requested (pending) member who is a Parent Group Member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(invitedParentMember.session, post)
                    })

                    it(`Should let a site moderator view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(siteModerator.session, post)
                    })

                    it(`Should NOT let a banned subgroup member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        // Borrow the non-member transiently: add to the subgroup, ban, assert,
                        // then remove.  The ban overrides even the parent-member path.
                        try {
                            await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                            await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                            await assertCannotView(nonMember.session, post.id)
                        } finally {
                            await removeGroupMember(owner.session, child.id, nonMember.user.id)
                        }
                    })
                })

                describe("For a PRIVATE subgroup of a PRIVATE group", function() {
                    let subModerator, subMember, invited
                    let child = null
                    let post = null

                    before(async function() {
                        if ( ! subgroupsEnabled ) return
                        subModerator = await loginAs('user2')     // subgroup moderator
                        subMember = await loginAs('user3')        // confirmed subgroup member
                        invited = await loginAs('user8')          // invited to subgroup; NOT a parent member

                        child = await createSubgroup(owner.session, parent.id, 'private')

                        await addConfirmedMember(owner.session, subModerator.session, child.id, subModerator.user.id)
                        await setGroupMemberRole(owner.session, child.id, subModerator.user.id, 'moderator')
                        await addConfirmedMember(owner.session, subMember.session, child.id, subMember.user.id)

                        // Two pending (invited) members: one who is not a parent member and
                        // one (user9) who is also a member of the parent group.
                        await inviteToGroup(owner.session, child.id, invited.user.id)
                        await inviteToGroup(owner.session, child.id, invitedParentMember.user.id)

                        post = await createGroupPost(owner.session, owner.user.id, child.id, 'private')
                    })

                    after(async function() {
                        if ( ! subgroupsEnabled ) return
                        if ( child ) await deleteGroup(owner.session, child.id)
                        await logout(subModerator.session)
                        await logout(subMember.session)
                        await logout(invited.session)
                    })

                    it(`Should let a Group Admin view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(owner.session, post)
                    })

                    it(`Should let a Group Moderator view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(subModerator.session, post)
                    })

                    it(`Should let a Member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(subMember.session, post)
                    })

                    it(`Should let a Parent Group Admin view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(parentAdmin.session, post)
                    })

                    it(`Should NOT let a Parent Group Moderator view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(parentModerator.session, post.id)
                    })

                    it(`Should NOT let a Parent Group Member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(parentMember.session, post.id)
                    })

                    it(`Should NOT let a Non-member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(nonMember.session, post.id)
                    })

                    it(`Should NOT let an Invited/Requested (pending) member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(invited.session, post.id)
                    })

                    it(`Should NOT let an Invited/Requested (pending) member who is a Parent Group Member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(invitedParentMember.session, post.id)
                    })

                    it(`Should let a site moderator view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(siteModerator.session, post)
                    })

                    it(`Should NOT let a banned subgroup member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        // Borrow the non-member transiently: add to the subgroup, ban, assert,
                        // then remove.  The ban overrides even the parent-member path.
                        try {
                            await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                            await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                            await assertCannotView(nonMember.session, post.id)
                        } finally {
                            await removeGroupMember(owner.session, child.id, nonMember.user.id)
                        }
                    })
                })

                describe("For a HIDDEN subgroup of a PRIVATE group", function() {
                    let subModerator, subMember, invited
                    let child = null
                    let post = null

                    before(async function() {
                        if ( ! subgroupsEnabled ) return
                        subModerator = await loginAs('user2')     // subgroup moderator
                        subMember = await loginAs('user3')        // confirmed subgroup member
                        invited = await loginAs('user8')          // invited to subgroup; NOT a parent member

                        child = await createSubgroup(owner.session, parent.id, 'hidden')

                        await addConfirmedMember(owner.session, subModerator.session, child.id, subModerator.user.id)
                        await setGroupMemberRole(owner.session, child.id, subModerator.user.id, 'moderator')
                        await addConfirmedMember(owner.session, subMember.session, child.id, subMember.user.id)

                        // Two pending (invited) members: one who is not a parent member and
                        // one (user9) who is also a member of the parent group.
                        await inviteToGroup(owner.session, child.id, invited.user.id)
                        await inviteToGroup(owner.session, child.id, invitedParentMember.user.id)

                        post = await createGroupPost(owner.session, owner.user.id, child.id, 'hidden')
                    })

                    after(async function() {
                        if ( ! subgroupsEnabled ) return
                        if ( child ) await deleteGroup(owner.session, child.id)
                        await logout(subModerator.session)
                        await logout(subMember.session)
                        await logout(invited.session)
                    })

                    it(`Should let a Group Admin view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(owner.session, post)
                    })

                    it(`Should let a Group Moderator view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(subModerator.session, post)
                    })

                    it(`Should let a Member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(subMember.session, post)
                    })

                    it(`Should let a Parent Group Admin view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(parentAdmin.session, post)
                    })

                    it(`Should NOT let a Parent Group Moderator view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(parentModerator.session, post.id)
                    })

                    it(`Should NOT let a Parent Group Member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(parentMember.session, post.id)
                    })

                    it(`Should NOT let a Non-member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(nonMember.session, post.id)
                    })

                    it(`Should NOT let an Invited/Requested (pending) member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(invited.session, post.id)
                    })

                    it(`Should NOT let an Invited/Requested (pending) member who is a Parent Group Member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(invitedParentMember.session, post.id)
                    })

                    it(`Should let a site moderator view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(siteModerator.session, post)
                    })

                    it(`Should NOT let a banned subgroup member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        // Borrow the non-member transiently: add to the subgroup, ban, assert,
                        // then remove.  The ban overrides even the parent-member path.
                        try {
                            await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                            await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                            await assertCannotView(nonMember.session, post.id)
                        } finally {
                            await removeGroupMember(owner.session, child.id, nonMember.user.id)
                        }
                    })
                })

            })

            describe("For subgroups of HIDDEN groups", function() {
                let owner, parentAdmin, parentModerator, parentMember, invitedParentMember, nonMember, siteModerator
                let parent = null

                before(async function() {
                    if ( ! subgroupsEnabled ) return
                    owner = await loginAs('user1')                    // admin of every group; post author
                    parentAdmin = await loginAs('user4')              // admin of the parent only
                    parentModerator = await loginAs('user5')          // moderator of the parent only
                    parentMember = await loginAs('user6')             // member of the parent only
                    invitedParentMember = await loginAs('user9')      // parent member; invited into each subgroup
                    nonMember = await loginAs('user7')                // member of nothing
                    siteModerator = await loginAs('user-site-moderator')

                    parent = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })

                    await addConfirmedMember(owner.session, parentAdmin.session, parent.id, parentAdmin.user.id)
                    await setGroupMemberRole(owner.session, parent.id, parentAdmin.user.id, 'admin')
                    await addConfirmedMember(owner.session, parentModerator.session, parent.id, parentModerator.user.id)
                    await setGroupMemberRole(owner.session, parent.id, parentModerator.user.id, 'moderator')
                    await addConfirmedMember(owner.session, parentMember.session, parent.id, parentMember.user.id)
                    await addConfirmedMember(owner.session, invitedParentMember.session, parent.id, invitedParentMember.user.id)
                })

                after(async function() {
                    if ( ! subgroupsEnabled ) return
                    if ( parent ) await deleteGroup(owner.session, parent.id)
                    await logout(owner.session)
                    await logout(parentAdmin.session)
                    await logout(parentModerator.session)
                    await logout(parentMember.session)
                    await logout(invitedParentMember.session)
                    await logout(nonMember.session)
                    await logout(siteModerator.session)
                })

                describe("For an OPEN subgroup of a HIDDEN group (HIDDEN-OPEN)", function() {
                    let subModerator, subMember, invited
                    let child = null
                    let post = null

                    before(async function() {
                        if ( ! subgroupsEnabled ) return
                        subModerator = await loginAs('user2')     // subgroup moderator
                        subMember = await loginAs('user3')        // confirmed subgroup member
                        invited = await loginAs('user8')          // invited to subgroup; NOT a parent member

                        child = await createSubgroup(owner.session, parent.id, 'hidden-open')

                        await addConfirmedMember(owner.session, subModerator.session, child.id, subModerator.user.id)
                        await setGroupMemberRole(owner.session, child.id, subModerator.user.id, 'moderator')
                        await addConfirmedMember(owner.session, subMember.session, child.id, subMember.user.id)

                        // Two pending (invited) members: one who is not a parent member and
                        // one (user9) who is also a member of the parent group.
                        await inviteToGroup(owner.session, child.id, invited.user.id)
                        await inviteToGroup(owner.session, child.id, invitedParentMember.user.id)

                        post = await createGroupPost(owner.session, owner.user.id, child.id, 'hidden-open')
                    })

                    after(async function() {
                        if ( ! subgroupsEnabled ) return
                        if ( child ) await deleteGroup(owner.session, child.id)
                        await logout(subModerator.session)
                        await logout(subMember.session)
                        await logout(invited.session)
                    })

                    it(`Should let a Group Admin view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(owner.session, post)
                    })

                    it(`Should let a Group Moderator view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(subModerator.session, post)
                    })

                    it(`Should let a Member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(subMember.session, post)
                    })

                    it(`Should let a Parent Group Admin view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(parentAdmin.session, post)
                    })

                    it(`Should let a Parent Group Moderator view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(parentModerator.session, post)
                    })

                    it(`Should let a Parent Group Member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(parentMember.session, post)
                    })

                    it(`Should NOT let a Non-member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(nonMember.session, post.id)
                    })

                    it(`Should NOT let an Invited/Requested (pending) member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(invited.session, post.id)
                    })

                    it(`Should let an Invited/Requested (pending) member who is a Parent Group Member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(invitedParentMember.session, post)
                    })

                    it(`Should let a site moderator view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(siteModerator.session, post)
                    })

                    it(`Should NOT let a banned subgroup member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        // Borrow the non-member transiently: add to the subgroup, ban, assert,
                        // then remove.  The ban overrides even the parent-member path.
                        try {
                            await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                            await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                            await assertCannotView(nonMember.session, post.id)
                        } finally {
                            await removeGroupMember(owner.session, child.id, nonMember.user.id)
                        }
                    })
                })

                describe("For a PRIVATE subgroup of a HIDDEN group (HIDDEN-PRIVATE)", function() {
                    let subModerator, subMember, invited
                    let child = null
                    let post = null

                    before(async function() {
                        if ( ! subgroupsEnabled ) return
                        subModerator = await loginAs('user2')     // subgroup moderator
                        subMember = await loginAs('user3')        // confirmed subgroup member
                        invited = await loginAs('user8')          // invited to subgroup; NOT a parent member

                        child = await createSubgroup(owner.session, parent.id, 'hidden-private')

                        await addConfirmedMember(owner.session, subModerator.session, child.id, subModerator.user.id)
                        await setGroupMemberRole(owner.session, child.id, subModerator.user.id, 'moderator')
                        await addConfirmedMember(owner.session, subMember.session, child.id, subMember.user.id)

                        // Two pending (invited) members: one who is not a parent member and
                        // one (user9) who is also a member of the parent group.
                        await inviteToGroup(owner.session, child.id, invited.user.id)
                        await inviteToGroup(owner.session, child.id, invitedParentMember.user.id)

                        post = await createGroupPost(owner.session, owner.user.id, child.id, 'hidden-private')
                    })

                    after(async function() {
                        if ( ! subgroupsEnabled ) return
                        if ( child ) await deleteGroup(owner.session, child.id)
                        await logout(subModerator.session)
                        await logout(subMember.session)
                        await logout(invited.session)
                    })

                    it(`Should let a Group Admin view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(owner.session, post)
                    })

                    it(`Should let a Group Moderator view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(subModerator.session, post)
                    })

                    it(`Should let a Member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(subMember.session, post)
                    })

                    it(`Should let a Parent Group Admin view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(parentAdmin.session, post)
                    })

                    it(`Should NOT let a Parent Group Moderator view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(parentModerator.session, post.id)
                    })

                    it(`Should NOT let a Parent Group Member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(parentMember.session, post.id)
                    })

                    it(`Should NOT let a Non-member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(nonMember.session, post.id)
                    })

                    it(`Should NOT let an Invited/Requested (pending) member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(invited.session, post.id)
                    })

                    it(`Should NOT let an Invited/Requested (pending) member who is a Parent Group Member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(invitedParentMember.session, post.id)
                    })

                    it(`Should let a site moderator view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(siteModerator.session, post)
                    })

                    it(`Should NOT let a banned subgroup member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        // Borrow the non-member transiently: add to the subgroup, ban, assert,
                        // then remove.  The ban overrides even the parent-member path.
                        try {
                            await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                            await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                            await assertCannotView(nonMember.session, post.id)
                        } finally {
                            await removeGroupMember(owner.session, child.id, nonMember.user.id)
                        }
                    })
                })

                describe("For a HIDDEN subgroup of a HIDDEN group", function() {
                    let subModerator, subMember, invited
                    let child = null
                    let post = null

                    before(async function() {
                        if ( ! subgroupsEnabled ) return
                        subModerator = await loginAs('user2')     // subgroup moderator
                        subMember = await loginAs('user3')        // confirmed subgroup member
                        invited = await loginAs('user8')          // invited to subgroup; NOT a parent member

                        child = await createSubgroup(owner.session, parent.id, 'hidden')

                        await addConfirmedMember(owner.session, subModerator.session, child.id, subModerator.user.id)
                        await setGroupMemberRole(owner.session, child.id, subModerator.user.id, 'moderator')
                        await addConfirmedMember(owner.session, subMember.session, child.id, subMember.user.id)

                        // Two pending (invited) members: one who is not a parent member and
                        // one (user9) who is also a member of the parent group.
                        await inviteToGroup(owner.session, child.id, invited.user.id)
                        await inviteToGroup(owner.session, child.id, invitedParentMember.user.id)

                        post = await createGroupPost(owner.session, owner.user.id, child.id, 'hidden')
                    })

                    after(async function() {
                        if ( ! subgroupsEnabled ) return
                        if ( child ) await deleteGroup(owner.session, child.id)
                        await logout(subModerator.session)
                        await logout(subMember.session)
                        await logout(invited.session)
                    })

                    it(`Should let a Group Admin view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(owner.session, post)
                    })

                    it(`Should let a Group Moderator view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(subModerator.session, post)
                    })

                    it(`Should let a Member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(subMember.session, post)
                    })

                    it(`Should let a Parent Group Admin view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(parentAdmin.session, post)
                    })

                    it(`Should NOT let a Parent Group Moderator view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(parentModerator.session, post.id)
                    })

                    it(`Should NOT let a Parent Group Member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(parentMember.session, post.id)
                    })

                    it(`Should NOT let a Non-member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(nonMember.session, post.id)
                    })

                    it(`Should NOT let an Invited/Requested (pending) member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(invited.session, post.id)
                    })

                    it(`Should NOT let an Invited/Requested (pending) member who is a Parent Group Member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotView(invitedParentMember.session, post.id)
                    })

                    it(`Should let a site moderator view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanView(siteModerator.session, post)
                    })

                    it(`Should NOT let a banned subgroup member view the post`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        // Borrow the non-member transiently: add to the subgroup, ban, assert,
                        // then remove.  The ban overrides even the parent-member path.
                        try {
                            await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                            await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                            await assertCannotView(nonMember.session, post.id)
                        } finally {
                            await removeGroupMember(owner.session, child.id, nonMember.user.id)
                        }
                    })
                })

            })

        })
    })
})
