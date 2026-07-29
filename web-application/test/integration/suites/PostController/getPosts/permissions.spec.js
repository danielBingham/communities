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

const { initialize, login, logout, loginAs } = require('../../../lib/authentication')
const { fetchEndpoint } = require('../../../lib/fetchEndpoint')
const { getPost, createPost, createGroupPost, deleteAllPostsForUser } = require('../../../lib/posts')
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
} = require('../../../lib/groups')
const { makeFriends, sendFriendRequest, blockUser, deleteRelationship } = require('../../../lib/relationships')
const { isFeatureEnabled } = require('../../../lib/system')

const userDictionary = require('../../../fixtures/users')

// Subgroups (and their compound types) are gated behind this feature flag; the
// subgroup blocks skip themselves when it is off, exactly as in getPost.spec.js.
const SUBGROUPS_FEATURE = 'issue-165-subgroups'

let subgroupsEnabled = false

// ============================================================================
// Approach
//
// GET /posts is the LIST endpoint.  Unlike GET /post/:id we cannot reset the
// environment to a known set of posts (the query returns every post the caller
// may see, across all users), so we cannot match the whole result to an exact
// expected list.  Instead we seed a specific post, then check whether it appears
// in the caller's list and compare that to whether GET /post/:id lets the same
// caller see it.
//
// Two ways to get the "should this caller see it?" answer to compare against:
//   (a) call GET /post/:id for the seeded post, per caller, and read its 200/404;
//   (b) import the permission function from @communities/shared and evaluate it.
//
// We use (a).  The dominant cost -- paginating the whole list -- is identical
// either way, so the only difference is how we derive the single-post answer.
// (b) requires reconstructing the full permission *context* (post, group,
// parentGroup, the caller's membership in both, canModerateSite/Group); building
// that faithfully means extra membership look-ups (as many calls as (a), or
// more) or hand-building the context in the test, which re-implements the model
// we are trying to verify.  (a) needs none of that: one cheap indexed GET per
// (post, caller) hits the real PostPermissions code directly, and comparing two
// live endpoints is the truest "does the list SQL agree with the permission
// model?" check.  getPost.spec.js pins down the single-post side's absolute
// correctness; this suite pins the list to it.
// ============================================================================

// Paginate the caller's entire GET /posts result and return true as soon as
// `postId` appears; scans every page before returning false.
async function listContainsPost(session, postId) {
    let page = 1
    let numberOfPages = 1
    while ( page <= numberOfPages ) {
        const response = await fetchEndpoint('GET', `/posts?page=${page}`, { session: session })
        if ( ! response.ok ) {
            throw new Error(`GET /posts failed on page ${page}: ${response.status} ${JSON.stringify(response.content)}`)
        }
        const content = response.content
        numberOfPages = content.meta.numberOfPages
        if ( Array.isArray(content.list) && content.list.includes(postId) ) {
            return true
        }
        page = page + 1
    }
    return false
}

// The core cross-check: the bare GET /posts list must include a post exactly
// when GET /post/:id returns it (200) and omit it exactly when GET /post/:id
// denies it (404).  Asserts the createQuery() SQL agrees with PostPermissions.
async function assertListMatchesGetPost(session, post) {
    const single = await getPost(session, post.id)
    assert.ok(single.status === 200 || single.status === 404,
        `GET /post/:id returned unexpected status ${single.status} for post ${post.id}`)
    const singleAllows = single.status === 200

    const inList = await listContainsPost(session, post.id)

    assert.equal(inList, singleAllows,
        `GET /posts ${inList ? 'INCLUDED' : 'OMITTED'} post ${post.id}, but GET /post/:id `
        + `${singleAllows ? 'ALLOWED it (200)' : 'DENIED it (404)'} -- the list query in `
        + `PostController.createQuery() and the single-post permission model disagree.`)
}

describe('GET /posts', function() {

    before(async function() {
        subgroupsEnabled = await isFeatureEnabled(SUBGROUPS_FEATURE)
    })

    // A basic pagination sanity check: for a user with no posts of their own,
    // every post the list returns is a public one, and the paginated count adds
    // up to meta.count.  The permission matrix below is the substance of the suite.
    it(`Should return a list of all public posts for a user with no posts`, async function() {
        const session = await initialize()
        const user1 = userDictionary['user1']
        const currentUser = await login({ email: user1.email, password: user1.password }, session)

        // Clear out User1's posts before running the test.
        await deleteAllPostsForUser(session, currentUser.id)

        let page = 1
        let numberOfPages = 1
        let count = 0
        let metaCount = 0

        while ( page <= numberOfPages ) {
            const response = await fetchEndpoint('GET', `/posts?page=${page}`, { session: session })
            const content = response.content

            numberOfPages = content.meta.numberOfPages
            metaCount = parseInt(content.meta.count, 10)

            for(const postId of content.list) {
                const post = content.dictionary[postId]
                if ( post.visibility !== 'public' ) {
                    assert.fail('Non-public post returned to a user who should only see public posts!')
                }
                count = count + 1
            }

            page = page + 1
        }

        assert.equal(count, metaCount)
        await logout(session)
    })

    describe("for posts to a user's feed", function() {
        describe("for PUBLIC posts", function() {
            it(`GET /posts matches GET /post/:id for a stranger`, async function() {
                const owner = await loginAs('user1')
                const viewer = await loginAs('user2')
                try {
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)

                    const created = await createPost(owner.session, owner.user.id, { visibility: 'public' })

                    await assertListMatchesGetPost(viewer.session, created)
                } finally {
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await logout(owner.session)
                    await logout(viewer.session)
                }
            })

            it(`GET /posts matches GET /post/:id for a confirmed friend`, async function() {
                const owner = await loginAs('user1')
                const viewer = await loginAs('user2')
                try {
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)

                    const created = await createPost(owner.session, owner.user.id, { visibility: 'public' })
                    await makeFriends(owner.session, owner.user.id, viewer.session, viewer.user.id)

                    await assertListMatchesGetPost(viewer.session, created)
                } finally {
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await logout(owner.session)
                    await logout(viewer.session)
                }
            })

            it(`GET /posts matches GET /post/:id for a blocked user`, async function() {
                const owner = await loginAs('user1')
                const viewer = await loginAs('user2')
                try {
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)

                    const created = await createPost(owner.session, owner.user.id, { visibility: 'public' })
                    await blockUser(owner.session, owner.user.id, viewer.user.id)

                    await assertListMatchesGetPost(viewer.session, created)
                } finally {
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await logout(owner.session)
                    await logout(viewer.session)
                }
            })

        })

        describe("for PRIVATE posts", function() {
            it(`GET /posts matches GET /post/:id for a stranger`, async function() {
                const owner = await loginAs('user1')
                const viewer = await loginAs('user2')
                try {
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)

                    const created = await createPost(owner.session, owner.user.id, { visibility: 'private' })

                    await assertListMatchesGetPost(viewer.session, created)
                } finally {
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await logout(owner.session)
                    await logout(viewer.session)
                }
            })

            it(`GET /posts matches GET /post/:id for a confirmed friend`, async function() {
                const owner = await loginAs('user1')
                const viewer = await loginAs('user2')
                try {
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)

                    const created = await createPost(owner.session, owner.user.id, { visibility: 'private' })
                    await makeFriends(owner.session, owner.user.id, viewer.session, viewer.user.id)

                    await assertListMatchesGetPost(viewer.session, created)
                } finally {
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await logout(owner.session)
                    await logout(viewer.session)
                }
            })

            it(`GET /posts matches GET /post/:id for a user with a pending friend request`, async function() {
                const owner = await loginAs('user1')
                const viewer = await loginAs('user2')
                try {
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)

                    const created = await createPost(owner.session, owner.user.id, { visibility: 'private' })
                    await sendFriendRequest(owner.session, owner.user.id, viewer.user.id)

                    await assertListMatchesGetPost(viewer.session, created)
                } finally {
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await logout(owner.session)
                    await logout(viewer.session)
                }
            })

            it(`GET /posts matches GET /post/:id for a blocked user`, async function() {
                const owner = await loginAs('user1')
                const viewer = await loginAs('user2')
                try {
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)

                    const created = await createPost(owner.session, owner.user.id, { visibility: 'private' })
                    await blockUser(owner.session, owner.user.id, viewer.user.id)

                    await assertListMatchesGetPost(viewer.session, created)
                } finally {
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await logout(owner.session)
                    await logout(viewer.session)
                }
            })

            it(`GET /posts matches GET /post/:id for a site moderator`, async function() {
                const owner = await loginAs('user1')
                const viewer = await loginAs('user-site-moderator')
                try {
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)

                    const created = await createPost(owner.session, owner.user.id, { visibility: 'private' })

                    await assertListMatchesGetPost(viewer.session, created)
                } finally {
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await logout(owner.session)
                    await logout(viewer.session)
                }
            })
        })
    })

    describe("for posts to a group", function() {
        it(`GET /posts matches GET /post/:id for the author of their own group post`, async function() {
            const owner = await loginAs('user1')
            let group = null
            try {
                group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                const created = await createGroupPost(owner.session, owner.user.id, group.id, 'open')
                await assertListMatchesGetPost(owner.session, created)
            } finally {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
            }
        })

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

            it(`GET /posts matches GET /post/:id for a Group Admin`, async function() {
                await assertListMatchesGetPost(owner.session, post)
            })

            it(`GET /posts matches GET /post/:id for a Group Moderator`, async function() {
                await assertListMatchesGetPost(moderator.session, post)
            })

            it(`GET /posts matches GET /post/:id for a Member`, async function() {
                await assertListMatchesGetPost(member.session, post)
            })

            it(`GET /posts matches GET /post/:id for a Non-member`, async function() {
                await assertListMatchesGetPost(nonMember.session, post)
            })

            it(`GET /posts matches GET /post/:id for an Invited/Requested (pending) member`, async function() {
                await assertListMatchesGetPost(invited.session, post)
            })

            it(`GET /posts matches GET /post/:id for a site moderator`, async function() {
                await assertListMatchesGetPost(siteModerator.session, post)
            })

            it(`GET /posts matches GET /post/:id for a banned member`, async function() {
                try {
                    await joinOpenGroup(nonMember.session, group.id, nonMember.user.id)
                    await setGroupMemberStatus(owner.session, group.id, nonMember.user.id, 'banned')
                    await assertListMatchesGetPost(nonMember.session, post)
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

            it(`GET /posts matches GET /post/:id for a Group Admin`, async function() {
                await assertListMatchesGetPost(owner.session, post)
            })

            it(`GET /posts matches GET /post/:id for a Group Moderator`, async function() {
                await assertListMatchesGetPost(moderator.session, post)
            })

            it(`GET /posts matches GET /post/:id for a Member`, async function() {
                await assertListMatchesGetPost(member.session, post)
            })

            it(`GET /posts matches GET /post/:id for a Non-member`, async function() {
                await assertListMatchesGetPost(nonMember.session, post)
            })

            it(`GET /posts matches GET /post/:id for an Invited/Requested (pending) member`, async function() {
                await assertListMatchesGetPost(invited.session, post)
            })

            it(`GET /posts matches GET /post/:id for a site moderator`, async function() {
                await assertListMatchesGetPost(siteModerator.session, post)
            })

            it(`GET /posts matches GET /post/:id for a banned member`, async function() {
                try {
                    await addConfirmedMember(owner.session, nonMember.session, group.id, nonMember.user.id)
                    await setGroupMemberStatus(owner.session, group.id, nonMember.user.id, 'banned')
                    await assertListMatchesGetPost(nonMember.session, post)
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

            it(`GET /posts matches GET /post/:id for a Group Admin`, async function() {
                await assertListMatchesGetPost(owner.session, post)
            })

            it(`GET /posts matches GET /post/:id for a Group Moderator`, async function() {
                await assertListMatchesGetPost(moderator.session, post)
            })

            it(`GET /posts matches GET /post/:id for a Member`, async function() {
                await assertListMatchesGetPost(member.session, post)
            })

            it(`GET /posts matches GET /post/:id for a Non-member`, async function() {
                await assertListMatchesGetPost(nonMember.session, post)
            })

            it(`GET /posts matches GET /post/:id for an Invited/Requested (pending) member`, async function() {
                await assertListMatchesGetPost(invited.session, post)
            })

            it(`GET /posts matches GET /post/:id for a site moderator`, async function() {
                await assertListMatchesGetPost(siteModerator.session, post)
            })

            it(`GET /posts matches GET /post/:id for a banned member`, async function() {
                try {
                    await addConfirmedMember(owner.session, nonMember.session, group.id, nonMember.user.id)
                    await setGroupMemberStatus(owner.session, group.id, nonMember.user.id, 'banned')
                    await assertListMatchesGetPost(nonMember.session, post)
                } finally {
                    await removeGroupMember(owner.session, group.id, nonMember.user.id)
                }
            })
        })

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

                    it(`GET /posts matches GET /post/:id for a Group Admin`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(owner.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Group Moderator`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(subModerator.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(subMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Parent Group Admin`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(parentAdmin.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Parent Group Moderator`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(parentModerator.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Parent Group Member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(parentMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Non-member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(nonMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for an Invited/Requested (pending) member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(invited.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for an Invited/Requested (pending) member who is a Parent Group Member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(invitedParentMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a site moderator`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(siteModerator.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a banned subgroup member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        try {
                            await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                            await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                            await assertListMatchesGetPost(nonMember.session, post)
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

                    it(`GET /posts matches GET /post/:id for a Group Admin`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(owner.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Group Moderator`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(subModerator.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(subMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Parent Group Admin`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        // EXPECTED DIVERGENCE: GET /post/:id grants a parent admin this
                        // non-open subgroup post via moderation inheritance, but
                        // createQuery()'s visibleGroupIds subquery only grants parent
                        // *members* the '-open' types -- it never grants parent admins the
                        // private/hidden/hidden-private types.  This assertion is therefore
                        // expected to FAIL until createQuery() is reconciled with
                        // PostPermissions; surfacing that gap is the point of this suite.
                        await assertListMatchesGetPost(parentAdmin.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Parent Group Moderator`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(parentModerator.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Parent Group Member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(parentMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Non-member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(nonMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for an Invited/Requested (pending) member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(invited.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for an Invited/Requested (pending) member who is a Parent Group Member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(invitedParentMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a site moderator`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(siteModerator.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a banned subgroup member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        try {
                            await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                            await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                            await assertListMatchesGetPost(nonMember.session, post)
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

                    it(`GET /posts matches GET /post/:id for a Group Admin`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(owner.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Group Moderator`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(subModerator.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(subMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Parent Group Admin`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        // EXPECTED DIVERGENCE: GET /post/:id grants a parent admin this
                        // non-open subgroup post via moderation inheritance, but
                        // createQuery()'s visibleGroupIds subquery only grants parent
                        // *members* the '-open' types -- it never grants parent admins the
                        // private/hidden/hidden-private types.  This assertion is therefore
                        // expected to FAIL until createQuery() is reconciled with
                        // PostPermissions; surfacing that gap is the point of this suite.
                        await assertListMatchesGetPost(parentAdmin.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Parent Group Moderator`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(parentModerator.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Parent Group Member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(parentMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Non-member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(nonMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for an Invited/Requested (pending) member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(invited.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for an Invited/Requested (pending) member who is a Parent Group Member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(invitedParentMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a site moderator`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(siteModerator.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a banned subgroup member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        try {
                            await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                            await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                            await assertListMatchesGetPost(nonMember.session, post)
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

                    it(`GET /posts matches GET /post/:id for a Group Admin`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(owner.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Group Moderator`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(subModerator.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(subMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Parent Group Admin`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(parentAdmin.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Parent Group Moderator`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(parentModerator.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Parent Group Member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(parentMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Non-member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(nonMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for an Invited/Requested (pending) member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(invited.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for an Invited/Requested (pending) member who is a Parent Group Member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(invitedParentMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a site moderator`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(siteModerator.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a banned subgroup member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        try {
                            await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                            await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                            await assertListMatchesGetPost(nonMember.session, post)
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

                    it(`GET /posts matches GET /post/:id for a Group Admin`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(owner.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Group Moderator`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(subModerator.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(subMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Parent Group Admin`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        // EXPECTED DIVERGENCE: GET /post/:id grants a parent admin this
                        // non-open subgroup post via moderation inheritance, but
                        // createQuery()'s visibleGroupIds subquery only grants parent
                        // *members* the '-open' types -- it never grants parent admins the
                        // private/hidden/hidden-private types.  This assertion is therefore
                        // expected to FAIL until createQuery() is reconciled with
                        // PostPermissions; surfacing that gap is the point of this suite.
                        await assertListMatchesGetPost(parentAdmin.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Parent Group Moderator`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(parentModerator.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Parent Group Member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(parentMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Non-member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(nonMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for an Invited/Requested (pending) member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(invited.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for an Invited/Requested (pending) member who is a Parent Group Member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(invitedParentMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a site moderator`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(siteModerator.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a banned subgroup member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        try {
                            await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                            await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                            await assertListMatchesGetPost(nonMember.session, post)
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

                    it(`GET /posts matches GET /post/:id for a Group Admin`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(owner.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Group Moderator`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(subModerator.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(subMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Parent Group Admin`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        // EXPECTED DIVERGENCE: GET /post/:id grants a parent admin this
                        // non-open subgroup post via moderation inheritance, but
                        // createQuery()'s visibleGroupIds subquery only grants parent
                        // *members* the '-open' types -- it never grants parent admins the
                        // private/hidden/hidden-private types.  This assertion is therefore
                        // expected to FAIL until createQuery() is reconciled with
                        // PostPermissions; surfacing that gap is the point of this suite.
                        await assertListMatchesGetPost(parentAdmin.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Parent Group Moderator`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(parentModerator.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Parent Group Member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(parentMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Non-member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(nonMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for an Invited/Requested (pending) member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(invited.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for an Invited/Requested (pending) member who is a Parent Group Member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(invitedParentMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a site moderator`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(siteModerator.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a banned subgroup member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        try {
                            await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                            await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                            await assertListMatchesGetPost(nonMember.session, post)
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

                    it(`GET /posts matches GET /post/:id for a Group Admin`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(owner.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Group Moderator`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(subModerator.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(subMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Parent Group Admin`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(parentAdmin.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Parent Group Moderator`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(parentModerator.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Parent Group Member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(parentMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Non-member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(nonMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for an Invited/Requested (pending) member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(invited.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for an Invited/Requested (pending) member who is a Parent Group Member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(invitedParentMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a site moderator`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(siteModerator.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a banned subgroup member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        try {
                            await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                            await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                            await assertListMatchesGetPost(nonMember.session, post)
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

                    it(`GET /posts matches GET /post/:id for a Group Admin`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(owner.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Group Moderator`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(subModerator.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(subMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Parent Group Admin`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        // EXPECTED DIVERGENCE: GET /post/:id grants a parent admin this
                        // non-open subgroup post via moderation inheritance, but
                        // createQuery()'s visibleGroupIds subquery only grants parent
                        // *members* the '-open' types -- it never grants parent admins the
                        // private/hidden/hidden-private types.  This assertion is therefore
                        // expected to FAIL until createQuery() is reconciled with
                        // PostPermissions; surfacing that gap is the point of this suite.
                        await assertListMatchesGetPost(parentAdmin.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Parent Group Moderator`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(parentModerator.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Parent Group Member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(parentMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Non-member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(nonMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for an Invited/Requested (pending) member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(invited.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for an Invited/Requested (pending) member who is a Parent Group Member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(invitedParentMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a site moderator`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(siteModerator.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a banned subgroup member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        try {
                            await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                            await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                            await assertListMatchesGetPost(nonMember.session, post)
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

                    it(`GET /posts matches GET /post/:id for a Group Admin`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(owner.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Group Moderator`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(subModerator.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(subMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Parent Group Admin`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        // EXPECTED DIVERGENCE: GET /post/:id grants a parent admin this
                        // non-open subgroup post via moderation inheritance, but
                        // createQuery()'s visibleGroupIds subquery only grants parent
                        // *members* the '-open' types -- it never grants parent admins the
                        // private/hidden/hidden-private types.  This assertion is therefore
                        // expected to FAIL until createQuery() is reconciled with
                        // PostPermissions; surfacing that gap is the point of this suite.
                        await assertListMatchesGetPost(parentAdmin.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Parent Group Moderator`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(parentModerator.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Parent Group Member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(parentMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a Non-member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(nonMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for an Invited/Requested (pending) member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(invited.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for an Invited/Requested (pending) member who is a Parent Group Member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(invitedParentMember.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a site moderator`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertListMatchesGetPost(siteModerator.session, post)
                    })

                    it(`GET /posts matches GET /post/:id for a banned subgroup member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        try {
                            await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                            await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                            await assertListMatchesGetPost(nonMember.session, post)
                        } finally {
                            await removeGroupMember(owner.session, child.id, nonMember.user.id)
                        }
                    })
                })

            })

        })
    })
})
