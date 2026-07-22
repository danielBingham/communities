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

const { logout, loginAs } = require('../../../lib/authentication')
const { fetchEndpoint } = require('../../../lib/fetchEndpoint')
const {
    createGroup,
    createSubgroup,
    deleteGroup,
    getGroupMember,
    joinOpenGroup,
    inviteToGroup,
    addConfirmedMember,
    setGroupMemberStatus,
    setGroupMemberRole,
    removeGroupMember
} = require('../../../lib/groups')
const { isFeatureEnabled } = require('../../../lib/system')

// Subgroups (and their compound types) are gated behind this feature flag; the
// subgroup blocks skip themselves when it is off, exactly as in getPost.spec.js
// and the getPosts permissions suite.
const SUBGROUPS_FEATURE = 'issue-165-subgroups'

let subgroupsEnabled = false

// ============================================================================
// Approach
//
// GET /group/:groupId/members is the LIST endpoint for a group's membership.
// This suite mirrors the getPosts permissions suite: rather than hard-coding an
// expected roster per (group type, viewer) cell, each test asserts the ONE
// invariant that the list endpoint and the single-member endpoint must agree --
//
//     GET /group/:groupId/members includes a given member exactly when
//     GET /group/:groupId/member/:userId returns that member (200), and omits
//     it exactly when the single-GET denies it (404).
//
// getGroupMember.spec.js already pins the single-member side to the documented
// permission matrix; this suite pins the list query (GroupMemberController
// .createQuery + the `query GroupMember` gate) to that same, verified side.  A
// green run means the SQL agrees with the permission model; a red one names the
// exact (group type, viewer, target) cell where they diverge.
//
// Two axes, not one.  A GroupPost/Group list only varies by viewer.  A member
// list also varies by the TARGET member's status: a non-moderator viewer sees
// only CONFIRMED members (plus their own row), while a moderator/admin/site
// moderator sees pending and banned members too.  So the confirmed-member
// matrix below (the direct parallel to getPosts) is supplemented, on the
// top-level group types, by explicit cross-checks against a PENDING and a
// BANNED target.
//
// Self-view is deliberately NOT cross-checked here.  `query GroupMember` (can I
// see the roster?) and `view GroupMember` (can I see this one row?) legitimately
// diverge for your own pending membership: a pending invitee to a non-open group
// is denied the roster (list -> 404) yet may read their own invitation via the
// single-GET (200), so they can accept it.  That is intended, not a list/single
// disagreement, and it is already covered by getGroupMember.spec.js.  Every
// cross-check target below is therefore a member OTHER than the viewer.  (The
// canonical confirmed target is the owner's own admin membership -- the owner is
// always able to query, so owner-viewing-owner stays consistent, exactly as
// getPosts uses the owner's own post as the seeded entity.)
// ============================================================================

// Paginate the caller's entire GET /group/:groupId/members result and return
// true as soon as a membership for `userId` appears; scans every page before
// returning false.  A 404 means the caller may not query this group's
// membership at all -- they see no members, so return false.
async function listContainsMember(session, groupId, userId) {
    let page = 1
    let numberOfPages = 1
    while ( page <= numberOfPages ) {
        const response = await fetchEndpoint('GET', `/group/${encodeURIComponent(groupId)}/members?page=${page}`, { session: session })

        if ( response.status === 404 ) {
            return false
        }
        if ( ! response.ok ) {
            throw new Error(`GET /group/${groupId}/members failed on page ${page}: ${response.status} ${JSON.stringify(response.content)}`)
        }

        const content = response.content
        numberOfPages = content.meta.numberOfPages

        for ( const memberId of content.list ) {
            if ( content.dictionary[memberId]?.userId === userId ) {
                return true
            }
        }
        page = page + 1
    }
    return false
}

// The core cross-check: the bare GET /group/:groupId/members list must include
// the member identified by `userId` exactly when GET /group/:groupId/member/
// :userId returns them (200) and omit them exactly when the single-GET denies
// them (404).  Asserts createQuery() agrees with the GroupMember permission
// model for that (viewer, target) pair.
async function assertListMatchesGetMember(session, groupId, userId) {
    const single = await getGroupMember(session, groupId, userId)
    assert.ok(single.status === 200 || single.status === 404,
        `GET /group/${groupId}/member/${userId} returned unexpected status ${single.status}`)
    const singleAllows = single.status === 200

    const inList = await listContainsMember(session, groupId, userId)

    assert.equal(inList, singleAllows,
        `GET /group/${groupId}/members ${inList ? 'INCLUDED' : 'OMITTED'} member ${userId}, but `
        + `GET /group/${groupId}/member/${userId} ${singleAllows ? 'ALLOWED it (200)' : 'DENIED it (404)'} -- `
        + `the list query in GroupMemberController.createQuery() and the single-member permission model disagree.`)
}

describe('GET /group/:groupId/members', function() {

    before(async function() {
        subgroupsEnabled = await isFeatureEnabled(SUBGROUPS_FEATURE)
    })

    // A basic pagination sanity check: paginating a group's own membership adds
    // up to meta.count, and the owner's membership is present.  The permission
    // matrix below is the substance of the suite.
    it(`Should paginate the full membership of a group the caller can see`, async function() {
        const owner = await loginAs('user1')
        const member = await loginAs('user3')
        let group = null
        try {
            group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
            await joinOpenGroup(member.session, group.id, member.user.id)

            let page = 1
            let numberOfPages = 1
            let count = 0
            let metaCount = 0
            let sawOwner = false

            while ( page <= numberOfPages ) {
                const response = await fetchEndpoint('GET', `/group/${group.id}/members?page=${page}`, { session: owner.session })
                assert.equal(response.status, 200)

                const content = response.content
                numberOfPages = content.meta.numberOfPages
                metaCount = parseInt(content.meta.count, 10)

                for ( const memberId of content.list ) {
                    if ( content.dictionary[memberId].userId === owner.user.id ) {
                        sawOwner = true
                    }
                    count = count + 1
                }
                page = page + 1
            }

            assert.equal(count, metaCount)
            assert.ok(sawOwner, 'The group owner should appear in its own membership list.')
        } finally {
            if ( group ) await deleteGroup(owner.session, group.id)
            await logout(owner.session)
            await logout(member.session)
        }
    })

    // ======================================================================
    // Top-level groups.
    //
    // Canonical confirmed target = the owner's own admin membership (a
    // confirmed 'member'), exactly as getPosts seeds the owner's own post.
    // Each viewer's list-vs-single-GET agreement is checked against it, then a
    // PENDING target (the invited member) and a BANNED target are cross-checked
    // to exercise the status-based row filtering that createQuery() applies.
    // ======================================================================

    describe("for Open groups", function() {
        let owner, moderator, member, invited, bannedTarget, nonMember, siteModerator
        let group = null

        before(async function() {
            owner = await loginAs('user1')            // group admin (canonical confirmed target)
            moderator = await loginAs('user2')        // group moderator
            member = await loginAs('user3')           // confirmed member
            invited = await loginAs('user8')          // invited (pending) member -- also the PENDING target
            bannedTarget = await loginAs('user4')     // confirmed then banned -- the BANNED target
            nonMember = await loginAs('user7')        // non-member
            siteModerator = await loginAs('user-site-moderator')

            group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })

            await joinOpenGroup(moderator.session, group.id, moderator.user.id)
            await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
            await joinOpenGroup(member.session, group.id, member.user.id)
            await inviteToGroup(owner.session, group.id, invited.user.id)
            await joinOpenGroup(bannedTarget.session, group.id, bannedTarget.user.id)
            await setGroupMemberStatus(owner.session, group.id, bannedTarget.user.id, 'banned')
        })

        after(async function() {
            if ( group ) await deleteGroup(owner.session, group.id)
            await logout(owner.session)
            await logout(moderator.session)
            await logout(member.session)
            await logout(invited.session)
            await logout(bannedTarget.session)
            await logout(nonMember.session)
            await logout(siteModerator.session)
        })

        // ---- Confirmed target (the owner) ----
        it(`GET /members matches GET /member/:userId for a Group Admin`, async function() {
            await assertListMatchesGetMember(owner.session, group.id, owner.user.id)
        })

        it(`GET /members matches GET /member/:userId for a Group Moderator`, async function() {
            await assertListMatchesGetMember(moderator.session, group.id, owner.user.id)
        })

        it(`GET /members matches GET /member/:userId for a Member`, async function() {
            await assertListMatchesGetMember(member.session, group.id, owner.user.id)
        })

        it(`GET /members matches GET /member/:userId for a Non-member`, async function() {
            await assertListMatchesGetMember(nonMember.session, group.id, owner.user.id)
        })

        it(`GET /members matches GET /member/:userId for an Invited/Requested (pending) member`, async function() {
            await assertListMatchesGetMember(invited.session, group.id, owner.user.id)
        })

        it(`GET /members matches GET /member/:userId for a site moderator`, async function() {
            await assertListMatchesGetMember(siteModerator.session, group.id, owner.user.id)
        })

        it(`GET /members matches GET /member/:userId for a banned member`, async function() {
            // Borrow the non-member transiently: make them a member, ban them,
            // assert, then remove them so the non-member case is unaffected.
            try {
                await joinOpenGroup(nonMember.session, group.id, nonMember.user.id)
                await setGroupMemberStatus(owner.session, group.id, nonMember.user.id, 'banned')
                await assertListMatchesGetMember(nonMember.session, group.id, owner.user.id)
            } finally {
                await removeGroupMember(owner.session, group.id, nonMember.user.id)
            }
        })

        // ---- Pending target (the invited member) ----
        it(`GET /members matches GET /member/:userId for an Admin viewing a PENDING member`, async function() {
            await assertListMatchesGetMember(owner.session, group.id, invited.user.id)
        })

        it(`GET /members matches GET /member/:userId for a Moderator viewing a PENDING member`, async function() {
            await assertListMatchesGetMember(moderator.session, group.id, invited.user.id)
        })

        it(`GET /members matches GET /member/:userId for a Member viewing a PENDING member`, async function() {
            await assertListMatchesGetMember(member.session, group.id, invited.user.id)
        })

        it(`GET /members matches GET /member/:userId for a Non-member viewing a PENDING member`, async function() {
            await assertListMatchesGetMember(nonMember.session, group.id, invited.user.id)
        })

        it(`GET /members matches GET /member/:userId for a site moderator viewing a PENDING member`, async function() {
            await assertListMatchesGetMember(siteModerator.session, group.id, invited.user.id)
        })

        // ---- Banned target ----
        it(`GET /members matches GET /member/:userId for an Admin viewing a BANNED member`, async function() {
            await assertListMatchesGetMember(owner.session, group.id, bannedTarget.user.id)
        })

        it(`GET /members matches GET /member/:userId for a Moderator viewing a BANNED member`, async function() {
            await assertListMatchesGetMember(moderator.session, group.id, bannedTarget.user.id)
        })

        it(`GET /members matches GET /member/:userId for a Member viewing a BANNED member`, async function() {
            await assertListMatchesGetMember(member.session, group.id, bannedTarget.user.id)
        })

        it(`GET /members matches GET /member/:userId for a site moderator viewing a BANNED member`, async function() {
            await assertListMatchesGetMember(siteModerator.session, group.id, bannedTarget.user.id)
        })
    })

    describe("for Private groups", function() {
        let owner, moderator, member, invited, bannedTarget, nonMember, siteModerator
        let group = null

        before(async function() {
            owner = await loginAs('user1')
            moderator = await loginAs('user2')
            member = await loginAs('user3')
            invited = await loginAs('user8')
            bannedTarget = await loginAs('user4')
            nonMember = await loginAs('user7')
            siteModerator = await loginAs('user-site-moderator')

            group = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })

            await addConfirmedMember(owner.session, moderator.session, group.id, moderator.user.id)
            await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
            await addConfirmedMember(owner.session, member.session, group.id, member.user.id)
            await inviteToGroup(owner.session, group.id, invited.user.id)
            await addConfirmedMember(owner.session, bannedTarget.session, group.id, bannedTarget.user.id)
            await setGroupMemberStatus(owner.session, group.id, bannedTarget.user.id, 'banned')
        })

        after(async function() {
            if ( group ) await deleteGroup(owner.session, group.id)
            await logout(owner.session)
            await logout(moderator.session)
            await logout(member.session)
            await logout(invited.session)
            await logout(bannedTarget.session)
            await logout(nonMember.session)
            await logout(siteModerator.session)
        })

        // ---- Confirmed target (the owner) ----
        it(`GET /members matches GET /member/:userId for a Group Admin`, async function() {
            await assertListMatchesGetMember(owner.session, group.id, owner.user.id)
        })

        it(`GET /members matches GET /member/:userId for a Group Moderator`, async function() {
            await assertListMatchesGetMember(moderator.session, group.id, owner.user.id)
        })

        it(`GET /members matches GET /member/:userId for a Member`, async function() {
            await assertListMatchesGetMember(member.session, group.id, owner.user.id)
        })

        it(`GET /members matches GET /member/:userId for a Non-member`, async function() {
            await assertListMatchesGetMember(nonMember.session, group.id, owner.user.id)
        })

        it(`GET /members matches GET /member/:userId for an Invited/Requested (pending) member`, async function() {
            await assertListMatchesGetMember(invited.session, group.id, owner.user.id)
        })

        it(`GET /members matches GET /member/:userId for a site moderator`, async function() {
            await assertListMatchesGetMember(siteModerator.session, group.id, owner.user.id)
        })

        it(`GET /members matches GET /member/:userId for a banned member`, async function() {
            try {
                await addConfirmedMember(owner.session, nonMember.session, group.id, nonMember.user.id)
                await setGroupMemberStatus(owner.session, group.id, nonMember.user.id, 'banned')
                await assertListMatchesGetMember(nonMember.session, group.id, owner.user.id)
            } finally {
                await removeGroupMember(owner.session, group.id, nonMember.user.id)
            }
        })

        // ---- Pending target (the invited member) ----
        it(`GET /members matches GET /member/:userId for an Admin viewing a PENDING member`, async function() {
            await assertListMatchesGetMember(owner.session, group.id, invited.user.id)
        })

        it(`GET /members matches GET /member/:userId for a Moderator viewing a PENDING member`, async function() {
            await assertListMatchesGetMember(moderator.session, group.id, invited.user.id)
        })

        it(`GET /members matches GET /member/:userId for a Member viewing a PENDING member`, async function() {
            await assertListMatchesGetMember(member.session, group.id, invited.user.id)
        })

        it(`GET /members matches GET /member/:userId for a Non-member viewing a PENDING member`, async function() {
            await assertListMatchesGetMember(nonMember.session, group.id, invited.user.id)
        })

        it(`GET /members matches GET /member/:userId for a site moderator viewing a PENDING member`, async function() {
            await assertListMatchesGetMember(siteModerator.session, group.id, invited.user.id)
        })

        // ---- Banned target ----
        it(`GET /members matches GET /member/:userId for an Admin viewing a BANNED member`, async function() {
            await assertListMatchesGetMember(owner.session, group.id, bannedTarget.user.id)
        })

        it(`GET /members matches GET /member/:userId for a Moderator viewing a BANNED member`, async function() {
            await assertListMatchesGetMember(moderator.session, group.id, bannedTarget.user.id)
        })

        it(`GET /members matches GET /member/:userId for a Member viewing a BANNED member`, async function() {
            await assertListMatchesGetMember(member.session, group.id, bannedTarget.user.id)
        })

        it(`GET /members matches GET /member/:userId for a site moderator viewing a BANNED member`, async function() {
            await assertListMatchesGetMember(siteModerator.session, group.id, bannedTarget.user.id)
        })
    })

    describe("for Hidden groups", function() {
        let owner, moderator, member, invited, bannedTarget, nonMember, siteModerator
        let group = null

        before(async function() {
            owner = await loginAs('user1')
            moderator = await loginAs('user2')
            member = await loginAs('user3')
            invited = await loginAs('user8')
            bannedTarget = await loginAs('user4')
            nonMember = await loginAs('user7')
            siteModerator = await loginAs('user-site-moderator')

            group = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })

            await addConfirmedMember(owner.session, moderator.session, group.id, moderator.user.id)
            await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
            await addConfirmedMember(owner.session, member.session, group.id, member.user.id)
            await inviteToGroup(owner.session, group.id, invited.user.id)
            await addConfirmedMember(owner.session, bannedTarget.session, group.id, bannedTarget.user.id)
            await setGroupMemberStatus(owner.session, group.id, bannedTarget.user.id, 'banned')
        })

        after(async function() {
            if ( group ) await deleteGroup(owner.session, group.id)
            await logout(owner.session)
            await logout(moderator.session)
            await logout(member.session)
            await logout(invited.session)
            await logout(bannedTarget.session)
            await logout(nonMember.session)
            await logout(siteModerator.session)
        })

        // ---- Confirmed target (the owner) ----
        it(`GET /members matches GET /member/:userId for a Group Admin`, async function() {
            await assertListMatchesGetMember(owner.session, group.id, owner.user.id)
        })

        it(`GET /members matches GET /member/:userId for a Group Moderator`, async function() {
            await assertListMatchesGetMember(moderator.session, group.id, owner.user.id)
        })

        it(`GET /members matches GET /member/:userId for a Member`, async function() {
            await assertListMatchesGetMember(member.session, group.id, owner.user.id)
        })

        it(`GET /members matches GET /member/:userId for a Non-member`, async function() {
            await assertListMatchesGetMember(nonMember.session, group.id, owner.user.id)
        })

        it(`GET /members matches GET /member/:userId for an Invited/Requested (pending) member`, async function() {
            await assertListMatchesGetMember(invited.session, group.id, owner.user.id)
        })

        it(`GET /members matches GET /member/:userId for a site moderator`, async function() {
            await assertListMatchesGetMember(siteModerator.session, group.id, owner.user.id)
        })

        it(`GET /members matches GET /member/:userId for a banned member`, async function() {
            try {
                await addConfirmedMember(owner.session, nonMember.session, group.id, nonMember.user.id)
                await setGroupMemberStatus(owner.session, group.id, nonMember.user.id, 'banned')
                await assertListMatchesGetMember(nonMember.session, group.id, owner.user.id)
            } finally {
                await removeGroupMember(owner.session, group.id, nonMember.user.id)
            }
        })

        // ---- Pending target (the invited member) ----
        it(`GET /members matches GET /member/:userId for an Admin viewing a PENDING member`, async function() {
            await assertListMatchesGetMember(owner.session, group.id, invited.user.id)
        })

        it(`GET /members matches GET /member/:userId for a Moderator viewing a PENDING member`, async function() {
            await assertListMatchesGetMember(moderator.session, group.id, invited.user.id)
        })

        it(`GET /members matches GET /member/:userId for a Member viewing a PENDING member`, async function() {
            await assertListMatchesGetMember(member.session, group.id, invited.user.id)
        })

        it(`GET /members matches GET /member/:userId for a Non-member viewing a PENDING member`, async function() {
            await assertListMatchesGetMember(nonMember.session, group.id, invited.user.id)
        })

        it(`GET /members matches GET /member/:userId for a site moderator viewing a PENDING member`, async function() {
            await assertListMatchesGetMember(siteModerator.session, group.id, invited.user.id)
        })

        // ---- Banned target ----
        it(`GET /members matches GET /member/:userId for an Admin viewing a BANNED member`, async function() {
            await assertListMatchesGetMember(owner.session, group.id, bannedTarget.user.id)
        })

        it(`GET /members matches GET /member/:userId for a Moderator viewing a BANNED member`, async function() {
            await assertListMatchesGetMember(moderator.session, group.id, bannedTarget.user.id)
        })

        it(`GET /members matches GET /member/:userId for a Member viewing a BANNED member`, async function() {
            await assertListMatchesGetMember(member.session, group.id, bannedTarget.user.id)
        })

        it(`GET /members matches GET /member/:userId for a site moderator viewing a BANNED member`, async function() {
            await assertListMatchesGetMember(siteModerator.session, group.id, bannedTarget.user.id)
        })
    })

    // ======================================================================
    // Subgroups.  Target = the owner's confirmed membership in the child -- the
    // direct parallel to the getPosts subgroup matrix.  Stored `type` per
    // (parent, child):
    //   PUBLIC parent:  open->'open'          private->'private'        hidden->'hidden'
    //   PRIVATE parent: open->'private-open'  private->'private'        hidden->'hidden'
    //   HIDDEN parent:  open->'hidden-open'   private->'hidden-private' hidden->'hidden'
    //
    // For a confirmed target, parent admins can always see the member
    // (moderation is inherited); parent moderators and parent members can see it
    // for the '-open' family they reach via the parent path -- 'open',
    // 'private-open', and 'hidden-open'.  'private-open' is included here because
    // the fix that added the 'private-open' branch to canViewGroupMember brought
    // the single-member endpoint into line with the list query (createQuery +
    // the 'query GroupMember' gate already granted parent members that path), so
    // the two now agree.  These cross-checks are what would flag it if they ever
    // drift apart again.
    describe("For Subgroups", function() {

        describe("For subgroups of Public groups", function() {
            let owner, parentAdmin, parentModerator, parentMember, invitedParentMember, nonMember, siteModerator
            let parent = null

            before(async function() {
                if ( ! subgroupsEnabled ) return
                owner = await loginAs('user1')                    // admin of every group (canonical target)
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

                before(async function() {
                    if ( ! subgroupsEnabled ) return
                    subModerator = await loginAs('user2')
                    subMember = await loginAs('user3')
                    invited = await loginAs('user8')

                    child = await createSubgroup(owner.session, parent.id, 'open')

                    await addConfirmedMember(owner.session, subModerator.session, child.id, subModerator.user.id)
                    await setGroupMemberRole(owner.session, child.id, subModerator.user.id, 'moderator')
                    await addConfirmedMember(owner.session, subMember.session, child.id, subMember.user.id)

                    await inviteToGroup(owner.session, child.id, invited.user.id)
                    await inviteToGroup(owner.session, child.id, invitedParentMember.user.id)
                })

                after(async function() {
                    if ( ! subgroupsEnabled ) return
                    if ( child ) await deleteGroup(owner.session, child.id)
                    await logout(subModerator.session)
                    await logout(subMember.session)
                    await logout(invited.session)
                })

                it(`GET /members matches GET /member/:userId for a Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(owner.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(subModerator.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(subMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Parent Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(parentAdmin.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Parent Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(parentModerator.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(parentMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Non-member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(nonMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for an Invited/Requested (pending) member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(invited.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for an Invited/Requested (pending) member who is a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(invitedParentMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a site moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(siteModerator.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a banned subgroup member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    try {
                        await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                        await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                        await assertListMatchesGetMember(nonMember.session, child.id, owner.user.id)
                    } finally {
                        await removeGroupMember(owner.session, child.id, nonMember.user.id)
                    }
                })
            })

            describe("For a PRIVATE subgroup of a PUBLIC group", function() {
                let subModerator, subMember, invited
                let child = null

                before(async function() {
                    if ( ! subgroupsEnabled ) return
                    subModerator = await loginAs('user2')
                    subMember = await loginAs('user3')
                    invited = await loginAs('user8')

                    child = await createSubgroup(owner.session, parent.id, 'private')

                    await addConfirmedMember(owner.session, subModerator.session, child.id, subModerator.user.id)
                    await setGroupMemberRole(owner.session, child.id, subModerator.user.id, 'moderator')
                    await addConfirmedMember(owner.session, subMember.session, child.id, subMember.user.id)

                    await inviteToGroup(owner.session, child.id, invited.user.id)
                    await inviteToGroup(owner.session, child.id, invitedParentMember.user.id)
                })

                after(async function() {
                    if ( ! subgroupsEnabled ) return
                    if ( child ) await deleteGroup(owner.session, child.id)
                    await logout(subModerator.session)
                    await logout(subMember.session)
                    await logout(invited.session)
                })

                it(`GET /members matches GET /member/:userId for a Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(owner.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(subModerator.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(subMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Parent Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(parentAdmin.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Parent Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(parentModerator.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(parentMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Non-member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(nonMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for an Invited/Requested (pending) member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(invited.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for an Invited/Requested (pending) member who is a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(invitedParentMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a site moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(siteModerator.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a banned subgroup member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    try {
                        await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                        await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                        await assertListMatchesGetMember(nonMember.session, child.id, owner.user.id)
                    } finally {
                        await removeGroupMember(owner.session, child.id, nonMember.user.id)
                    }
                })
            })

            describe("For a HIDDEN subgroup of a PUBLIC group", function() {
                let subModerator, subMember, invited
                let child = null

                before(async function() {
                    if ( ! subgroupsEnabled ) return
                    subModerator = await loginAs('user2')
                    subMember = await loginAs('user3')
                    invited = await loginAs('user8')

                    child = await createSubgroup(owner.session, parent.id, 'hidden')

                    await addConfirmedMember(owner.session, subModerator.session, child.id, subModerator.user.id)
                    await setGroupMemberRole(owner.session, child.id, subModerator.user.id, 'moderator')
                    await addConfirmedMember(owner.session, subMember.session, child.id, subMember.user.id)

                    await inviteToGroup(owner.session, child.id, invited.user.id)
                    await inviteToGroup(owner.session, child.id, invitedParentMember.user.id)
                })

                after(async function() {
                    if ( ! subgroupsEnabled ) return
                    if ( child ) await deleteGroup(owner.session, child.id)
                    await logout(subModerator.session)
                    await logout(subMember.session)
                    await logout(invited.session)
                })

                it(`GET /members matches GET /member/:userId for a Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(owner.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(subModerator.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(subMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Parent Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(parentAdmin.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Parent Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(parentModerator.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(parentMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Non-member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(nonMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for an Invited/Requested (pending) member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(invited.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for an Invited/Requested (pending) member who is a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(invitedParentMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a site moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(siteModerator.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a banned subgroup member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    try {
                        await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                        await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                        await assertListMatchesGetMember(nonMember.session, child.id, owner.user.id)
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
                owner = await loginAs('user1')
                parentAdmin = await loginAs('user4')
                parentModerator = await loginAs('user5')
                parentMember = await loginAs('user6')
                invitedParentMember = await loginAs('user9')
                nonMember = await loginAs('user7')
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
                // This is the cell the discrepancy fix touched.  A parent
                // moderator/member can now view the subgroup's CONFIRMED members
                // via the single-member endpoint, which already matched what the
                // list query returned -- so list and single-GET agree here now.
                let subModerator, subMember, invited
                let child = null

                before(async function() {
                    if ( ! subgroupsEnabled ) return
                    subModerator = await loginAs('user2')
                    subMember = await loginAs('user3')
                    invited = await loginAs('user8')

                    child = await createSubgroup(owner.session, parent.id, 'private-open')

                    await addConfirmedMember(owner.session, subModerator.session, child.id, subModerator.user.id)
                    await setGroupMemberRole(owner.session, child.id, subModerator.user.id, 'moderator')
                    await addConfirmedMember(owner.session, subMember.session, child.id, subMember.user.id)

                    await inviteToGroup(owner.session, child.id, invited.user.id)
                    await inviteToGroup(owner.session, child.id, invitedParentMember.user.id)
                })

                after(async function() {
                    if ( ! subgroupsEnabled ) return
                    if ( child ) await deleteGroup(owner.session, child.id)
                    await logout(subModerator.session)
                    await logout(subMember.session)
                    await logout(invited.session)
                })

                it(`GET /members matches GET /member/:userId for a Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(owner.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(subModerator.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(subMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Parent Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(parentAdmin.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Parent Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(parentModerator.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(parentMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Non-member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(nonMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for an Invited/Requested (pending) member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(invited.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for an Invited/Requested (pending) member who is a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(invitedParentMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a site moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(siteModerator.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a banned subgroup member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    try {
                        await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                        await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                        await assertListMatchesGetMember(nonMember.session, child.id, owner.user.id)
                    } finally {
                        await removeGroupMember(owner.session, child.id, nonMember.user.id)
                    }
                })

                // A parent member can now see this subgroup's CONFIRMED members,
                // but must still NOT see its PENDING ones -- and the list must
                // agree with the single-member endpoint on that.
                it(`GET /members matches GET /member/:userId for a Parent Group Member viewing a PENDING member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(parentMember.session, child.id, invited.user.id)
                })
            })

            describe("For a PRIVATE subgroup of a PRIVATE group", function() {
                let subModerator, subMember, invited
                let child = null

                before(async function() {
                    if ( ! subgroupsEnabled ) return
                    subModerator = await loginAs('user2')
                    subMember = await loginAs('user3')
                    invited = await loginAs('user8')

                    child = await createSubgroup(owner.session, parent.id, 'private')

                    await addConfirmedMember(owner.session, subModerator.session, child.id, subModerator.user.id)
                    await setGroupMemberRole(owner.session, child.id, subModerator.user.id, 'moderator')
                    await addConfirmedMember(owner.session, subMember.session, child.id, subMember.user.id)

                    await inviteToGroup(owner.session, child.id, invited.user.id)
                    await inviteToGroup(owner.session, child.id, invitedParentMember.user.id)
                })

                after(async function() {
                    if ( ! subgroupsEnabled ) return
                    if ( child ) await deleteGroup(owner.session, child.id)
                    await logout(subModerator.session)
                    await logout(subMember.session)
                    await logout(invited.session)
                })

                it(`GET /members matches GET /member/:userId for a Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(owner.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(subModerator.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(subMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Parent Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(parentAdmin.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Parent Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(parentModerator.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(parentMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Non-member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(nonMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for an Invited/Requested (pending) member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(invited.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for an Invited/Requested (pending) member who is a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(invitedParentMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a site moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(siteModerator.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a banned subgroup member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    try {
                        await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                        await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                        await assertListMatchesGetMember(nonMember.session, child.id, owner.user.id)
                    } finally {
                        await removeGroupMember(owner.session, child.id, nonMember.user.id)
                    }
                })
            })

            describe("For a HIDDEN subgroup of a PRIVATE group", function() {
                let subModerator, subMember, invited
                let child = null

                before(async function() {
                    if ( ! subgroupsEnabled ) return
                    subModerator = await loginAs('user2')
                    subMember = await loginAs('user3')
                    invited = await loginAs('user8')

                    child = await createSubgroup(owner.session, parent.id, 'hidden')

                    await addConfirmedMember(owner.session, subModerator.session, child.id, subModerator.user.id)
                    await setGroupMemberRole(owner.session, child.id, subModerator.user.id, 'moderator')
                    await addConfirmedMember(owner.session, subMember.session, child.id, subMember.user.id)

                    await inviteToGroup(owner.session, child.id, invited.user.id)
                    await inviteToGroup(owner.session, child.id, invitedParentMember.user.id)
                })

                after(async function() {
                    if ( ! subgroupsEnabled ) return
                    if ( child ) await deleteGroup(owner.session, child.id)
                    await logout(subModerator.session)
                    await logout(subMember.session)
                    await logout(invited.session)
                })

                it(`GET /members matches GET /member/:userId for a Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(owner.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(subModerator.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(subMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Parent Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(parentAdmin.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Parent Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(parentModerator.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(parentMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Non-member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(nonMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for an Invited/Requested (pending) member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(invited.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for an Invited/Requested (pending) member who is a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(invitedParentMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a site moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(siteModerator.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a banned subgroup member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    try {
                        await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                        await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                        await assertListMatchesGetMember(nonMember.session, child.id, owner.user.id)
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
                owner = await loginAs('user1')
                parentAdmin = await loginAs('user4')
                parentModerator = await loginAs('user5')
                parentMember = await loginAs('user6')
                invitedParentMember = await loginAs('user9')
                nonMember = await loginAs('user7')
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

                before(async function() {
                    if ( ! subgroupsEnabled ) return
                    subModerator = await loginAs('user2')
                    subMember = await loginAs('user3')
                    invited = await loginAs('user8')

                    child = await createSubgroup(owner.session, parent.id, 'hidden-open')

                    await addConfirmedMember(owner.session, subModerator.session, child.id, subModerator.user.id)
                    await setGroupMemberRole(owner.session, child.id, subModerator.user.id, 'moderator')
                    await addConfirmedMember(owner.session, subMember.session, child.id, subMember.user.id)

                    await inviteToGroup(owner.session, child.id, invited.user.id)
                    await inviteToGroup(owner.session, child.id, invitedParentMember.user.id)
                })

                after(async function() {
                    if ( ! subgroupsEnabled ) return
                    if ( child ) await deleteGroup(owner.session, child.id)
                    await logout(subModerator.session)
                    await logout(subMember.session)
                    await logout(invited.session)
                })

                it(`GET /members matches GET /member/:userId for a Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(owner.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(subModerator.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(subMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Parent Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(parentAdmin.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Parent Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(parentModerator.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(parentMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Non-member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(nonMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for an Invited/Requested (pending) member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(invited.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for an Invited/Requested (pending) member who is a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(invitedParentMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a site moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(siteModerator.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a banned subgroup member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    try {
                        await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                        await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                        await assertListMatchesGetMember(nonMember.session, child.id, owner.user.id)
                    } finally {
                        await removeGroupMember(owner.session, child.id, nonMember.user.id)
                    }
                })

                // Parent members can see this subgroup's CONFIRMED members but not
                // its PENDING ones; the list must agree with the single-member
                // endpoint on that.
                it(`GET /members matches GET /member/:userId for a Parent Group Member viewing a PENDING member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(parentMember.session, child.id, invited.user.id)
                })
            })

            describe("For a PRIVATE subgroup of a HIDDEN group (HIDDEN-PRIVATE)", function() {
                let subModerator, subMember, invited
                let child = null

                before(async function() {
                    if ( ! subgroupsEnabled ) return
                    subModerator = await loginAs('user2')
                    subMember = await loginAs('user3')
                    invited = await loginAs('user8')

                    child = await createSubgroup(owner.session, parent.id, 'hidden-private')

                    await addConfirmedMember(owner.session, subModerator.session, child.id, subModerator.user.id)
                    await setGroupMemberRole(owner.session, child.id, subModerator.user.id, 'moderator')
                    await addConfirmedMember(owner.session, subMember.session, child.id, subMember.user.id)

                    await inviteToGroup(owner.session, child.id, invited.user.id)
                    await inviteToGroup(owner.session, child.id, invitedParentMember.user.id)
                })

                after(async function() {
                    if ( ! subgroupsEnabled ) return
                    if ( child ) await deleteGroup(owner.session, child.id)
                    await logout(subModerator.session)
                    await logout(subMember.session)
                    await logout(invited.session)
                })

                it(`GET /members matches GET /member/:userId for a Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(owner.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(subModerator.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(subMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Parent Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(parentAdmin.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Parent Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(parentModerator.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(parentMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Non-member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(nonMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for an Invited/Requested (pending) member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(invited.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for an Invited/Requested (pending) member who is a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(invitedParentMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a site moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(siteModerator.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a banned subgroup member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    try {
                        await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                        await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                        await assertListMatchesGetMember(nonMember.session, child.id, owner.user.id)
                    } finally {
                        await removeGroupMember(owner.session, child.id, nonMember.user.id)
                    }
                })
            })

            describe("For a HIDDEN subgroup of a HIDDEN group", function() {
                let subModerator, subMember, invited
                let child = null

                before(async function() {
                    if ( ! subgroupsEnabled ) return
                    subModerator = await loginAs('user2')
                    subMember = await loginAs('user3')
                    invited = await loginAs('user8')

                    child = await createSubgroup(owner.session, parent.id, 'hidden')

                    await addConfirmedMember(owner.session, subModerator.session, child.id, subModerator.user.id)
                    await setGroupMemberRole(owner.session, child.id, subModerator.user.id, 'moderator')
                    await addConfirmedMember(owner.session, subMember.session, child.id, subMember.user.id)

                    await inviteToGroup(owner.session, child.id, invited.user.id)
                    await inviteToGroup(owner.session, child.id, invitedParentMember.user.id)
                })

                after(async function() {
                    if ( ! subgroupsEnabled ) return
                    if ( child ) await deleteGroup(owner.session, child.id)
                    await logout(subModerator.session)
                    await logout(subMember.session)
                    await logout(invited.session)
                })

                it(`GET /members matches GET /member/:userId for a Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(owner.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(subModerator.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(subMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Parent Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(parentAdmin.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Parent Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(parentModerator.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(parentMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a Non-member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(nonMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for an Invited/Requested (pending) member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(invited.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for an Invited/Requested (pending) member who is a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(invitedParentMember.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a site moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetMember(siteModerator.session, child.id, owner.user.id)
                })

                it(`GET /members matches GET /member/:userId for a banned subgroup member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    try {
                        await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                        await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                        await assertListMatchesGetMember(nonMember.session, child.id, owner.user.id)
                    } finally {
                        await removeGroupMember(owner.session, child.id, nonMember.user.id)
                    }
                })
            })
        })
    })
})
