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
    joinOpenGroup,
    addConfirmedMember,
    setGroupMemberStatus,
    setGroupMemberRole
} = require('../../lib/groups')
const { isFeatureEnabled } = require('../../lib/system')

const SUBGROUPS_FEATURE = 'issue-165-subgroups'
let subgroupsEnabled = false

// ============================================================================
// POST /group/:groupId/members drives GroupMemberController.postGroupMembers(),
// which delegates each submitted member to GroupMemberService.inviteGroupMember().
// That runs, IN ORDER:
//   0. authentication (controller)                     -> 401 not-authenticated
//   1. body.groupId === route groupId                  -> 499 invalid
//   2. group exists                                    -> 404 not-found
//   3. PermissionService.can('view','Group')           -> 404 not-found
//   4. PermissionService.can('create','GroupMember')   -> 403 not-authorized
//   5. no existing membership for the target user      -> 409 conflict
//   6. ValidationService.validateGroupMember()         -> 499 invalid
//   7. insert                                          -> 201 { dictionary }
//
// Because the checks are ordered, an earlier failure masks a later one.  Two
// consequences worth stating up front, since they shape the expected codes:
//
//  * The VIEW gate precedes the CREATE gate.  An actor who cannot even see the
//    group (a non-member of a hidden group, or ANY banned member -- the banned
//    check in canViewGroup fires before the open/private allow) gets 404, NOT
//    403.  403 is reserved for actors who can see the group but may not add the
//    member they asked for (e.g. a plain member trying to invite someone).
//
//  * PERMISSION precedes VALIDATION.  The permission gate only asks "may this
//    actor create SOME membership here?"; it does not inspect role/status.  So
//    the validation tests below all use actors who pass permission, and vary
//    role/status/userId to exercise ValidationService.validateGroupMember().
//
// Error-body shape (UserErrors.getErrors): { error: { type, all: [...] } }.
// `error.type` is derived from the HTTP status -- 'not-authenticated' (401),
// 'not-authorized' (403), 'conflict' (409), and 'invalid' for EVERYTHING else
// INCLUDING 404 (404 is not in the status->type map).  The specific, useful
// code (e.g. 'not-found', 'status:invalid', 'userId:not-found') lives in
// `error.all[].type`, which is what the validation assertions check.
//
// A successful create returns 201 { dictionary, relations } -- the new row(s)
// are in `dictionary`, keyed by id; there is no top-level `entity`.
//
// Out of scope (documented but not exercised here): inviting non-users by
// email (a different, user-provisioning path), and friend-gating of invitees
// (the invite path keys off userId and enforces no friendship in code).
// ============================================================================

async function createGroupMember(session, groupId, body) {
    return await fetchEndpoint('POST', `/group/${encodeURIComponent(groupId)}/members`, { session: session, body: body })
}

// A GroupMember submission.  status/role are only included when provided, so
// the "missing field" cases can omit them (JSON drops undefined).
function memberBody(groupId, userId, status, role) {
    const body = { groupId: groupId, userId: userId }
    if ( status !== undefined ) body.status = status
    if ( role !== undefined ) body.role = role
    return body
}

// Branch-free outcome helpers -- each test picks the one matching its expectation.
async function assertCreated(session, groupId, body, expected = {}) {
    const response = await createGroupMember(session, groupId, body)
    assert.equal(response.status, 201, `Expected 201 Created but got ${response.status}: ${JSON.stringify(response.content)}`)
    const targetUserId = expected.userId !== undefined ? expected.userId : body.userId
    const created = Object.values(response.content?.dictionary || {}).find((m) => m.userId === targetUserId)
    assert.ok(created, `Created member for User(${targetUserId}) not found in response dictionary.`)
    assert.equal(created.groupId, groupId)
    if ( expected.status !== undefined ) {
        assert.equal(created.status, expected.status, `Expected created status '${expected.status}', got '${created.status}'.`)
    }
    if ( expected.role !== undefined ) {
        assert.equal(created.role, expected.role, `Expected created role '${expected.role}', got '${created.role}'.`)
    }
    return created
}

async function assertForbidden(session, groupId, body) {
    const response = await createGroupMember(session, groupId, body)
    assert.equal(response.status, 403, `Expected 403 not-authorized but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.equal(response.content?.error?.type, 'not-authorized')
}

// The VIEW gate (or a missing group) rejects with 404; error.type is the
// generic 'invalid', and the 'not-found' detail is carried in error.all.
async function assertNotFound(session, groupId, body) {
    const response = await createGroupMember(session, groupId, body)
    assert.equal(response.status, 404, `Expected 404 not-found but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.ok(
        Array.isArray(response.content?.error?.all) && response.content.error.all.some((e) => e.type === 'not-found'),
        `Expected a 'not-found' detail in error.all, got ${JSON.stringify(response.content?.error?.all)}`)
}

async function assertConflict(session, groupId, body) {
    const response = await createGroupMember(session, groupId, body)
    assert.equal(response.status, 409, `Expected 409 conflict but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.equal(response.content?.error?.type, 'conflict')
}

// Validation (and the groupId-mismatch check) reject with 499 / error.type
// 'invalid'.  When expectedType is given, it must appear in error.all -- this
// is what pins down WHICH validation rule fired (e.g. 'status:invalid').
async function assertInvalid(session, groupId, body, expectedType) {
    const response = await createGroupMember(session, groupId, body)
    assert.equal(response.status, 499, `Expected 499 invalid but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.equal(response.content?.error?.type, 'invalid')
    if ( expectedType !== undefined ) {
        assert.ok(
            Array.isArray(response.content?.error?.all) && response.content.error.all.some((e) => e.type === expectedType),
            `Expected validation error '${expectedType}' in error.all, got ${JSON.stringify(response.content?.error?.all)}`)
    }
}

async function assertUnauthenticated(session, groupId, body) {
    const response = await createGroupMember(session, groupId, body)
    assert.equal(response.status, 401)
    assert.equal(response.content?.error?.type, 'not-authenticated')
}

describe('POST /group/:groupId/members', function() {

    before(async function() {
        subgroupsEnabled = await isFeatureEnabled(SUBGROUPS_FEATURE)
    })

    // ======================================================================
    // Authentication + the pre-permission structural checks.
    // ======================================================================
    describe("authentication and basics", function() {
        let owner, member, moderator, target
        let group = null

        before(async function() {
            owner = await loginAs('user1')
            moderator = await loginAs('user2')
            member = await loginAs('user3')
            target = await loginAs('user8')

            group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
            await addConfirmedMember(owner.session, moderator.session, group.id, moderator.user.id)
            await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
            await addConfirmedMember(owner.session, member.session, group.id, member.user.id)
        })

        after(async function() {
            if ( group ) await deleteGroup(owner.session, group.id)
            await logout(owner.session)
            await logout(moderator.session)
            await logout(member.session)
            await logout(target.session)
        })

        it(`Should reject an unauthenticated request with 401`, async function() {
            const session = await initialize()
            await assertUnauthenticated(session, group.id, memberBody(group.id, target.user.id, 'pending-invited', 'member'))
        })

        it(`Should reject a body whose groupId does not match the route with 499`, async function() {
            // The body.groupId / route groupId consistency check fires first.
            const mismatched = memberBody(crypto.randomUUID(), target.user.id, 'pending-invited', 'member')
            await assertInvalid(owner.session, group.id, mismatched)
        })

        it(`Should return 404 for a group that doesn't exist`, async function() {
            const missingId = crypto.randomUUID()
            await assertNotFound(owner.session, missingId, memberBody(missingId, target.user.id, 'pending-invited', 'member'))
        })

        it(`Should return 409 when the target user is already a member`, async function() {
            // Moderator (passes permission) invites a user who is already a
            // confirmed member -> the existing-membership check fires (409).
            await assertConflict(moderator.session, group.id, memberBody(group.id, member.user.id, 'pending-invited', 'member'))
        })
    })

    // ======================================================================
    // PERMISSION MODEL.
    //
    // Each request below carries a VALID body for its actor (so validation
    // would pass), isolating the permission gate: who may add a member at all.
    // ======================================================================
    describe("permission model", function() {

        describe("for Open groups", function() {
            let owner, moderator, member, nonMember, banned, target, target2
            let group = null

            before(async function() {
                owner = await loginAs('user1')            // admin
                moderator = await loginAs('user2')        // moderator
                member = await loginAs('user3')           // plain member
                nonMember = await loginAs('user7')        // non-member (self-joins)
                banned = await loginAs('user4')           // confirmed then banned
                target = await loginAs('user8')           // an invitee
                target2 = await loginAs('user9')          // a second invitee (distinct, for the admin case)

                group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
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
                await logout(nonMember.session)
                await logout(banned.session)
                await logout(target.session)
                await logout(target2.session)
            })

            it(`Should let a non-member add themselves as a confirmed member`, async function() {
                await assertCreated(nonMember.session, group.id, memberBody(group.id, nonMember.user.id, 'member', 'member'),
                    { status: 'member', role: 'member' })
            })

            it(`Should let a Group Moderator invite a non-member`, async function() {
                await assertCreated(moderator.session, group.id, memberBody(group.id, target.user.id, 'pending-invited', 'member'),
                    { status: 'pending-invited', role: 'member' })
            })

            it(`Should let a Group Admin invite a non-member`, async function() {
                await assertCreated(owner.session, group.id, memberBody(group.id, target2.user.id, 'pending-invited', 'member'),
                    { status: 'pending-invited', role: 'member' })
            })

            it(`Should NOT let a plain Member invite someone else (403)`, async function() {
                await assertForbidden(member.session, group.id, memberBody(group.id, target.user.id, 'pending-invited', 'member'))
            })

            it(`Should NOT let a banned member add anyone (404 -- fails the view gate)`, async function() {
                await assertNotFound(banned.session, group.id, memberBody(group.id, target.user.id, 'pending-invited', 'member'))
            })
        })

        describe("for Private groups", function() {
            let owner, moderator, member, nonMember, banned, target
            let group = null

            before(async function() {
                owner = await loginAs('user1')
                moderator = await loginAs('user2')
                member = await loginAs('user3')
                nonMember = await loginAs('user7')
                banned = await loginAs('user4')
                target = await loginAs('user8')

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
                await logout(nonMember.session)
                await logout(banned.session)
                await logout(target.session)
            })

            it(`Should let a non-member request membership (pending-requested)`, async function() {
                await assertCreated(nonMember.session, group.id, memberBody(group.id, nonMember.user.id, 'pending-requested', 'member'),
                    { status: 'pending-requested', role: 'member' })
            })

            it(`Should let a Group Moderator invite a non-member (pending-invited)`, async function() {
                await assertCreated(moderator.session, group.id, memberBody(group.id, target.user.id, 'pending-invited', 'member'),
                    { status: 'pending-invited', role: 'member' })
            })

            it(`Should NOT let a plain Member invite someone else (403)`, async function() {
                await assertForbidden(member.session, group.id, memberBody(group.id, target.user.id, 'pending-invited', 'member'))
            })

            it(`Should NOT let a banned member add anyone (404)`, async function() {
                await assertNotFound(banned.session, group.id, memberBody(group.id, target.user.id, 'pending-invited', 'member'))
            })
        })

        describe("for Hidden groups", function() {
            let owner, moderator, member, nonMember, banned, target
            let group = null

            before(async function() {
                owner = await loginAs('user1')
                moderator = await loginAs('user2')
                member = await loginAs('user3')
                nonMember = await loginAs('user7')
                banned = await loginAs('user4')
                target = await loginAs('user8')

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
                await logout(nonMember.session)
                await logout(banned.session)
                await logout(target.session)
            })

            it(`Should let a Group Moderator invite a non-member (pending-invited)`, async function() {
                await assertCreated(moderator.session, group.id, memberBody(group.id, target.user.id, 'pending-invited', 'member'),
                    { status: 'pending-invited', role: 'member' })
            })

            it(`Should NOT let a non-member add themselves (404 -- cannot see a hidden group)`, async function() {
                await assertNotFound(nonMember.session, group.id, memberBody(group.id, nonMember.user.id, 'member', 'member'))
            })

            it(`Should NOT let a plain Member invite someone else (403)`, async function() {
                await assertForbidden(member.session, group.id, memberBody(group.id, target.user.id, 'pending-invited', 'member'))
            })

            it(`Should NOT let a banned member add anyone (404)`, async function() {
                await assertNotFound(banned.session, group.id, memberBody(group.id, target.user.id, 'pending-invited', 'member'))
            })
        })

        // ---- Subgroups ----
        describe("for Subgroups", function() {

            describe("an OPEN subgroup of a PUBLIC group", function() {
                let owner, parentAdmin, parentMember, nonMember, childModerator, target
                let parent = null, child = null

                before(async function() {
                    if ( ! subgroupsEnabled ) return
                    owner = await loginAs('user1')
                    parentAdmin = await loginAs('user4')      // admin of parent, not in child
                    parentMember = await loginAs('user6')     // member of parent, not in child
                    nonMember = await loginAs('user7')        // in neither
                    childModerator = await loginAs('user2')   // moderator of the child
                    target = await loginAs('user8')

                    parent = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                    await addConfirmedMember(owner.session, parentAdmin.session, parent.id, parentAdmin.user.id)
                    await setGroupMemberRole(owner.session, parent.id, parentAdmin.user.id, 'admin')
                    await addConfirmedMember(owner.session, parentMember.session, parent.id, parentMember.user.id)

                    child = await createSubgroup(owner.session, parent.id, 'open')
                    await addConfirmedMember(owner.session, childModerator.session, child.id, childModerator.user.id)
                    await setGroupMemberRole(owner.session, child.id, childModerator.user.id, 'moderator')
                })

                after(async function() {
                    if ( ! subgroupsEnabled ) return
                    if ( child ) await deleteGroup(owner.session, child.id)
                    if ( parent ) await deleteGroup(owner.session, parent.id)
                    await logout(owner.session)
                    await logout(parentAdmin.session)
                    await logout(parentMember.session)
                    await logout(nonMember.session)
                    await logout(childModerator.session)
                    await logout(target.session)
                })

                it(`Should let a non-member add themselves as a confirmed member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCreated(nonMember.session, child.id, memberBody(child.id, nonMember.user.id, 'member', 'member'),
                        { status: 'member', role: 'member' })
                })

                it(`Should let a Parent Group Member add themselves as a confirmed member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCreated(parentMember.session, child.id, memberBody(child.id, parentMember.user.id, 'member', 'member'),
                        { status: 'member', role: 'member' })
                })

                it(`Should let a Parent Group Admin add themselves as an admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCreated(parentAdmin.session, child.id, memberBody(child.id, parentAdmin.user.id, 'member', 'admin'),
                        { status: 'member', role: 'admin' })
                })

                it(`Should let a Group Moderator invite a non-member (pending-invited)`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCreated(childModerator.session, child.id, memberBody(child.id, target.user.id, 'pending-invited', 'member'),
                        { status: 'pending-invited', role: 'member' })
                })

                it(`Should NOT let a Parent Group Member add someone else (403)`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertForbidden(parentMember.session, child.id, memberBody(child.id, target.user.id, 'member', 'member'))
                })
            })

            describe("a PRIVATE subgroup of a PUBLIC group", function() {
                let owner, parentAdmin, parentMember, nonMember, childModerator, target
                let parent = null, child = null

                before(async function() {
                    if ( ! subgroupsEnabled ) return
                    owner = await loginAs('user1')
                    parentAdmin = await loginAs('user4')
                    parentMember = await loginAs('user6')
                    nonMember = await loginAs('user7')
                    childModerator = await loginAs('user2')
                    target = await loginAs('user8')

                    parent = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                    await addConfirmedMember(owner.session, parentAdmin.session, parent.id, parentAdmin.user.id)
                    await setGroupMemberRole(owner.session, parent.id, parentAdmin.user.id, 'admin')
                    await addConfirmedMember(owner.session, parentMember.session, parent.id, parentMember.user.id)

                    child = await createSubgroup(owner.session, parent.id, 'private')
                    await addConfirmedMember(owner.session, childModerator.session, child.id, childModerator.user.id)
                    await setGroupMemberRole(owner.session, child.id, childModerator.user.id, 'moderator')
                })

                after(async function() {
                    if ( ! subgroupsEnabled ) return
                    if ( child ) await deleteGroup(owner.session, child.id)
                    if ( parent ) await deleteGroup(owner.session, parent.id)
                    await logout(owner.session)
                    await logout(parentAdmin.session)
                    await logout(parentMember.session)
                    await logout(nonMember.session)
                    await logout(childModerator.session)
                    await logout(target.session)
                })

                it(`Should let a non-member request membership (pending-requested)`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCreated(nonMember.session, child.id, memberBody(child.id, nonMember.user.id, 'pending-requested', 'member'),
                        { status: 'pending-requested', role: 'member' })
                })

                it(`Should let a Parent Group Member request membership (pending-requested)`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    // A plain 'private' subgroup has no parent-member fast path; a
                    // parent member requests like anyone else.
                    await assertCreated(parentMember.session, child.id, memberBody(child.id, parentMember.user.id, 'pending-requested', 'member'),
                        { status: 'pending-requested', role: 'member' })
                })

                it(`Should let a Parent Group Admin add themselves as an admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCreated(parentAdmin.session, child.id, memberBody(child.id, parentAdmin.user.id, 'member', 'admin'),
                        { status: 'member', role: 'admin' })
                })

                it(`Should let a Group Moderator invite a non-member (pending-invited)`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCreated(childModerator.session, child.id, memberBody(child.id, target.user.id, 'pending-invited', 'member'),
                        { status: 'pending-invited', role: 'member' })
                })
            })

            describe("a HIDDEN subgroup of a PUBLIC group", function() {
                let owner, parentAdmin, parentMember, nonMember, childModerator, target
                let parent = null, child = null

                before(async function() {
                    if ( ! subgroupsEnabled ) return
                    owner = await loginAs('user1')
                    parentAdmin = await loginAs('user4')
                    parentMember = await loginAs('user6')
                    nonMember = await loginAs('user7')
                    childModerator = await loginAs('user2')
                    target = await loginAs('user8')

                    parent = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                    await addConfirmedMember(owner.session, parentAdmin.session, parent.id, parentAdmin.user.id)
                    await setGroupMemberRole(owner.session, parent.id, parentAdmin.user.id, 'admin')
                    await addConfirmedMember(owner.session, parentMember.session, parent.id, parentMember.user.id)

                    child = await createSubgroup(owner.session, parent.id, 'hidden')
                    await addConfirmedMember(owner.session, childModerator.session, child.id, childModerator.user.id)
                    await setGroupMemberRole(owner.session, child.id, childModerator.user.id, 'moderator')
                })

                after(async function() {
                    if ( ! subgroupsEnabled ) return
                    if ( child ) await deleteGroup(owner.session, child.id)
                    if ( parent ) await deleteGroup(owner.session, parent.id)
                    await logout(owner.session)
                    await logout(parentAdmin.session)
                    await logout(parentMember.session)
                    await logout(nonMember.session)
                    await logout(childModerator.session)
                    await logout(target.session)
                })

                it(`Should let a Parent Group Admin add themselves as an admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCreated(parentAdmin.session, child.id, memberBody(child.id, parentAdmin.user.id, 'member', 'admin'),
                        { status: 'member', role: 'admin' })
                })

                it(`Should let a Group Moderator invite a non-member (pending-invited)`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCreated(childModerator.session, child.id, memberBody(child.id, target.user.id, 'pending-invited', 'member'),
                        { status: 'pending-invited', role: 'member' })
                })

                it(`Should NOT let a Parent Group Member add themselves (404 -- a plain hidden subgroup is invisible to parent members)`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertNotFound(parentMember.session, child.id, memberBody(child.id, parentMember.user.id, 'member', 'member'))
                })

                it(`Should NOT let a non-member add themselves (404)`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertNotFound(nonMember.session, child.id, memberBody(child.id, nonMember.user.id, 'member', 'member'))
                })
            })

            describe("an OPEN subgroup of a PRIVATE group (PRIVATE-OPEN)", function() {
                let owner, parentAdmin, parentMember, nonMember, childModerator, target
                let parent = null, child = null

                before(async function() {
                    if ( ! subgroupsEnabled ) return
                    owner = await loginAs('user1')
                    parentAdmin = await loginAs('user4')
                    parentMember = await loginAs('user6')
                    nonMember = await loginAs('user7')
                    childModerator = await loginAs('user2')
                    target = await loginAs('user8')

                    parent = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })
                    await addConfirmedMember(owner.session, parentAdmin.session, parent.id, parentAdmin.user.id)
                    await setGroupMemberRole(owner.session, parent.id, parentAdmin.user.id, 'admin')
                    await addConfirmedMember(owner.session, parentMember.session, parent.id, parentMember.user.id)

                    child = await createSubgroup(owner.session, parent.id, 'private-open')
                    await addConfirmedMember(owner.session, childModerator.session, child.id, childModerator.user.id)
                    await setGroupMemberRole(owner.session, child.id, childModerator.user.id, 'moderator')
                })

                after(async function() {
                    if ( ! subgroupsEnabled ) return
                    if ( child ) await deleteGroup(owner.session, child.id)
                    if ( parent ) await deleteGroup(owner.session, parent.id)
                    await logout(owner.session)
                    await logout(parentAdmin.session)
                    await logout(parentMember.session)
                    await logout(nonMember.session)
                    await logout(childModerator.session)
                    await logout(target.session)
                })

                it(`Should let a Parent Group Member add themselves as a confirmed member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCreated(parentMember.session, child.id, memberBody(child.id, parentMember.user.id, 'member', 'member'),
                        { status: 'member', role: 'member' })
                })

                it(`Should let a non-parent non-member request membership (pending-requested)`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCreated(nonMember.session, child.id, memberBody(child.id, nonMember.user.id, 'pending-requested', 'member'),
                        { status: 'pending-requested', role: 'member' })
                })

                it(`Should let a Parent Group Admin add themselves as an admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCreated(parentAdmin.session, child.id, memberBody(child.id, parentAdmin.user.id, 'member', 'admin'),
                        { status: 'member', role: 'admin' })
                })

                it(`Should let a Group Moderator invite a non-member (pending-invited)`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCreated(childModerator.session, child.id, memberBody(child.id, target.user.id, 'pending-invited', 'member'),
                        { status: 'pending-invited', role: 'member' })
                })
            })

            describe("an OPEN subgroup of a HIDDEN group (HIDDEN-OPEN)", function() {
                let owner, parentAdmin, parentMember, nonMember, childModerator, target
                let parent = null, child = null

                before(async function() {
                    if ( ! subgroupsEnabled ) return
                    owner = await loginAs('user1')
                    parentAdmin = await loginAs('user4')
                    parentMember = await loginAs('user6')
                    nonMember = await loginAs('user7')
                    childModerator = await loginAs('user2')
                    target = await loginAs('user8')

                    parent = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })
                    await addConfirmedMember(owner.session, parentAdmin.session, parent.id, parentAdmin.user.id)
                    await setGroupMemberRole(owner.session, parent.id, parentAdmin.user.id, 'admin')
                    await addConfirmedMember(owner.session, parentMember.session, parent.id, parentMember.user.id)

                    child = await createSubgroup(owner.session, parent.id, 'hidden-open')
                    await addConfirmedMember(owner.session, childModerator.session, child.id, childModerator.user.id)
                    await setGroupMemberRole(owner.session, child.id, childModerator.user.id, 'moderator')
                })

                after(async function() {
                    if ( ! subgroupsEnabled ) return
                    if ( child ) await deleteGroup(owner.session, child.id)
                    if ( parent ) await deleteGroup(owner.session, parent.id)
                    await logout(owner.session)
                    await logout(parentAdmin.session)
                    await logout(parentMember.session)
                    await logout(nonMember.session)
                    await logout(childModerator.session)
                    await logout(target.session)
                })

                it(`Should let a Parent Group Member add themselves as a confirmed member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCreated(parentMember.session, child.id, memberBody(child.id, parentMember.user.id, 'member', 'member'),
                        { status: 'member', role: 'member' })
                })

                it(`Should let a Parent Group Admin add themselves as an admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCreated(parentAdmin.session, child.id, memberBody(child.id, parentAdmin.user.id, 'member', 'admin'),
                        { status: 'member', role: 'admin' })
                })

                it(`Should let a Group Moderator invite a non-member (pending-invited)`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCreated(childModerator.session, child.id, memberBody(child.id, target.user.id, 'pending-invited', 'member'),
                        { status: 'pending-invited', role: 'member' })
                })

                it(`Should NOT let a non-parent non-member add themselves (404 -- cannot see a hidden-open subgroup)`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertNotFound(nonMember.session, child.id, memberBody(child.id, nonMember.user.id, 'member', 'member'))
                })
            })

            describe("a PRIVATE subgroup of a HIDDEN group (HIDDEN-PRIVATE)", function() {
                let owner, parentAdmin, parentMember, childModerator, target
                let parent = null, child = null

                before(async function() {
                    if ( ! subgroupsEnabled ) return
                    owner = await loginAs('user1')
                    parentAdmin = await loginAs('user4')
                    parentMember = await loginAs('user6')
                    childModerator = await loginAs('user2')
                    target = await loginAs('user8')

                    parent = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })
                    await addConfirmedMember(owner.session, parentAdmin.session, parent.id, parentAdmin.user.id)
                    await setGroupMemberRole(owner.session, parent.id, parentAdmin.user.id, 'admin')
                    await addConfirmedMember(owner.session, parentMember.session, parent.id, parentMember.user.id)

                    child = await createSubgroup(owner.session, parent.id, 'hidden-private')
                    await addConfirmedMember(owner.session, childModerator.session, child.id, childModerator.user.id)
                    await setGroupMemberRole(owner.session, child.id, childModerator.user.id, 'moderator')
                })

                after(async function() {
                    if ( ! subgroupsEnabled ) return
                    if ( child ) await deleteGroup(owner.session, child.id)
                    if ( parent ) await deleteGroup(owner.session, parent.id)
                    await logout(owner.session)
                    await logout(parentAdmin.session)
                    await logout(parentMember.session)
                    await logout(childModerator.session)
                    await logout(target.session)
                })

                it(`Should let a Parent Group Member request membership (pending-requested)`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCreated(parentMember.session, child.id, memberBody(child.id, parentMember.user.id, 'pending-requested', 'member'),
                        { status: 'pending-requested', role: 'member' })
                })

                it(`Should let a Parent Group Admin add themselves as an admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCreated(parentAdmin.session, child.id, memberBody(child.id, parentAdmin.user.id, 'member', 'admin'),
                        { status: 'member', role: 'admin' })
                })

                it(`Should let a Group Moderator invite a non-member (pending-invited)`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCreated(childModerator.session, child.id, memberBody(child.id, target.user.id, 'pending-invited', 'member'),
                        { status: 'pending-invited', role: 'member' })
                })
            })
        })
    })

    // ======================================================================
    // VALIDATION MODEL.
    //
    // Every actor here PASSES the permission gate; the requests carry bad
    // field presence / format / role / status so that
    // ValidationService.validateGroupMember() is the gate under test (499).
    // ======================================================================
    describe("validation model", function() {

        // --- Field presence and format (exercised via an Open group) ---
        describe("field presence and format", function() {
            let owner, moderator, nonMember, target
            let group = null

            before(async function() {
                owner = await loginAs('user1')
                moderator = await loginAs('user2')
                nonMember = await loginAs('user7')
                target = await loginAs('user8')

                group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                await addConfirmedMember(owner.session, moderator.session, group.id, moderator.user.id)
                await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
            })

            after(async function() {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(moderator.session)
                await logout(nonMember.session)
                await logout(target.session)
            })

            it(`Should reject a disallowed 'createdDate' field`, async function() {
                const body = memberBody(group.id, target.user.id, 'pending-invited', 'member')
                body.createdDate = new Date().toISOString()
                await assertInvalid(moderator.session, group.id, body, 'createdDate:not-allowed')
            })

            it(`Should reject a disallowed 'updatedDate' field`, async function() {
                const body = memberBody(group.id, target.user.id, 'pending-invited', 'member')
                body.updatedDate = new Date().toISOString()
                await assertInvalid(moderator.session, group.id, body, 'updatedDate:not-allowed')
            })

            it(`Should reject a disallowed 'entranceAnswers' field`, async function() {
                const body = memberBody(group.id, target.user.id, 'pending-invited', 'member')
                body.entranceAnswers = { question: 'answer' }
                await assertInvalid(moderator.session, group.id, body, 'entranceAnswers:not-allowed')
            })

            it(`Should reject a missing 'status' (moderator invite)`, async function() {
                // status omitted; moderator passes permission, so validation is the gate.
                await assertInvalid(moderator.session, group.id, memberBody(group.id, target.user.id, undefined, 'member'), 'status:missing')
            })

            it(`Should reject a missing 'userId' (moderator invite)`, async function() {
                // Send userId: null explicitly (a clean null param for the
                // pre-validation membership lookup) rather than omitting the key.
                await assertInvalid(moderator.session, group.id, memberBody(group.id, null, 'pending-invited', 'member'), 'userId:missing')
            })

            it(`Should reject an out-of-enum 'status' value`, async function() {
                await assertInvalid(moderator.session, group.id, memberBody(group.id, target.user.id, 'bogus', 'member'), 'status:invalid')
            })

            it(`Should reject an out-of-enum 'role' value`, async function() {
                await assertInvalid(moderator.session, group.id, memberBody(group.id, target.user.id, 'pending-invited', 'bogus'), 'role:invalid')
            })

            it(`Should reject a well-formed but non-existent userId with userId:not-found`, async function() {
                await assertInvalid(moderator.session, group.id, memberBody(group.id, crypto.randomUUID(), 'pending-invited', 'member'), 'userId:not-found')
            })

            // DISCREPANCY / UNCERTAIN BEHAVIOR -- left skipped.
            //
            // A malformed (non-UUID) userId should, on the face of it, produce a
            // clean 'userId:invalid' (499) from the field validator.  But
            // inviteGroupMember() runs the existing-membership lookup
            // (getGroupMemberByGroupAndUser -> `WHERE user_id = $2` against a uuid
            // column) at line ~92, BEFORE validateGroupMember() at line ~104.  A
            // non-UUID passed into that comparison is expected to raise a Postgres
            // type error and surface as a 500, not the 499 the validator would
            // give.  Because the actual behavior (500 vs 499) is unverified, this
            // is left skipped rather than asserted either way.
            it(`Should reject a malformed (non-UUID) userId with userId:invalid`, async function(t) {
                t.skip(`Malformed-UUID userId hits the conflict-check DB query before validation; 500-vs-499 behavior is unverified.`)
                return
                // eslint-disable-next-line no-unreachable
                await assertInvalid(moderator.session, group.id, memberBody(group.id, 'not-a-uuid', 'pending-invited', 'member'), 'userId:invalid')
            })
        })

        // --- Status / role rules by group type (permission passes; body is wrong) ---
        describe("status and role rules by type", function() {
            let owner, moderator, member, nonMember, target
            let openGroup = null, privateGroup = null, hiddenGroup = null

            before(async function() {
                owner = await loginAs('user1')
                moderator = await loginAs('user2')
                member = await loginAs('user3')
                nonMember = await loginAs('user7')
                target = await loginAs('user8')

                openGroup = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                privateGroup = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })
                hiddenGroup = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })

                for ( const g of [ openGroup, privateGroup, hiddenGroup ] ) {
                    await addConfirmedMember(owner.session, moderator.session, g.id, moderator.user.id)
                    await setGroupMemberRole(owner.session, g.id, moderator.user.id, 'moderator')
                }
            })

            after(async function() {
                if ( openGroup ) await deleteGroup(owner.session, openGroup.id)
                if ( privateGroup ) await deleteGroup(owner.session, privateGroup.id)
                if ( hiddenGroup ) await deleteGroup(owner.session, hiddenGroup.id)
                await logout(owner.session)
                await logout(moderator.session)
                await logout(member.session)
                await logout(nonMember.session)
                await logout(target.session)
            })

            // Open -- non-member self-join must be role 'member' / status 'member'.
            it(`OPEN self-join with status 'pending-invited' -> status:invalid`, async function() {
                await assertInvalid(nonMember.session, openGroup.id, memberBody(openGroup.id, nonMember.user.id, 'pending-invited', 'member'), 'status:invalid')
            })

            it(`OPEN self-join with status 'pending-requested' -> status:invalid`, async function() {
                await assertInvalid(nonMember.session, openGroup.id, memberBody(openGroup.id, nonMember.user.id, 'pending-requested', 'member'), 'status:invalid')
            })

            it(`OPEN self-join with role 'moderator' -> role:invalid`, async function() {
                await assertInvalid(nonMember.session, openGroup.id, memberBody(openGroup.id, nonMember.user.id, 'member', 'moderator'), 'role:invalid')
            })

            it(`OPEN self-join with role 'admin' -> role:invalid`, async function() {
                await assertInvalid(nonMember.session, openGroup.id, memberBody(openGroup.id, nonMember.user.id, 'member', 'admin'), 'role:invalid')
            })

            // Open -- moderator invite must be role 'member' / status 'pending-invited'.
            it(`OPEN moderator invite with status 'member' -> status:invalid`, async function() {
                await assertInvalid(moderator.session, openGroup.id, memberBody(openGroup.id, target.user.id, 'member', 'member'), 'status:invalid')
            })

            it(`OPEN moderator invite with status 'pending-requested' -> status:invalid`, async function() {
                await assertInvalid(moderator.session, openGroup.id, memberBody(openGroup.id, target.user.id, 'pending-requested', 'member'), 'status:invalid')
            })

            it(`OPEN moderator invite with role 'moderator' -> role:invalid`, async function() {
                await assertInvalid(moderator.session, openGroup.id, memberBody(openGroup.id, target.user.id, 'pending-invited', 'moderator'), 'role:invalid')
            })

            // Private -- non-member self-request must be role 'member' / status 'pending-requested'.
            it(`PRIVATE self-request with status 'member' -> status:invalid`, async function() {
                await assertInvalid(nonMember.session, privateGroup.id, memberBody(privateGroup.id, nonMember.user.id, 'member', 'member'), 'status:invalid')
            })

            it(`PRIVATE self-request with status 'pending-invited' -> status:invalid`, async function() {
                await assertInvalid(nonMember.session, privateGroup.id, memberBody(privateGroup.id, nonMember.user.id, 'pending-invited', 'member'), 'status:invalid')
            })

            // Private -- moderator invite must be status 'pending-invited'.
            it(`PRIVATE moderator invite with status 'pending-requested' -> status:invalid`, async function() {
                await assertInvalid(moderator.session, privateGroup.id, memberBody(privateGroup.id, target.user.id, 'pending-requested', 'member'), 'status:invalid')
            })

            // Hidden -- moderator invite must be status 'pending-invited'.
            it(`HIDDEN moderator invite with status 'member' -> status:invalid`, async function() {
                await assertInvalid(moderator.session, hiddenGroup.id, memberBody(hiddenGroup.id, target.user.id, 'member', 'member'), 'status:invalid')
            })
        })

        // --- Subgroup-specific status/role rules ---
        describe("status and role rules for subgroups", function() {
            let owner, parentAdmin, parentMember, nonMember
            let privateParent = null, hiddenParent = null
            let openChild = null, privateOpenChild = null, hiddenOpenChild = null

            before(async function() {
                if ( ! subgroupsEnabled ) return
                owner = await loginAs('user1')
                parentAdmin = await loginAs('user4')
                parentMember = await loginAs('user6')
                nonMember = await loginAs('user7')

                // Public parent for the OPEN child (parent-admin self-add cases).
                const publicParent = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                await addConfirmedMember(owner.session, parentAdmin.session, publicParent.id, parentAdmin.user.id)
                await setGroupMemberRole(owner.session, publicParent.id, parentAdmin.user.id, 'admin')
                openChild = await createSubgroup(owner.session, publicParent.id, 'open')
                openChild.__parent = publicParent

                // Private parent for the PRIVATE-OPEN child.
                privateParent = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })
                await addConfirmedMember(owner.session, parentMember.session, privateParent.id, parentMember.user.id)
                privateOpenChild = await createSubgroup(owner.session, privateParent.id, 'private-open')

                // Hidden parent for the HIDDEN-OPEN child.
                hiddenParent = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })
                await addConfirmedMember(owner.session, parentMember.session, hiddenParent.id, parentMember.user.id)
                hiddenOpenChild = await createSubgroup(owner.session, hiddenParent.id, 'hidden-open')
            })

            after(async function() {
                if ( ! subgroupsEnabled ) return
                if ( openChild ) { await deleteGroup(owner.session, openChild.id); await deleteGroup(owner.session, openChild.__parent.id) }
                if ( privateOpenChild ) await deleteGroup(owner.session, privateOpenChild.id)
                if ( hiddenOpenChild ) await deleteGroup(owner.session, hiddenOpenChild.id)
                if ( privateParent ) await deleteGroup(owner.session, privateParent.id)
                if ( hiddenParent ) await deleteGroup(owner.session, hiddenParent.id)
                await logout(owner.session)
                await logout(parentAdmin.session)
                await logout(parentMember.session)
                await logout(nonMember.session)
            })

            // Parent-admin self-add is constrained to role 'admin' / status 'member' / self.
            it(`Parent-admin self-add with role 'member' -> role:invalid`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertInvalid(parentAdmin.session, openChild.id, memberBody(openChild.id, parentAdmin.user.id, 'member', 'member'), 'role:invalid')
            })

            it(`Parent-admin self-add with status 'pending-invited' -> status:invalid`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertInvalid(parentAdmin.session, openChild.id, memberBody(openChild.id, parentAdmin.user.id, 'pending-invited', 'admin'), 'status:invalid')
            })

            it(`Parent-admin add of SOMEONE ELSE -> userId:invalid`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertInvalid(parentAdmin.session, openChild.id, memberBody(openChild.id, nonMember.user.id, 'member', 'admin'), 'userId:invalid')
            })

            // Private-open parent member self-join is a confirmed 'member'; a
            // request status is invalid for them.
            it(`PRIVATE-OPEN parent-member self-join with status 'pending-requested' -> status:invalid`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertInvalid(parentMember.session, privateOpenChild.id, memberBody(privateOpenChild.id, parentMember.user.id, 'pending-requested', 'member'), 'status:invalid')
            })

            // Private-open NON-parent-member is a requester; a 'member' status is invalid.
            it(`PRIVATE-OPEN non-parent request with status 'member' -> status:invalid`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertInvalid(nonMember.session, privateOpenChild.id, memberBody(privateOpenChild.id, nonMember.user.id, 'member', 'member'), 'status:invalid')
            })

            // Hidden-open parent member self-join is a confirmed 'member'.
            it(`HIDDEN-OPEN parent-member self-join with status 'pending-invited' -> status:invalid`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertInvalid(parentMember.session, hiddenOpenChild.id, memberBody(hiddenOpenChild.id, parentMember.user.id, 'pending-invited', 'member'), 'status:invalid')
            })
        })

        // --- Array / batch body ---
        describe("array (batch) body", function() {
            let owner, moderator, target1, target2, target3, target4
            let group = null

            before(async function() {
                owner = await loginAs('user1')
                moderator = await loginAs('user2')
                target1 = await loginAs('user8')
                target2 = await loginAs('user9')
                target3 = await loginAs('user5')      // distinct targets for the invalid-batch case,
                target4 = await loginAs('user6')      // so it isn't masked by a 409 from the valid batch.

                group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                await addConfirmedMember(owner.session, moderator.session, group.id, moderator.user.id)
                await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
            })

            after(async function() {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(moderator.session)
                await logout(target1.session)
                await logout(target2.session)
                await logout(target3.session)
                await logout(target4.session)
            })

            it(`Should create every member in a valid batch`, async function() {
                const body = [
                    memberBody(group.id, target1.user.id, 'pending-invited', 'member'),
                    memberBody(group.id, target2.user.id, 'pending-invited', 'member')
                ]
                const response = await createGroupMember(moderator.session, group.id, body)
                assert.equal(response.status, 201, `Expected 201 but got ${response.status}: ${JSON.stringify(response.content)}`)
                const created = Object.values(response.content?.dictionary || {})
                assert.ok(created.some((m) => m.userId === target1.user.id), 'First batched member missing.')
                assert.ok(created.some((m) => m.userId === target2.user.id), 'Second batched member missing.')
            })

            it(`Should reject the whole batch if any member is invalid (499)`, async function() {
                // Second element has an invalid status for a moderator invite.
                const body = [
                    memberBody(group.id, target3.user.id, 'pending-invited', 'member'),
                    memberBody(group.id, target4.user.id, 'member', 'member')
                ]
                await assertInvalid(moderator.session, group.id, body, 'status:invalid')
            })
        })
    })
})
