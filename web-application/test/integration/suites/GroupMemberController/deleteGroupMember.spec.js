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
const crypto = require('node:crypto')

const { initialize, logout, loginAs } = require('../../lib/authentication')
const { fetchEndpoint } = require('../../lib/fetchEndpoint')
const {
    createGroup,
    createSubgroup,
    deleteGroup,
    getGroupMember,
    inviteToGroup,
    requestToJoinGroup,
    addConfirmedMember,
    setGroupMemberStatus,
    setGroupMemberRole
} = require('../../lib/groups')
const { isFeatureEnabled } = require('../../lib/system')

const SUBGROUPS_FEATURE = 'issue-165-subgroups'
let subgroupsEnabled = false

// ============================================================================
// DELETE /group/:groupId/member/:userId drives
// GroupMemberController.deleteGroupMember(), which runs, IN ORDER:
//
//   1. authentication                                  -> 401 not-authenticated
//   2. group exists                                    -> 404 not-found
//   3. the GroupMember being removed exists            -> 404 not-found
//   4. PermissionService.can('view','Group')           -> 404 not-found
//   5. PermissionService.can('delete','GroupMember')   -> 403 not-authorized
//   6. last-admin guard (only when the target's role is 'admin')
//                                                      -> 403 not-authorized
//   7. delete the row, drop the group subscription, and drop post
//      subscriptions if the removed user can no longer view group content
//   8.                                                 -> 200 { entity, relations }
//
// There is no request body, so ValidationService is not involved at all -- this
// endpoint is almost entirely permission surface, which is where the bulk of
// this suite sits.
//
// Errors are ControllerError, serialized as { error: { type, message } }.
// Note that steps 5 and 6 BOTH answer 403 not-authorized; they are told apart
// by the message, so the last-admin tests assert on it explicitly.
//
// Success is 200 (not the 201 that POST/PATCH -- and DELETE /post/:id -- use),
// and the body echoes the row as it was immediately before deletion.
//
// ---------------------------------------------------------------------------
// The permission decision, canDeleteGroupMember, is the same shape as
// canUpdateGroupMember: authority is decided by the TARGET row's role.
//
//   * the actor's own membership is banned            -> deny
//   * target role is 'member'    and actor can moderate -> allow
//   * target role is 'moderator' and actor can admin    -> allow
//   * the actor is the target (leaving/declining)       -> allow
//   * otherwise                                          -> deny
//
// Two consequences drive several tests below:
//
//  * Nothing matches a target whose role is 'admin' except the self clause, so
//    no one can remove another admin -- not a fellow group admin, not a parent
//    admin, not a site moderator.  An admin can only be removed by themselves,
//    which is exactly what the last-admin guard then constrains.
//  * The view gate runs BEFORE the delete gate, and canViewGroup rejects banned
//    members before it allows open/private groups.  So a banned actor always
//    gets 404, and a non-member of a hidden group gets 404, while a non-member
//    of an open or private group gets 403.
// ============================================================================

async function sendDelete(session, groupId, userId) {
    return await fetchEndpoint(
        'DELETE',
        `/group/${encodeURIComponent(groupId)}/member/${encodeURIComponent(userId)}`,
        { session: session }
    )
}

async function assertRemoved(session, groupId, userId, expected = {}) {
    const response = await sendDelete(session, groupId, userId)
    assert.equal(response.status, 200, `Expected 200 but got ${response.status}: ${JSON.stringify(response.content)}`)

    // The response echoes the row as it stood immediately before deletion.
    const entity = response.content?.entity
    assert.ok(entity, 'Expected the removed GroupMember entity in the response, but received none.')
    assert.equal(entity.groupId, groupId)
    assert.equal(entity.userId, userId)
    if ( expected.status !== undefined ) {
        assert.equal(entity.status, expected.status, `Expected removed member status '${expected.status}', got '${entity.status}'.`)
    }
    if ( expected.role !== undefined ) {
        assert.equal(entity.role, expected.role, `Expected removed member role '${expected.role}', got '${entity.role}'.`)
    }
    return entity
}

// Confirm the row really is gone, read back through a session that is still
// able to query the group.
async function assertGone(verifierSession, groupId, userId) {
    const check = await getGroupMember(verifierSession, groupId, userId)
    assert.equal(check.status, 404,
        `GroupMember(${groupId}, ${userId}) was still retrievable after being deleted (got ${check.status}).`)
}

async function assertForbidden(session, groupId, userId) {
    const response = await sendDelete(session, groupId, userId)
    assert.equal(response.status, 403, `Expected 403 not-authorized but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.equal(response.content?.error?.type, 'not-authorized')
}

async function assertNotFound(session, groupId, userId) {
    const response = await sendDelete(session, groupId, userId)
    assert.equal(response.status, 404, `Expected 404 not-found but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.equal(response.content?.error?.type, 'not-found')
}

async function assertUnauthenticated(session, groupId, userId) {
    const response = await sendDelete(session, groupId, userId)
    assert.equal(response.status, 401)
    assert.equal(response.content?.error?.type, 'not-authenticated')
}

describe('DELETE /group/:groupId/member/:userId', function() {

    before(async function() {
        subgroupsEnabled = await isFeatureEnabled(SUBGROUPS_FEATURE)
    })

    // ======================================================================
    // The checks that run before any permission logic.
    // ======================================================================
    describe("authentication and existence", function() {
        let owner, member, nonMember
        let group = null

        before(async function() {
            owner = await loginAs('user1')
            member = await loginAs('user3')
            nonMember = await loginAs('user8')

            group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
            await addConfirmedMember(owner.session, member.session, group.id, member.user.id)
        })

        after(async function() {
            if ( group ) await deleteGroup(owner.session, group.id)
            await logout(owner.session)
            await logout(member.session)
            await logout(nonMember.session)
        })

        it(`Should reject an unauthenticated request with 401`, async function() {
            const session = await initialize()
            await assertUnauthenticated(session, group.id, member.user.id)
        })

        it(`Should return 404 for a group that doesn't exist`, async function() {
            await assertNotFound(owner.session, crypto.randomUUID(), member.user.id)
        })

        it(`Should return 404 for a userId that isn't a member of the group`, async function() {
            await assertNotFound(owner.session, group.id, crypto.randomUUID())
        })

        it(`Should return 404 for a real user who is not a member of the group`, async function() {
            await assertNotFound(owner.session, group.id, nonMember.user.id)
        })

        // BUG (failing test) -- copy/paste of the PATCH handler's message.
        //
        // When the target membership doesn't exist, deleteGroupMember() throws
        // a 404 whose public message reads "You can't PATCH a GroupMember that
        // doesn't exist."  That string is returned to the client verbatim as
        // error.message, so a user removing a member sees a message about
        // PATCH.  (The log line above it has the same problem -- it says
        // "attempting to patch a non-existent GroupMember".)  Cosmetic, but
        // user-facing and clearly unintended.
        it(`Should not describe a failed DELETE as a failed PATCH`, async function() {
            const response = await sendDelete(owner.session, group.id, crypto.randomUUID())
            assert.equal(response.status, 404)
            assert.ok(
                ! /PATCH/i.test(response.content?.error?.message || ''),
                `The 404 message for DELETE should not mention PATCH, got: ${JSON.stringify(response.content?.error?.message)}`)
        })

        // BUG (failing test) -- unhandled malformed input.
        //
        // The member lookup compares the raw route parameter against the uuid
        // column `group_members.user_id`, so a non-UUID userId is expected to
        // raise a Postgres type error and surface as a 500.  There is no
        // validation layer on this endpoint to catch it first.  A userId that
        // cannot identify any membership should simply be 404 not-found, the
        // same as a well-formed userId with no row.
        it(`Should return 404 for a malformed (non-UUID) userId`, { skip: 'KNOWN BUG: we are not validating the groupId before passing it to the database, so a malformed UUID 500s instead of 400.' }, async function() {
            await assertNotFound(owner.session, group.id, 'not-a-uuid')
        })
    })

    // ======================================================================
    // PERMISSION MODEL.
    //
    // Denials are listed before removals inside each block so that the
    // non-mutating cases all run against the fully populated group.
    // ======================================================================
    describe("permission model", function() {

        describe("for Open groups", function() {
            let owner, secondAdmin, moderator, moderator2, member, member2, pendingInvitee, banned, nonMember, siteModerator
            let group = null

            before(async function() {
                owner = await loginAs('user1')            // group admin
                secondAdmin = await loginAs('user6')      // a second admin (an admin-role target)
                moderator = await loginAs('user2')        // moderator
                moderator2 = await loginAs('user5')       // a second moderator (a moderator-role target)
                member = await loginAs('user3')           // confirmed member
                member2 = await loginAs('user8')          // confirmed member, later leaves
                pendingInvitee = await loginAs('user9')   // invited, never accepted
                banned = await loginAs('user4')           // confirmed then banned
                nonMember = await loginAs('user7')        // not in the group
                siteModerator = await loginAs('user-site-moderator')

                group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })

                await addConfirmedMember(owner.session, secondAdmin.session, group.id, secondAdmin.user.id)
                await setGroupMemberRole(owner.session, group.id, secondAdmin.user.id, 'admin')
                await addConfirmedMember(owner.session, moderator.session, group.id, moderator.user.id)
                await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
                await addConfirmedMember(owner.session, moderator2.session, group.id, moderator2.user.id)
                await setGroupMemberRole(owner.session, group.id, moderator2.user.id, 'moderator')
                await addConfirmedMember(owner.session, member.session, group.id, member.user.id)
                await addConfirmedMember(owner.session, member2.session, group.id, member2.user.id)
                await inviteToGroup(owner.session, group.id, pendingInvitee.user.id)
                await addConfirmedMember(owner.session, banned.session, group.id, banned.user.id)
                await setGroupMemberStatus(owner.session, group.id, banned.user.id, 'banned')
            })

            after(async function() {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(secondAdmin.session)
                await logout(moderator.session)
                await logout(moderator2.session)
                await logout(member.session)
                await logout(member2.session)
                await logout(pendingInvitee.session)
                await logout(banned.session)
                await logout(nonMember.session)
                await logout(siteModerator.session)
            })

            // ---- denials ----
            it(`Should NOT let a Group Moderator remove another moderator (403)`, async function() {
                await assertForbidden(moderator.session, group.id, moderator2.user.id)
            })

            it(`Should NOT let a Group Moderator remove an admin (403)`, async function() {
                await assertForbidden(moderator.session, group.id, owner.user.id)
            })

            // The delete gate rejects this before the last-admin guard is ever
            // consulted -- hence the generic message rather than the last-admin one.
            it(`Should NOT let a Group Admin remove another admin (403)`, async function() {
                await assertForbidden(owner.session, group.id, secondAdmin.user.id)
            })

            it(`Should NOT let a site moderator remove an admin (403)`, async function() {
                await assertForbidden(siteModerator.session, group.id, secondAdmin.user.id)
            })

            it(`Should NOT let a plain Member remove another member (403)`, async function() {
                await assertForbidden(member.session, group.id, member2.user.id)
            })

            it(`Should NOT let a pending invitee remove another member (403)`, async function() {
                await assertForbidden(pendingInvitee.session, group.id, member2.user.id)
            })

            it(`Should NOT let a plain Member remove a moderator (403)`, async function() {
                await assertForbidden(member.session, group.id, moderator2.user.id)
            })

            it(`Should NOT let a non-member remove a member (403)`, async function() {
                await assertForbidden(nonMember.session, group.id, member2.user.id)
            })

            it(`Should NOT let a non-member remove an admin (403)`, async function() {
                await assertForbidden(nonMember.session, group.id, owner.user.id)
            })

            it(`Should NOT let a banned member remove another member (404 -- fails the view gate)`, async function() {
                await assertNotFound(banned.session, group.id, member2.user.id)
            })

            it(`Should NOT let a banned member remove themselves (404 -- fails the view gate)`, async function() {
                await assertNotFound(banned.session, group.id, banned.user.id)
            })

            // ---- removals ----
            it(`Should let a Group Moderator remove a member`, async function() {
                await assertRemoved(moderator.session, group.id, member.user.id, { status: 'member', role: 'member' })
                await assertGone(owner.session, group.id, member.user.id)
            })

            it(`Should let a Group Admin remove a moderator`, async function() {
                await assertRemoved(owner.session, group.id, moderator2.user.id, { status: 'member', role: 'moderator' })
                await assertGone(owner.session, group.id, moderator2.user.id)
            })

            it(`Should let a member remove themselves (leave the group)`, async function() {
                await assertRemoved(member2.session, group.id, member2.user.id, { status: 'member', role: 'member' })
                await assertGone(owner.session, group.id, member2.user.id)
            })

            it(`Should let a site moderator remove a member`, async function() {
                await assertRemoved(siteModerator.session, group.id, pendingInvitee.user.id, { role: 'member' })
                await assertGone(owner.session, group.id, pendingInvitee.user.id)
            })

            it(`Should let a Group Moderator remove a banned member`, async function() {
                await assertRemoved(moderator.session, group.id, banned.user.id, { status: 'banned', role: 'member' })
                await assertGone(owner.session, group.id, banned.user.id)
            })

            it(`Should let a moderator remove themselves (leave the group)`, async function() {
                await assertRemoved(moderator.session, group.id, moderator.user.id, { status: 'member', role: 'moderator' })
                await assertGone(owner.session, group.id, moderator.user.id)
            })
        })

        describe("for Private groups", function() {
            let owner, moderator, member, member2, member3, nonMember
            let group = null

            before(async function() {
                owner = await loginAs('user1')
                moderator = await loginAs('user2')
                member = await loginAs('user3')
                member2 = await loginAs('user8')
                member3 = await loginAs('user9')
                nonMember = await loginAs('user7')

                group = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })
                await addConfirmedMember(owner.session, moderator.session, group.id, moderator.user.id)
                await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
                await addConfirmedMember(owner.session, member.session, group.id, member.user.id)
                await addConfirmedMember(owner.session, member2.session, group.id, member2.user.id)
                await addConfirmedMember(owner.session, member3.session, group.id, member3.user.id)
            })

            after(async function() {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(moderator.session)
                await logout(member.session)
                await logout(member2.session)
                await logout(member3.session)
                await logout(nonMember.session)
            })

            // A private group is visible to everyone, so a non-member clears the
            // view gate and is stopped by the delete gate: 403, not 404.
            it(`Should NOT let a non-member remove a member (403, not 404)`, async function() {
                await assertForbidden(nonMember.session, group.id, member2.user.id)
            })

            it(`Should let a Group Moderator remove a member`, async function() {
                await assertRemoved(moderator.session, group.id, member.user.id, { status: 'member', role: 'member' })
                await assertGone(owner.session, group.id, member.user.id)
            })

            it(`Should let a Group Admin remove a member`, async function() {
                await assertRemoved(owner.session, group.id, member3.user.id, { status: 'member', role: 'member' })
                await assertGone(owner.session, group.id, member3.user.id)
            })

            it(`Should let a member remove themselves`, async function() {
                await assertRemoved(member2.session, group.id, member2.user.id, { status: 'member', role: 'member' })
                await assertGone(owner.session, group.id, member2.user.id)
            })
        })

        describe("for Hidden groups", function() {
            let owner, moderator, member, member2, invitee, nonMember
            let group = null

            before(async function() {
                owner = await loginAs('user1')
                moderator = await loginAs('user2')
                member = await loginAs('user3')
                member2 = await loginAs('user8')
                invitee = await loginAs('user9')
                nonMember = await loginAs('user7')

                group = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })
                await addConfirmedMember(owner.session, moderator.session, group.id, moderator.user.id)
                await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
                await addConfirmedMember(owner.session, member.session, group.id, member.user.id)
                await addConfirmedMember(owner.session, member2.session, group.id, member2.user.id)
                await inviteToGroup(owner.session, group.id, invitee.user.id)
            })

            after(async function() {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(moderator.session)
                await logout(member.session)
                await logout(member2.session)
                await logout(invitee.session)
                await logout(nonMember.session)
            })

            // A hidden group is invisible to non-members, so the view gate fires
            // first: 404, not 403.
            it(`Should NOT let a non-member remove a member (404, not 403)`, async function() {
                await assertNotFound(nonMember.session, group.id, member2.user.id)
            })

            it(`Should let a Group Moderator remove a member`, async function() {
                await assertRemoved(moderator.session, group.id, member.user.id, { status: 'member', role: 'member' })
                await assertGone(owner.session, group.id, member.user.id)
            })

            it(`Should let a member remove themselves`, async function() {
                await assertRemoved(member2.session, group.id, member2.user.id, { status: 'member', role: 'member' })
                await assertGone(owner.session, group.id, member2.user.id)
            })

            // An invitee can see a hidden group they were invited to, so they can
            // decline by removing their own pending row.
            it(`Should let a pending invitee decline by removing their own row`, async function() {
                await assertRemoved(invitee.session, group.id, invitee.user.id, { status: 'pending-invited', role: 'member' })
                await assertGone(owner.session, group.id, invitee.user.id)
            })
        })

        describe("for Subgroups", function() {
            let owner, parentAdmin, parentModerator, parentMember, childMember, childMember2, childModerator, nonMember
            let parent = null, child = null, hiddenParent = null, hiddenOpenChild = null

            before(async function() {
                if ( ! subgroupsEnabled ) return
                owner = await loginAs('user1')
                parentAdmin = await loginAs('user4')        // admin of the parent only
                parentModerator = await loginAs('user5')    // moderator of the parent only
                parentMember = await loginAs('user6')       // member of the parent only
                childMember = await loginAs('user3')
                childMember2 = await loginAs('user8')
                childModerator = await loginAs('user9')     // moderator of the child only
                nonMember = await loginAs('user7')

                parent = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                await addConfirmedMember(owner.session, parentAdmin.session, parent.id, parentAdmin.user.id)
                await setGroupMemberRole(owner.session, parent.id, parentAdmin.user.id, 'admin')
                await addConfirmedMember(owner.session, parentModerator.session, parent.id, parentModerator.user.id)
                await setGroupMemberRole(owner.session, parent.id, parentModerator.user.id, 'moderator')
                await addConfirmedMember(owner.session, parentMember.session, parent.id, parentMember.user.id)

                child = await createSubgroup(owner.session, parent.id, 'private')
                await addConfirmedMember(owner.session, childMember.session, child.id, childMember.user.id)
                await addConfirmedMember(owner.session, childMember2.session, child.id, childMember2.user.id)
                await addConfirmedMember(owner.session, childModerator.session, child.id, childModerator.user.id)
                await setGroupMemberRole(owner.session, child.id, childModerator.user.id, 'moderator')

                // A hidden-open child, to check the view gate for an outsider.
                hiddenParent = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })
                hiddenOpenChild = await createSubgroup(owner.session, hiddenParent.id, 'hidden-open')
                await addConfirmedMember(owner.session, childMember.session, hiddenOpenChild.id, childMember.user.id)
            })

            after(async function() {
                if ( ! subgroupsEnabled ) return
                if ( hiddenOpenChild ) await deleteGroup(owner.session, hiddenOpenChild.id)
                if ( hiddenParent ) await deleteGroup(owner.session, hiddenParent.id)
                if ( child ) await deleteGroup(owner.session, child.id)
                if ( parent ) await deleteGroup(owner.session, parent.id)
                await logout(owner.session)
                await logout(parentAdmin.session)
                await logout(parentModerator.session)
                await logout(parentMember.session)
                await logout(childMember.session)
                await logout(childMember2.session)
                await logout(childModerator.session)
                await logout(nonMember.session)
            })

            // Parent MODERATORS and members do not inherit anything.
            it(`Should NOT let a Parent Group Moderator remove a child member (403)`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertForbidden(parentModerator.session, child.id, childMember2.user.id)
            })

            it(`Should NOT let a Parent Group Member remove a child member (403)`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertForbidden(parentMember.session, child.id, childMember2.user.id)
            })

            it(`Should NOT let an outsider remove a member of a HIDDEN-OPEN subgroup (404)`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertNotFound(nonMember.session, hiddenOpenChild.id, childMember.user.id)
            })

            // A parent admin still cannot reach an admin-role row -- the child's
            // own admin is out of reach for exactly the same reason a fellow group
            // admin is.
            it(`Should NOT let a Parent Group Admin remove the child's admin (403)`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertForbidden(parentAdmin.session, child.id, owner.user.id)
            })

            // Parent ADMINS inherit admin/moderate on child groups.
            it(`Should let a Parent Group Admin remove a child member`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertRemoved(parentAdmin.session, child.id, childMember.user.id, { status: 'member', role: 'member' })
                await assertGone(owner.session, child.id, childMember.user.id)
            })

            it(`Should let a child Group Moderator remove a child member`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertRemoved(childModerator.session, child.id, childMember2.user.id, { status: 'member', role: 'member' })
                await assertGone(owner.session, child.id, childMember2.user.id)
            })

            it(`Should let a Parent Group Admin remove a child moderator`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertRemoved(parentAdmin.session, child.id, childModerator.user.id, { status: 'member', role: 'moderator' })
                await assertGone(owner.session, child.id, childModerator.user.id)
            })
        })
    })

    // ======================================================================
    // Leaving the compound subgroup types.  The top-level types are covered by
    // the per-type blocks above; these three only exist as subgroups, and their
    // view gates differ (hidden-open / hidden-private are reachable only via the
    // parent), so self-removal is checked for each.
    // ======================================================================
    describe("self-removal from compound subgroup types", function() {
        let owner, leaver
        let privateParent = null, hiddenParent = null
        let privateOpenChild = null, hiddenOpenChild = null, hiddenPrivateChild = null

        before(async function() {
            if ( ! subgroupsEnabled ) return
            owner = await loginAs('user1')
            leaver = await loginAs('user3')

            privateParent = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })
            privateOpenChild = await createSubgroup(owner.session, privateParent.id, 'private-open')
            await addConfirmedMember(owner.session, leaver.session, privateOpenChild.id, leaver.user.id)

            hiddenParent = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })
            hiddenOpenChild = await createSubgroup(owner.session, hiddenParent.id, 'hidden-open')
            await addConfirmedMember(owner.session, leaver.session, hiddenOpenChild.id, leaver.user.id)
            hiddenPrivateChild = await createSubgroup(owner.session, hiddenParent.id, 'hidden-private')
            await addConfirmedMember(owner.session, leaver.session, hiddenPrivateChild.id, leaver.user.id)
        })

        after(async function() {
            if ( ! subgroupsEnabled ) return
            if ( privateOpenChild ) await deleteGroup(owner.session, privateOpenChild.id)
            if ( hiddenOpenChild ) await deleteGroup(owner.session, hiddenOpenChild.id)
            if ( hiddenPrivateChild ) await deleteGroup(owner.session, hiddenPrivateChild.id)
            if ( privateParent ) await deleteGroup(owner.session, privateParent.id)
            if ( hiddenParent ) await deleteGroup(owner.session, hiddenParent.id)
            await logout(owner.session)
            await logout(leaver.session)
        })

        it(`Should let a member leave a PRIVATE-OPEN subgroup`, async function(t) {
            if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
            await assertRemoved(leaver.session, privateOpenChild.id, leaver.user.id, { status: 'member', role: 'member' })
            await assertGone(owner.session, privateOpenChild.id, leaver.user.id)
        })

        it(`Should let a member leave a HIDDEN-OPEN subgroup`, async function(t) {
            if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
            await assertRemoved(leaver.session, hiddenOpenChild.id, leaver.user.id, { status: 'member', role: 'member' })
            await assertGone(owner.session, hiddenOpenChild.id, leaver.user.id)
        })

        it(`Should let a member leave a HIDDEN-PRIVATE subgroup`, async function(t) {
            if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
            await assertRemoved(leaver.session, hiddenPrivateChild.id, leaver.user.id, { status: 'member', role: 'member' })
            await assertGone(owner.session, hiddenPrivateChild.id, leaver.user.id)
        })
    })

    // ======================================================================
    // The membership lifecycle removals called out in the regression guide:
    // declining an invitation, rescinding one, cancelling a request, and
    // rejecting one.  All four are the same endpoint -- what differs is who
    // acts and what status the removed row carried.
    // ======================================================================
    describe("membership lifecycle removals", function() {
        let owner, moderator, invitee, rescinded, requester, rejected
        let openGroup = null, privateGroup = null

        before(async function() {
            owner = await loginAs('user1')
            moderator = await loginAs('user2')
            invitee = await loginAs('user3')      // declines their own invitation
            rescinded = await loginAs('user8')    // has their invitation rescinded
            requester = await loginAs('user9')    // cancels their own request
            rejected = await loginAs('user5')     // has their request rejected

            openGroup = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
            await addConfirmedMember(owner.session, moderator.session, openGroup.id, moderator.user.id)
            await setGroupMemberRole(owner.session, openGroup.id, moderator.user.id, 'moderator')
            await inviteToGroup(owner.session, openGroup.id, invitee.user.id)
            await inviteToGroup(owner.session, openGroup.id, rescinded.user.id)

            privateGroup = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })
            await addConfirmedMember(owner.session, moderator.session, privateGroup.id, moderator.user.id)
            await setGroupMemberRole(owner.session, privateGroup.id, moderator.user.id, 'moderator')
            await requestToJoinGroup(requester.session, privateGroup.id, requester.user.id)
            await requestToJoinGroup(rejected.session, privateGroup.id, rejected.user.id)
        })

        after(async function() {
            if ( openGroup ) await deleteGroup(owner.session, openGroup.id)
            if ( privateGroup ) await deleteGroup(owner.session, privateGroup.id)
            await logout(owner.session)
            await logout(moderator.session)
            await logout(invitee.session)
            await logout(rescinded.session)
            await logout(requester.session)
            await logout(rejected.session)
        })

        it(`Should let an invited user decline by removing their own invitation`, async function() {
            await assertRemoved(invitee.session, openGroup.id, invitee.user.id, { status: 'pending-invited', role: 'member' })
            await assertGone(owner.session, openGroup.id, invitee.user.id)
        })

        it(`Should let a Group Moderator rescind an invitation`, async function() {
            await assertRemoved(moderator.session, openGroup.id, rescinded.user.id, { status: 'pending-invited', role: 'member' })
            await assertGone(owner.session, openGroup.id, rescinded.user.id)
        })

        it(`Should let a requesting user cancel their own request`, async function() {
            await assertRemoved(requester.session, privateGroup.id, requester.user.id, { status: 'pending-requested', role: 'member' })
            await assertGone(owner.session, privateGroup.id, requester.user.id)
        })

        it(`Should let a Group Moderator reject a request by removing it`, async function() {
            await assertRemoved(moderator.session, privateGroup.id, rejected.user.id, { status: 'pending-requested', role: 'member' })
            await assertGone(owner.session, privateGroup.id, rejected.user.id)
        })
    })

    // ======================================================================
    // The last-admin guard.
    //
    // Because the delete gate only ever lets an admin reach their own row, this
    // guard exclusively governs an admin leaving their own group.  It counts
    // admins with:
    //
    //     SELECT user_id FROM group_members WHERE group_id = $1 AND role = 'admin'
    //
    // -- that is, by ROLE alone.  The permission layer's own definition of an
    // admin (isAdmin) additionally requires status === 'member', which is where
    // the two failing tests at the end of this block come from.
    // ======================================================================
    describe("last admin guard", function() {
        let owner, coAdmin, member, pendingAdmin, bannedAdmin, siteModerator
        let soleGroup = null, twoAdminGroup = null, pendingAdminGroup = null, bannedAdminGroup = null

        before(async function() {
            owner = await loginAs('user1')
            coAdmin = await loginAs('user2')
            member = await loginAs('user6')
            pendingAdmin = await loginAs('user3')
            bannedAdmin = await loginAs('user4')
            siteModerator = await loginAs('user-site-moderator')

            // A group whose only admin is the owner.
            soleGroup = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
            await addConfirmedMember(owner.session, member.session, soleGroup.id, member.user.id)

            // A group with two real admins.
            twoAdminGroup = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
            await addConfirmedMember(owner.session, coAdmin.session, twoAdminGroup.id, coAdmin.user.id)
            await setGroupMemberRole(owner.session, twoAdminGroup.id, coAdmin.user.id, 'admin')

            // A group where the second 'admin' was promoted while still only
            // invited -- they have role 'admin' but status 'pending-invited'.
            pendingAdminGroup = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
            await inviteToGroup(owner.session, pendingAdminGroup.id, pendingAdmin.user.id)
            await setGroupMemberRole(owner.session, pendingAdminGroup.id, pendingAdmin.user.id, 'admin')

            // A group where the second 'admin' was promoted after being banned --
            // role 'admin', status 'banned'.
            bannedAdminGroup = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
            await addConfirmedMember(owner.session, bannedAdmin.session, bannedAdminGroup.id, bannedAdmin.user.id)
            await setGroupMemberStatus(owner.session, bannedAdminGroup.id, bannedAdmin.user.id, 'banned')
            await setGroupMemberRole(owner.session, bannedAdminGroup.id, bannedAdmin.user.id, 'admin')
        })

        after(async function() {
            // Torn down as the site moderator: the owner deliberately leaves some
            // of these groups, so their own session can no longer administer them.
            if ( soleGroup ) await deleteGroup(siteModerator.session, soleGroup.id)
            if ( twoAdminGroup ) await deleteGroup(siteModerator.session, twoAdminGroup.id)
            if ( pendingAdminGroup ) await deleteGroup(siteModerator.session, pendingAdminGroup.id)
            if ( bannedAdminGroup ) await deleteGroup(siteModerator.session, bannedAdminGroup.id)
            await logout(owner.session)
            await logout(coAdmin.session)
            await logout(member.session)
            await logout(pendingAdmin.session)
            await logout(bannedAdmin.session)
            await logout(siteModerator.session)
        })

        it(`Should NOT let the only admin leave the group`, async function() {
            await assertForbidden(owner.session, soleGroup.id, owner.user.id)
        })

        it(`Should still let the only admin remove other members`, async function() {
            // The guard is about the TARGET being the last admin, not about the
            // actor -- a sole admin can still moderate normally.
            await assertRemoved(owner.session, soleGroup.id, member.user.id, { status: 'member', role: 'member' })
            await assertGone(owner.session, soleGroup.id, member.user.id)
        })

        it(`Should let an admin leave when another admin remains`, async function() {
            await assertRemoved(owner.session, twoAdminGroup.id, owner.user.id, { status: 'member', role: 'admin' })
            await assertGone(coAdmin.session, twoAdminGroup.id, owner.user.id)
        })

        it(`Should NOT let the remaining admin leave afterwards`, async function() {
            await assertForbidden(coAdmin.session, twoAdminGroup.id, coAdmin.user.id)
        })

        // BUG (failing test) -- the guard counts admins by role alone.
        //
        // The guard's query filters on `role = 'admin'` and ignores `status`,
        // but the permission layer only treats a row as an admin when
        // `status === 'member' AND role === 'admin'` (see isAdmin() in
        // packages/shared/permissions/Group/index.js).  A member who was
        // promoted to 'admin' while still only invited therefore satisfies the
        // guard without being able to administer anything.
        //
        // Reachable exactly as set up above: PATCH accepts a role change with no
        // status key, so promoting a pending invitee is allowed.  The owner then
        // leaves and the group is left with no one who can actually administer
        // it -- which is the situation the guard exists to prevent.
        it(`Should NOT let the last real admin leave when the only other admin has never accepted`, async function() {
            await assertForbidden(owner.session, pendingAdminGroup.id, owner.user.id)
        })

        // BUG (failing test) -- same root cause, reached via a banned member.
        //
        // A banned member promoted to 'admin' (also permitted by PATCH, which
        // applies role rules without consulting status) likewise counts toward
        // the guard while being unable to administer anything -- canAdminGroup
        // rejects banned members outright.
        it(`Should NOT let the last real admin leave when the only other admin is banned`, async function() {
            await assertForbidden(owner.session, bannedAdminGroup.id, owner.user.id)
        })
    })

    // ======================================================================
    // Side effects of a successful removal.
    // ======================================================================
    describe("removal side effects", function() {
        let owner, moderator, rejoiner, echoTarget
        let group = null

        before(async function() {
            owner = await loginAs('user1')
            moderator = await loginAs('user2')
            rejoiner = await loginAs('user3')
            echoTarget = await loginAs('user8')

            group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
            await addConfirmedMember(owner.session, moderator.session, group.id, moderator.user.id)
            await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
            await addConfirmedMember(owner.session, rejoiner.session, group.id, rejoiner.user.id)
            await addConfirmedMember(owner.session, echoTarget.session, group.id, echoTarget.user.id)
        })

        after(async function() {
            if ( group ) await deleteGroup(owner.session, group.id)
            await logout(owner.session)
            await logout(moderator.session)
            await logout(rejoiner.session)
            await logout(echoTarget.session)
        })

        it(`Should return the removed membership row, including its id`, async function() {
            const entity = await assertRemoved(moderator.session, group.id, echoTarget.user.id, { status: 'member', role: 'member' })
            assert.match(String(entity.id), /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
                `Expected the removed member's id to be a UUID, got ${entity.id}`)
        })

        // A lingering row would surface as a 409 conflict on the re-invite, so
        // this confirms the delete really removed the membership rather than
        // just hiding it.
        it(`Should allow a removed member to be invited again`, async function() {
            await assertRemoved(moderator.session, group.id, rejoiner.user.id, { status: 'member', role: 'member' })
            await assertGone(owner.session, group.id, rejoiner.user.id)

            await inviteToGroup(owner.session, group.id, rejoiner.user.id)

            const check = await getGroupMember(owner.session, group.id, rejoiner.user.id)
            assert.equal(check.status, 200, `Expected the re-invited member to be retrievable, got ${check.status}.`)
            assert.equal(check.content?.entity?.status, 'pending-invited')
        })
    })
})
