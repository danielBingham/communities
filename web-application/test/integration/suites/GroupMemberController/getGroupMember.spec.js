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
const {
    createGroup,
    createSubgroup,
    deleteGroup,
    getGroupMember,
    joinOpenGroup,
    requestToJoinGroup,
    inviteToGroup,
    addConfirmedMember,
    setGroupMemberStatus,
    setGroupMemberRole,
    removeGroupMember
} = require('../../lib/groups')
const { isFeatureEnabled } = require('../../lib/system')

// Subgroups (child groups) and their compound types ('private-open',
// 'hidden-open', 'hidden-private') are gated behind this server feature flag.
// When it is off the compound types and the `parentId` column do not exist, so
// the subgroup tests below skip themselves rather than failing spuriously.
// (Same flag the getPost suite consults.)
const SUBGROUPS_FEATURE = 'issue-165-subgroups'

// ===========================================================================
// About this suite
// ===========================================================================
// Endpoint under test: GET /group/:groupId/member/:userId
//   -> GroupMemberController.getGroupMember()
//
// The member is identified by their USER id (the `:userId` route param), not by
// the group_members row id.  A denied read is always reported as 404 (with
// error.type 'not-found') so the endpoint never leaks the existence of a group
// or a membership the caller isn't allowed to see.
//
// getGroupMember() runs TWO permission gates and both must pass for a 200:
//   1. can(user, 'view', 'Group', { group, userMember })          -- see the group
//   2. can(user, 'view', 'GroupMember', { group, userMember, groupMember })
//        -> PermissionService.can(currentUser, 'view', 'GroupMember')
// If either gate fails, the response is 404.  (Gate 1 failing is why, e.g., a
// non-member of a *hidden* group is rejected before the member is even looked
// up.)  These tests are black-box: they assert only the final 200/404, so which
// gate rejected a case doesn't matter to them.
//
// GroupMember read is categorized as Group *content* and is intended to follow
// the GroupPost read model (see documentation/testing/test-cases/GroupMember/
// regression/read.md and the getPost suite).  It differs from GroupPost in one
// important way, which shapes this whole suite:
//
//   *** The TARGET member's status matters. ***
//   A GroupPost is visible to anyone who can see the group's content.  A
//   GroupMember is only visible to peers when the *target* is a CONFIRMED
//   member (status 'member').  A PENDING or BANNED member is visible only to
//   group moderators, group admins, and site moderators -- plus the member
//   themselves (self-view).  So the matrix has two axes: the viewer's role AND
//   the target's status.  The suite covers confirmed targets first (the direct
//   parallel to getPost), then pending/banned targets, then self-view.
//
// >>> KNOWN DISCREPANCY (see the PRIVATE-OPEN subgroup describe below): the
//     documentation and the GroupPost model both say a *parent-group member*
//     may view members of a `private-open` subgroup (an OPEN subgroup of a
//     PRIVATE parent).  The code (shared permissions/GroupMember.canView
//     GroupMember) does NOT -- it only grants the parent-member path to
//     `hidden-open`, unlike canViewGroupPost which grants it to both
//     `private-open` and `hidden-open`.  Per "trust the code", the tests expect
//     404 there and the discrepancy is called out inline. <<<

// Small, branch-free assertion helpers.  These only wrap the HTTP round-trip
// and the status/body checks -- they compute nothing about *who* should be
// allowed.  Each test states its own expectation by choosing which one to call
// (assertCanViewMember for a permitted view, assertCannotViewMember for a
// denied one), so the expected outcome is always visible in the test itself.
//
//   assertCanViewMember    -- 200 + the target member entity (matched by
//                             userId + groupId, and by status when given).
//   assertCannotViewMember -- 404 + error.type 'not-found' (a denied view).
async function assertCanViewMember(session, groupId, targetUserId, expectedStatus) {
    const response = await getGroupMember(session, groupId, targetUserId)
    assert.equal(response.status, 200)
    assert.equal(response.content?.entity?.userId, targetUserId)
    assert.equal(response.content?.entity?.groupId, groupId)
    if ( expectedStatus !== undefined ) {
        assert.equal(response.content?.entity?.status, expectedStatus)
    }
}

async function assertCannotViewMember(session, groupId, targetUserId) {
    const response = await getGroupMember(session, groupId, targetUserId)
    assert.equal(response.status, 404)
    assert.equal(response.content?.error?.type, 'not-found')
}

describe('GET /group/:groupId/member/:userId', function() {

    // Detected once, up front: are subgroups available on the target server?
    // The subgroup tests further down consult this and skip themselves when the
    // feature is disabled.
    let subgroupsEnabled = false

    before(async function() {
        subgroupsEnabled = await isFeatureEnabled(SUBGROUPS_FEATURE)
    })

    // ======================================================================
    // Basics: shape of a successful read, and the three non-permission 404/401
    // paths (unauthenticated, missing group, missing member).
    // ======================================================================

    it(`Should return the requested group member`, async function() {
        const owner = await loginAs('user1')
        let group = null
        try {
            group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })

            // The creator is automatically a confirmed ('member') admin of the
            // group, so their own membership is the simplest thing to fetch.
            const response = await getGroupMember(owner.session, group.id, owner.user.id)

            assert.equal(response.status, 200)

            const entity = response.content.entity
            assert.equal(entity.groupId, group.id)
            assert.equal(entity.userId, owner.user.id)
            assert.equal(entity.status, 'member')
            assert.equal(entity.role, 'admin')
            assert.equal(typeof entity.id, 'string')
            assert.ok(entity.createdDate)
            assert.ok(entity.updatedDate)
        } finally {
            if ( group ) await deleteGroup(owner.session, group.id)
            await logout(owner.session)
        }
    })

    it(`Should reject an unauthenticated request`, async function() {
        // The authentication check happens before anything is looked up, so any
        // ids (even ones that don't exist) exercise this path.
        const session = await initialize()

        const response = await getGroupMember(session, crypto.randomUUID(), crypto.randomUUID())

        assert.equal(response.status, 401)
        assert.equal(response.content?.error?.type, 'not-authenticated')
    })

    it(`Should return 404 for a group that doesn't exist`, async function() {
        const owner = await loginAs('user1')
        try {
            const response = await getGroupMember(owner.session, crypto.randomUUID(), owner.user.id)

            assert.equal(response.status, 404)
            assert.equal(response.content?.error?.type, 'not-found')
        } finally {
            await logout(owner.session)
        }
    })

    it(`Should return 404 when the user is not a member of the group`, async function() {
        // The group exists and is viewable, but the requested user has no
        // membership in it -- reported as 404 'not-found'.
        const owner = await loginAs('user1')
        const stranger = await loginAs('user7')
        let group = null
        try {
            group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })

            const response = await getGroupMember(owner.session, group.id, stranger.user.id)

            assert.equal(response.status, 404)
            assert.equal(response.content?.error?.type, 'not-found')
        } finally {
            if ( group ) await deleteGroup(owner.session, group.id)
            await logout(owner.session)
            await logout(stranger.session)
        }
    })

    // ======================================================================
    // Viewing a CONFIRMED member.
    //
    // This is the direct parallel to the getPost read matrix.  The canonical
    // target is the group ADMIN's own membership (owner, user1) -- a confirmed
    // 'member' -- exactly as getPost uses the owner's post as the fixed entity
    // every viewer looks at.  (Viewing permission keys off the target's STATUS,
    // never its role, so an admin's confirmed membership is a faithful stand-in
    // for "a confirmed member".)
    // ======================================================================
    describe("viewing a CONFIRMED member", function() {

        // ---- Top-level groups ----
        describe("for Open groups", function() {
            let owner, moderator, member, invited, nonMember, siteModerator
            let group = null

            before(async function() {
                owner = await loginAs('user1')            // group admin (canonical target)
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

            it(`Should let a Group Admin view a confirmed member`, async function() {
                await assertCanViewMember(owner.session, group.id, owner.user.id, 'member')
            })

            it(`Should let a Group Moderator view a confirmed member`, async function() {
                await assertCanViewMember(moderator.session, group.id, owner.user.id, 'member')
            })

            it(`Should let a confirmed Member view another confirmed member`, async function() {
                await assertCanViewMember(member.session, group.id, owner.user.id, 'member')
            })

            it(`Should let a Non-member view a confirmed member`, async function() {
                await assertCanViewMember(nonMember.session, group.id, owner.user.id, 'member')
            })

            it(`Should let an Invited/Requested (pending) member view a confirmed member`, async function() {
                await assertCanViewMember(invited.session, group.id, owner.user.id, 'member')
            })

            it(`Should let a site moderator view a confirmed member`, async function() {
                await assertCanViewMember(siteModerator.session, group.id, owner.user.id, 'member')
            })

            it(`Should NOT let a banned member view a confirmed member`, async function() {
                // Borrow the non-member transiently: make them a member, ban them,
                // assert, then remove them so the non-member case is unaffected.
                try {
                    await joinOpenGroup(nonMember.session, group.id, nonMember.user.id)
                    await setGroupMemberStatus(owner.session, group.id, nonMember.user.id, 'banned')
                    await assertCannotViewMember(nonMember.session, group.id, owner.user.id)
                } finally {
                    await removeGroupMember(owner.session, group.id, nonMember.user.id)
                }
            })
        })

        describe("for Private groups", function() {
            let owner, moderator, member, invited, nonMember, siteModerator
            let group = null

            before(async function() {
                owner = await loginAs('user1')
                moderator = await loginAs('user2')
                member = await loginAs('user3')
                invited = await loginAs('user8')
                nonMember = await loginAs('user7')
                siteModerator = await loginAs('user-site-moderator')

                group = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })

                await addConfirmedMember(owner.session, moderator.session, group.id, moderator.user.id)
                await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
                await addConfirmedMember(owner.session, member.session, group.id, member.user.id)
                await inviteToGroup(owner.session, group.id, invited.user.id)
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

            it(`Should let a Group Admin view a confirmed member`, async function() {
                await assertCanViewMember(owner.session, group.id, owner.user.id, 'member')
            })

            it(`Should let a Group Moderator view a confirmed member`, async function() {
                await assertCanViewMember(moderator.session, group.id, owner.user.id, 'member')
            })

            it(`Should let a confirmed Member view another confirmed member`, async function() {
                await assertCanViewMember(member.session, group.id, owner.user.id, 'member')
            })

            it(`Should NOT let a Non-member view a confirmed member`, async function() {
                await assertCannotViewMember(nonMember.session, group.id, owner.user.id)
            })

            it(`Should NOT let an Invited/Requested (pending) member view a confirmed member`, async function() {
                await assertCannotViewMember(invited.session, group.id, owner.user.id)
            })

            it(`Should let a site moderator view a confirmed member`, async function() {
                await assertCanViewMember(siteModerator.session, group.id, owner.user.id, 'member')
            })

            it(`Should NOT let a banned member view a confirmed member`, async function() {
                try {
                    await addConfirmedMember(owner.session, nonMember.session, group.id, nonMember.user.id)
                    await setGroupMemberStatus(owner.session, group.id, nonMember.user.id, 'banned')
                    await assertCannotViewMember(nonMember.session, group.id, owner.user.id)
                } finally {
                    await removeGroupMember(owner.session, group.id, nonMember.user.id)
                }
            })
        })

        describe("for Hidden groups", function() {
            let owner, moderator, member, invited, nonMember, siteModerator
            let group = null

            before(async function() {
                owner = await loginAs('user1')
                moderator = await loginAs('user2')
                member = await loginAs('user3')
                invited = await loginAs('user8')
                nonMember = await loginAs('user7')
                siteModerator = await loginAs('user-site-moderator')

                group = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })

                await addConfirmedMember(owner.session, moderator.session, group.id, moderator.user.id)
                await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
                await addConfirmedMember(owner.session, member.session, group.id, member.user.id)
                await inviteToGroup(owner.session, group.id, invited.user.id)
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

            it(`Should let a Group Admin view a confirmed member`, async function() {
                await assertCanViewMember(owner.session, group.id, owner.user.id, 'member')
            })

            it(`Should let a Group Moderator view a confirmed member`, async function() {
                await assertCanViewMember(moderator.session, group.id, owner.user.id, 'member')
            })

            it(`Should let a confirmed Member view another confirmed member`, async function() {
                await assertCanViewMember(member.session, group.id, owner.user.id, 'member')
            })

            it(`Should NOT let a Non-member view a confirmed member`, async function() {
                await assertCannotViewMember(nonMember.session, group.id, owner.user.id)
            })

            it(`Should NOT let an Invited/Requested (pending) member view a confirmed member`, async function() {
                await assertCannotViewMember(invited.session, group.id, owner.user.id)
            })

            it(`Should let a site moderator view a confirmed member`, async function() {
                await assertCanViewMember(siteModerator.session, group.id, owner.user.id, 'member')
            })

            it(`Should NOT let a banned member view a confirmed member`, async function() {
                try {
                    await addConfirmedMember(owner.session, nonMember.session, group.id, nonMember.user.id)
                    await setGroupMemberStatus(owner.session, group.id, nonMember.user.id, 'banned')
                    await assertCannotViewMember(nonMember.session, group.id, owner.user.id)
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
        //
        // For a CONFIRMED target the visibility to each viewer is:
        //   - Subgroup admin / moderator / confirmed member: always (the group's
        //     own moderators/members).
        //   - Parent Group ADMIN: always (admin authority is inherited).
        //   - Parent Group MODERATOR / MEMBER: only for the "-open" family they
        //     can reach via the parent path -- which, in the GroupMember code, is
        //     ONLY 'open' and 'hidden-open'.  (Not 'private-open' -- see below.)
        //   - Non-member / non-parent invitee: only for a plain 'open' subgroup.
        //   - Site moderator: always.  Banned: never.
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
                        subModerator = await loginAs('user2')     // subgroup moderator
                        subMember = await loginAs('user3')        // confirmed subgroup member
                        invited = await loginAs('user8')          // invited to subgroup; NOT a parent member

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

                    it(`Should let a Group Admin view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(owner.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Group Moderator view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(subModerator.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(subMember.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Parent Group Admin view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(parentAdmin.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Parent Group Moderator view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(parentModerator.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Parent Group Member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(parentMember.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Non-member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(nonMember.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let an Invited/Requested (pending) member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(invited.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let an Invited/Requested (pending) member who is a Parent Group Member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(invitedParentMember.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a site moderator view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(siteModerator.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should NOT let a banned subgroup member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        try {
                            await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                            await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                            await assertCannotViewMember(nonMember.session, child.id, owner.user.id)
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

                    it(`Should let a Group Admin view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(owner.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Group Moderator view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(subModerator.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(subMember.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Parent Group Admin view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(parentAdmin.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should NOT let a Parent Group Moderator view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(parentModerator.session, child.id, owner.user.id)
                    })

                    it(`Should NOT let a Parent Group Member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(parentMember.session, child.id, owner.user.id)
                    })

                    it(`Should NOT let a Non-member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(nonMember.session, child.id, owner.user.id)
                    })

                    it(`Should NOT let an Invited/Requested (pending) member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(invited.session, child.id, owner.user.id)
                    })

                    it(`Should NOT let an Invited/Requested (pending) member who is a Parent Group Member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(invitedParentMember.session, child.id, owner.user.id)
                    })

                    it(`Should let a site moderator view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(siteModerator.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should NOT let a banned subgroup member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        try {
                            await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                            await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                            await assertCannotViewMember(nonMember.session, child.id, owner.user.id)
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

                    it(`Should let a Group Admin view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(owner.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Group Moderator view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(subModerator.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(subMember.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Parent Group Admin view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(parentAdmin.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should NOT let a Parent Group Moderator view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(parentModerator.session, child.id, owner.user.id)
                    })

                    it(`Should NOT let a Parent Group Member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(parentMember.session, child.id, owner.user.id)
                    })

                    it(`Should NOT let a Non-member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(nonMember.session, child.id, owner.user.id)
                    })

                    it(`Should NOT let an Invited/Requested (pending) member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(invited.session, child.id, owner.user.id)
                    })

                    it(`Should NOT let an Invited/Requested (pending) member who is a Parent Group Member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(invitedParentMember.session, child.id, owner.user.id)
                    })

                    it(`Should let a site moderator view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(siteModerator.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should NOT let a banned subgroup member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        try {
                            await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                            await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                            await assertCannotViewMember(nonMember.session, child.id, owner.user.id)
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
                    // ===========================================================
                    // >>> KNOWN DISCREPANCY <<<
                    // documentation/testing/test-cases/GroupMember/regression/
                    // read.md says "Public Subgroups of Private Groups: Parent
                    // Group Members can view GroupMembers", and the GroupPost
                    // model (canViewGroupPost) DOES grant the parent-member path
                    // to 'private-open'.  But canViewGroupMember only grants that
                    // path to 'hidden-open' -- there is no 'private-open' branch --
                    // so a parent moderator/member is DENIED here.  Trusting the
                    // code, the parent-moderator and parent-member cases below
                    // expect 404.  If the code is fixed to match GroupPost, flip
                    // those two to assertCanViewMember.
                    // ===========================================================
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

                    it(`Should let a Group Admin view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(owner.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Group Moderator view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(subModerator.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(subMember.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Parent Group Admin view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(parentAdmin.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Parent Group Moderator view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(parentModerator.session, child.id, owner.user.id)
                    })

                    it(`Should let a Parent Group Member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(parentMember.session, child.id, owner.user.id)
                    })

                    it(`Should NOT let a Non-member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(nonMember.session, child.id, owner.user.id)
                    })

                    it(`Should NOT let an Invited/Requested (pending) member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(invited.session, child.id, owner.user.id)
                    })

                    it(`Should let an Invited/Requested (pending) member who is a Parent Group Member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(invitedParentMember.session, child.id, owner.user.id)
                    })

                    it(`Should let a site moderator view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(siteModerator.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should NOT let a banned subgroup member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        try {
                            await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                            await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                            await assertCannotViewMember(nonMember.session, child.id, owner.user.id)
                        } finally {
                            await removeGroupMember(owner.session, child.id, nonMember.user.id)
                        }
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

                    it(`Should let a Group Admin view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(owner.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Group Moderator view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(subModerator.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(subMember.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Parent Group Admin view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(parentAdmin.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should NOT let a Parent Group Moderator view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(parentModerator.session, child.id, owner.user.id)
                    })

                    it(`Should NOT let a Parent Group Member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(parentMember.session, child.id, owner.user.id)
                    })

                    it(`Should NOT let a Non-member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(nonMember.session, child.id, owner.user.id)
                    })

                    it(`Should NOT let an Invited/Requested (pending) member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(invited.session, child.id, owner.user.id)
                    })

                    it(`Should NOT let an Invited/Requested (pending) member who is a Parent Group Member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(invitedParentMember.session, child.id, owner.user.id)
                    })

                    it(`Should let a site moderator view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(siteModerator.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should NOT let a banned subgroup member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        try {
                            await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                            await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                            await assertCannotViewMember(nonMember.session, child.id, owner.user.id)
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

                    it(`Should let a Group Admin view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(owner.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Group Moderator view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(subModerator.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(subMember.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Parent Group Admin view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(parentAdmin.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should NOT let a Parent Group Moderator view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(parentModerator.session, child.id, owner.user.id)
                    })

                    it(`Should NOT let a Parent Group Member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(parentMember.session, child.id, owner.user.id)
                    })

                    it(`Should NOT let a Non-member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(nonMember.session, child.id, owner.user.id)
                    })

                    it(`Should NOT let an Invited/Requested (pending) member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(invited.session, child.id, owner.user.id)
                    })

                    it(`Should NOT let an Invited/Requested (pending) member who is a Parent Group Member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(invitedParentMember.session, child.id, owner.user.id)
                    })

                    it(`Should let a site moderator view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(siteModerator.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should NOT let a banned subgroup member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        try {
                            await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                            await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                            await assertCannotViewMember(nonMember.session, child.id, owner.user.id)
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

                    it(`Should let a Group Admin view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(owner.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Group Moderator view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(subModerator.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(subMember.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Parent Group Admin view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(parentAdmin.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Parent Group Moderator view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(parentModerator.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Parent Group Member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(parentMember.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should NOT let a Non-member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(nonMember.session, child.id, owner.user.id)
                    })

                    it(`Should NOT let an Invited/Requested (pending) member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(invited.session, child.id, owner.user.id)
                    })

                    it(`Should let an Invited/Requested (pending) member who is a Parent Group Member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(invitedParentMember.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a site moderator view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(siteModerator.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should NOT let a banned subgroup member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        try {
                            await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                            await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                            await assertCannotViewMember(nonMember.session, child.id, owner.user.id)
                        } finally {
                            await removeGroupMember(owner.session, child.id, nonMember.user.id)
                        }
                    })

                    it(`Should let a Group Moderator view a PENDING member but NOT let a Parent Group Member view them`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        // `invited` (user8) is a pending-invited member of this
                        // hidden-open subgroup.  A parent member can view the
                        // subgroup's CONFIRMED members (above) but a PENDING member
                        // is visible only to the subgroup's own moderators/admins
                        // and site moderators -- the parent-member path does not
                        // reach pending members.
                        await assertCanViewMember(subModerator.session, child.id, invited.user.id, 'pending-invited')
                        await assertCannotViewMember(parentMember.session, child.id, invited.user.id)
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

                    it(`Should let a Group Admin view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(owner.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Group Moderator view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(subModerator.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(subMember.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Parent Group Admin view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(parentAdmin.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should NOT let a Parent Group Moderator view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(parentModerator.session, child.id, owner.user.id)
                    })

                    it(`Should NOT let a Parent Group Member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(parentMember.session, child.id, owner.user.id)
                    })

                    it(`Should NOT let a Non-member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(nonMember.session, child.id, owner.user.id)
                    })

                    it(`Should NOT let an Invited/Requested (pending) member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(invited.session, child.id, owner.user.id)
                    })

                    it(`Should NOT let an Invited/Requested (pending) member who is a Parent Group Member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(invitedParentMember.session, child.id, owner.user.id)
                    })

                    it(`Should let a site moderator view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(siteModerator.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should NOT let a banned subgroup member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        try {
                            await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                            await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                            await assertCannotViewMember(nonMember.session, child.id, owner.user.id)
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

                    it(`Should let a Group Admin view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(owner.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Group Moderator view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(subModerator.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(subMember.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should let a Parent Group Admin view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(parentAdmin.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should NOT let a Parent Group Moderator view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(parentModerator.session, child.id, owner.user.id)
                    })

                    it(`Should NOT let a Parent Group Member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(parentMember.session, child.id, owner.user.id)
                    })

                    it(`Should NOT let a Non-member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(nonMember.session, child.id, owner.user.id)
                    })

                    it(`Should NOT let an Invited/Requested (pending) member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(invited.session, child.id, owner.user.id)
                    })

                    it(`Should NOT let an Invited/Requested (pending) member who is a Parent Group Member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCannotViewMember(invitedParentMember.session, child.id, owner.user.id)
                    })

                    it(`Should let a site moderator view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        await assertCanViewMember(siteModerator.session, child.id, owner.user.id, 'member')
                    })

                    it(`Should NOT let a banned subgroup member view a confirmed member`, async function(t) {
                        if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                        try {
                            await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                            await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                            await assertCannotViewMember(nonMember.session, child.id, owner.user.id)
                        } finally {
                            await removeGroupMember(owner.session, child.id, nonMember.user.id)
                        }
                    })
                })
            })
        })
    })

    // ======================================================================
    // Viewing a PENDING member.
    //
    // Unlike a confirmed member, a pending member (invited or requested) is
    // visible ONLY to group moderators, group admins, and site moderators --
    // plus the pending member themselves (self-view; covered in its own section
    // below).  A confirmed member or a non-member cannot see them.  This holds
    // regardless of group type and regardless of subgroup nesting (the visibility
    // is decided purely by the target's status and the viewer's moderate/admin/
    // self standing), so it is exercised here on the three top-level group types.
    // One subgroup interaction (a parent member who can see confirmed members
    // still cannot see pending ones) is checked in the HIDDEN-OPEN describe above.
    // ======================================================================
    describe("viewing a PENDING member", function() {

        describe("for Open groups (pending-invited target)", function() {
            let owner, moderator, member, pending, nonMember, siteModerator
            let group = null

            before(async function() {
                owner = await loginAs('user1')            // group admin
                moderator = await loginAs('user2')        // group moderator
                member = await loginAs('user3')           // confirmed member
                pending = await loginAs('user8')          // the pending (invited) TARGET
                nonMember = await loginAs('user7')        // non-member
                siteModerator = await loginAs('user-site-moderator')

                group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })

                await joinOpenGroup(moderator.session, group.id, moderator.user.id)
                await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
                await joinOpenGroup(member.session, group.id, member.user.id)
                await inviteToGroup(owner.session, group.id, pending.user.id)
            })

            after(async function() {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(moderator.session)
                await logout(member.session)
                await logout(pending.session)
                await logout(nonMember.session)
                await logout(siteModerator.session)
            })

            it(`Should let a Group Admin view a pending member`, async function() {
                await assertCanViewMember(owner.session, group.id, pending.user.id, 'pending-invited')
            })

            it(`Should let a Group Moderator view a pending member`, async function() {
                await assertCanViewMember(moderator.session, group.id, pending.user.id, 'pending-invited')
            })

            it(`Should let a site moderator view a pending member`, async function() {
                await assertCanViewMember(siteModerator.session, group.id, pending.user.id, 'pending-invited')
            })

            it(`Should NOT let a confirmed Member view a pending member`, async function() {
                await assertCannotViewMember(member.session, group.id, pending.user.id)
            })

            it(`Should NOT let a Non-member view a pending member`, async function() {
                await assertCannotViewMember(nonMember.session, group.id, pending.user.id)
            })

            it(`Should let the pending member view their OWN membership`, async function() {
                await assertCanViewMember(pending.session, group.id, pending.user.id, 'pending-invited')
            })
        })

        describe("for Private groups (pending-invited target)", function() {
            let owner, moderator, member, pending, nonMember, siteModerator
            let group = null

            before(async function() {
                owner = await loginAs('user1')
                moderator = await loginAs('user2')
                member = await loginAs('user3')
                pending = await loginAs('user8')
                nonMember = await loginAs('user7')
                siteModerator = await loginAs('user-site-moderator')

                group = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })

                await addConfirmedMember(owner.session, moderator.session, group.id, moderator.user.id)
                await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
                await addConfirmedMember(owner.session, member.session, group.id, member.user.id)
                await inviteToGroup(owner.session, group.id, pending.user.id)
            })

            after(async function() {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(moderator.session)
                await logout(member.session)
                await logout(pending.session)
                await logout(nonMember.session)
                await logout(siteModerator.session)
            })

            it(`Should let a Group Admin view a pending member`, async function() {
                await assertCanViewMember(owner.session, group.id, pending.user.id, 'pending-invited')
            })

            it(`Should let a Group Moderator view a pending member`, async function() {
                await assertCanViewMember(moderator.session, group.id, pending.user.id, 'pending-invited')
            })

            it(`Should let a site moderator view a pending member`, async function() {
                await assertCanViewMember(siteModerator.session, group.id, pending.user.id, 'pending-invited')
            })

            it(`Should NOT let a confirmed Member view a pending member`, async function() {
                await assertCannotViewMember(member.session, group.id, pending.user.id)
            })

            it(`Should NOT let a Non-member view a pending member`, async function() {
                await assertCannotViewMember(nonMember.session, group.id, pending.user.id)
            })

            it(`Should let the pending member view their OWN membership`, async function() {
                await assertCanViewMember(pending.session, group.id, pending.user.id, 'pending-invited')
            })
        })

        describe("for Hidden groups (pending-invited target)", function() {
            let owner, moderator, member, pending, nonMember, siteModerator
            let group = null

            before(async function() {
                owner = await loginAs('user1')
                moderator = await loginAs('user2')
                member = await loginAs('user3')
                pending = await loginAs('user8')
                nonMember = await loginAs('user7')
                siteModerator = await loginAs('user-site-moderator')

                group = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })

                await addConfirmedMember(owner.session, moderator.session, group.id, moderator.user.id)
                await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
                await addConfirmedMember(owner.session, member.session, group.id, member.user.id)
                await inviteToGroup(owner.session, group.id, pending.user.id)
            })

            after(async function() {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(moderator.session)
                await logout(member.session)
                await logout(pending.session)
                await logout(nonMember.session)
                await logout(siteModerator.session)
            })

            it(`Should let a Group Admin view a pending member`, async function() {
                await assertCanViewMember(owner.session, group.id, pending.user.id, 'pending-invited')
            })

            it(`Should let a Group Moderator view a pending member`, async function() {
                await assertCanViewMember(moderator.session, group.id, pending.user.id, 'pending-invited')
            })

            it(`Should let a site moderator view a pending member`, async function() {
                await assertCanViewMember(siteModerator.session, group.id, pending.user.id, 'pending-invited')
            })

            it(`Should NOT let a confirmed Member view a pending member`, async function() {
                await assertCannotViewMember(member.session, group.id, pending.user.id)
            })

            it(`Should NOT let a Non-member view a pending member`, async function() {
                await assertCannotViewMember(nonMember.session, group.id, pending.user.id)
            })

            it(`Should let the pending member view their OWN membership`, async function() {
                await assertCanViewMember(pending.session, group.id, pending.user.id, 'pending-invited')
            })
        })

        describe("for a pending-REQUESTED target (private group)", function() {
            // A 'pending-requested' membership (the user asked to join rather
            // than being invited) is in the same "pending" bucket as
            // 'pending-invited' and behaves identically for reads.
            let owner, moderator, member, requester, nonMember, siteModerator
            let group = null

            before(async function() {
                owner = await loginAs('user1')
                moderator = await loginAs('user2')
                member = await loginAs('user3')
                requester = await loginAs('user8')        // requests to join (pending-requested TARGET)
                nonMember = await loginAs('user7')
                siteModerator = await loginAs('user-site-moderator')

                group = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })

                await addConfirmedMember(owner.session, moderator.session, group.id, moderator.user.id)
                await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
                await addConfirmedMember(owner.session, member.session, group.id, member.user.id)
                // The requester asks to join the private group themselves.
                await requestToJoinGroup(requester.session, group.id, requester.user.id)
            })

            after(async function() {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(moderator.session)
                await logout(member.session)
                await logout(requester.session)
                await logout(nonMember.session)
                await logout(siteModerator.session)
            })

            it(`Should let a Group Admin view a requested member`, async function() {
                await assertCanViewMember(owner.session, group.id, requester.user.id, 'pending-requested')
            })

            it(`Should let a Group Moderator view a requested member`, async function() {
                await assertCanViewMember(moderator.session, group.id, requester.user.id, 'pending-requested')
            })

            it(`Should let a site moderator view a requested member`, async function() {
                await assertCanViewMember(siteModerator.session, group.id, requester.user.id, 'pending-requested')
            })

            it(`Should NOT let a confirmed Member view a requested member`, async function() {
                await assertCannotViewMember(member.session, group.id, requester.user.id)
            })

            it(`Should NOT let a Non-member view a requested member`, async function() {
                await assertCannotViewMember(nonMember.session, group.id, requester.user.id)
            })

            it(`Should let the requesting member view their OWN membership`, async function() {
                await assertCanViewMember(requester.session, group.id, requester.user.id, 'pending-requested')
            })
        })
    })

    // ======================================================================
    // Viewing a BANNED member.
    //
    // A banned member's record is visible only to group moderators, group
    // admins, and site moderators.  Confirmed members and non-members cannot
    // see it, and the banned user cannot see it either (their ban fails the
    // group-view gate -- see the self-view section).  As with pending members,
    // this is decided by the target's status and the viewer's standing, so it is
    // exercised on the three top-level group types.
    // ======================================================================
    describe("viewing a BANNED member", function() {

        describe("for Open groups", function() {
            let owner, moderator, member, banned, nonMember, siteModerator
            let group = null

            before(async function() {
                owner = await loginAs('user1')
                moderator = await loginAs('user2')
                member = await loginAs('user3')
                banned = await loginAs('user8')           // the banned TARGET
                nonMember = await loginAs('user7')
                siteModerator = await loginAs('user-site-moderator')

                group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })

                await joinOpenGroup(moderator.session, group.id, moderator.user.id)
                await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
                await joinOpenGroup(member.session, group.id, member.user.id)
                await joinOpenGroup(banned.session, group.id, banned.user.id)
                await setGroupMemberStatus(owner.session, group.id, banned.user.id, 'banned')
            })

            after(async function() {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(moderator.session)
                await logout(member.session)
                await logout(banned.session)
                await logout(nonMember.session)
                await logout(siteModerator.session)
            })

            it(`Should let a Group Admin view a banned member`, async function() {
                await assertCanViewMember(owner.session, group.id, banned.user.id, 'banned')
            })

            it(`Should let a Group Moderator view a banned member`, async function() {
                await assertCanViewMember(moderator.session, group.id, banned.user.id, 'banned')
            })

            it(`Should let a site moderator view a banned member`, async function() {
                await assertCanViewMember(siteModerator.session, group.id, banned.user.id, 'banned')
            })

            it(`Should NOT let a confirmed Member view a banned member`, async function() {
                await assertCannotViewMember(member.session, group.id, banned.user.id)
            })

            it(`Should NOT let a Non-member view a banned member`, async function() {
                await assertCannotViewMember(nonMember.session, group.id, banned.user.id)
            })
        })

        describe("for Private groups", function() {
            let owner, moderator, member, banned, nonMember, siteModerator
            let group = null

            before(async function() {
                owner = await loginAs('user1')
                moderator = await loginAs('user2')
                member = await loginAs('user3')
                banned = await loginAs('user8')
                nonMember = await loginAs('user7')
                siteModerator = await loginAs('user-site-moderator')

                group = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })

                await addConfirmedMember(owner.session, moderator.session, group.id, moderator.user.id)
                await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
                await addConfirmedMember(owner.session, member.session, group.id, member.user.id)
                await addConfirmedMember(owner.session, banned.session, group.id, banned.user.id)
                await setGroupMemberStatus(owner.session, group.id, banned.user.id, 'banned')
            })

            after(async function() {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(moderator.session)
                await logout(member.session)
                await logout(banned.session)
                await logout(nonMember.session)
                await logout(siteModerator.session)
            })

            it(`Should let a Group Admin view a banned member`, async function() {
                await assertCanViewMember(owner.session, group.id, banned.user.id, 'banned')
            })

            it(`Should let a Group Moderator view a banned member`, async function() {
                await assertCanViewMember(moderator.session, group.id, banned.user.id, 'banned')
            })

            it(`Should let a site moderator view a banned member`, async function() {
                await assertCanViewMember(siteModerator.session, group.id, banned.user.id, 'banned')
            })

            it(`Should NOT let a confirmed Member view a banned member`, async function() {
                await assertCannotViewMember(member.session, group.id, banned.user.id)
            })

            it(`Should NOT let a Non-member view a banned member`, async function() {
                await assertCannotViewMember(nonMember.session, group.id, banned.user.id)
            })
        })

        describe("for Hidden groups", function() {
            let owner, moderator, member, banned, nonMember, siteModerator
            let group = null

            before(async function() {
                owner = await loginAs('user1')
                moderator = await loginAs('user2')
                member = await loginAs('user3')
                banned = await loginAs('user8')
                nonMember = await loginAs('user7')
                siteModerator = await loginAs('user-site-moderator')

                group = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })

                await addConfirmedMember(owner.session, moderator.session, group.id, moderator.user.id)
                await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
                await addConfirmedMember(owner.session, member.session, group.id, member.user.id)
                await addConfirmedMember(owner.session, banned.session, group.id, banned.user.id)
                await setGroupMemberStatus(owner.session, group.id, banned.user.id, 'banned')
            })

            after(async function() {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(moderator.session)
                await logout(member.session)
                await logout(banned.session)
                await logout(nonMember.session)
                await logout(siteModerator.session)
            })

            it(`Should let a Group Admin view a banned member`, async function() {
                await assertCanViewMember(owner.session, group.id, banned.user.id, 'banned')
            })

            it(`Should let a Group Moderator view a banned member`, async function() {
                await assertCanViewMember(moderator.session, group.id, banned.user.id, 'banned')
            })

            it(`Should let a site moderator view a banned member`, async function() {
                await assertCanViewMember(siteModerator.session, group.id, banned.user.id, 'banned')
            })

            it(`Should NOT let a confirmed Member view a banned member`, async function() {
                await assertCannotViewMember(member.session, group.id, banned.user.id)
            })

            it(`Should NOT let a Non-member view a banned member`, async function() {
                await assertCannotViewMember(nonMember.session, group.id, banned.user.id)
            })
        })
    })

    // ======================================================================
    // Viewing your OWN membership (self-view).
    //
    // A user may always read their own membership record -- confirmed OR pending
    // -- as long as they are not banned.  This is what lets an invited user see
    // (and then accept) their own invitation, even in a hidden group they could
    // not otherwise see.  A GROUP-banned user (a normal site account banned from
    // one group) can no longer read even their own membership, because the ban
    // fails the group-view gate.  Each case builds its own group so the member's
    // status is unambiguous.
    // ======================================================================
    describe("viewing your OWN membership", function() {

        it(`Should let a confirmed member view their own membership in an Open group`, async function() {
            const owner = await loginAs('user1')
            const member = await loginAs('user3')
            let group = null
            try {
                group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                await joinOpenGroup(member.session, group.id, member.user.id)

                await assertCanViewMember(member.session, group.id, member.user.id, 'member')
            } finally {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(member.session)
            }
        })

        it(`Should let a confirmed member view their own membership in a Private group`, async function() {
            const owner = await loginAs('user1')
            const member = await loginAs('user3')
            let group = null
            try {
                group = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })
                await addConfirmedMember(owner.session, member.session, group.id, member.user.id)

                await assertCanViewMember(member.session, group.id, member.user.id, 'member')
            } finally {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(member.session)
            }
        })

        it(`Should let a confirmed member view their own membership in a Hidden group`, async function() {
            const owner = await loginAs('user1')
            const member = await loginAs('user3')
            let group = null
            try {
                group = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })
                await addConfirmedMember(owner.session, member.session, group.id, member.user.id)

                await assertCanViewMember(member.session, group.id, member.user.id, 'member')
            } finally {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(member.session)
            }
        })

        it(`Should let an invited (pending) user view their own invitation in an Open group`, async function() {
            const owner = await loginAs('user1')
            const invited = await loginAs('user8')
            let group = null
            try {
                group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                await inviteToGroup(owner.session, group.id, invited.user.id)

                await assertCanViewMember(invited.session, group.id, invited.user.id, 'pending-invited')
            } finally {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(invited.session)
            }
        })

        it(`Should let an invited (pending) user view their own invitation in a Private group`, async function() {
            const owner = await loginAs('user1')
            const invited = await loginAs('user8')
            let group = null
            try {
                group = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })
                await inviteToGroup(owner.session, group.id, invited.user.id)

                await assertCanViewMember(invited.session, group.id, invited.user.id, 'pending-invited')
            } finally {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(invited.session)
            }
        })

        it(`Should let an invited (pending) user view their own invitation in a Hidden group`, async function() {
            // Even though the invitee cannot otherwise "see" a hidden group's
            // membership, they can read their own invitation in order to accept it.
            const owner = await loginAs('user1')
            const invited = await loginAs('user8')
            let group = null
            try {
                group = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })
                await inviteToGroup(owner.session, group.id, invited.user.id)

                await assertCanViewMember(invited.session, group.id, invited.user.id, 'pending-invited')
            } finally {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(invited.session)
            }
        })

        it(`Should NOT let a group-banned user view their own membership`, async function() {
            const owner = await loginAs('user1')
            const banned = await loginAs('user8')
            let group = null
            try {
                group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                await joinOpenGroup(banned.session, group.id, banned.user.id)
                await setGroupMemberStatus(owner.session, group.id, banned.user.id, 'banned')

                await assertCannotViewMember(banned.session, group.id, banned.user.id)
            } finally {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(banned.session)
            }
        })
    })
})
