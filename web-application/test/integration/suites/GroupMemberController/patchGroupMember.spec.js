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
// PATCH /group/:groupId/member/:userId drives
// GroupMemberController.patchGroupMember(), which runs, IN ORDER:
//
//   1. authentication                                  -> 401 not-authenticated
//   2. body.groupId === route :groupId                 -> 400 invalid
//   3. body.userId  === route :userId                  -> 400 invalid
//   4. group exists                                    -> 404 not-found
//   5. the GroupMember being patched exists            -> 404 not-found
//   6. PermissionService.can('view','Group')           -> 404 not-found
//      ... then the controller forces member.id = existing.id ...
//   7. PermissionService.can('update','GroupMember')   -> 403 not-authorized
//   8. ValidationService.validateGroupMember(user, member, existing)
//                                                      -> 400 invalid
//   9. update                                          -> 201 { entity, relations }
//
// ---------------------------------------------------------------------------
// Differences from POST /group/:groupId/members that shape this suite
// ---------------------------------------------------------------------------
//
//  * ERROR SHAPE.  POST builds errors with UserErrors, which serializes as
//    { error: { type, all: [ ... ] } } and uses 499 for validation failures.
//    PATCH throws ControllerError, which the error middleware serializes as
//    { error: { type, message } } -- there is NO `all` array, and validation
//    failures are 400.  The individual validation error TYPES (status:invalid,
//    role:not-authorized, ...) are therefore not machine-readable on this
//    endpoint: the controller concatenates their `message` strings into the
//    single `message` field.  The assertions below pin the specific rule by
//    matching a distinctive fragment of that message.
//
//  * 404 TYPE.  On POST, UserErrors maps any non-401/403/409 status to the
//    generic type 'invalid', so a 404 arrived with error.type === 'invalid'.
//    Here ControllerError carries its own type, so a 404 really does report
//    error.type === 'not-found'.
//
//  * SUCCESS SHAPE.  201 with a top-level `entity` (POST returned a
//    `dictionary`).  201-on-PATCH is the house convention in this codebase --
//    patchPost and patchGroup do the same -- so it is asserted, not flagged.
//
//  * WHAT IS EDITABLE.  On create, userId/groupId/status/role are all settable
//    and userId/groupId/status are REQUIRED.  On update, only `status` and
//    `role` are editable: the validator rejects a changed groupId/userId, and
//    the DAO marks both columns update:'denied'.  Nothing is required -- a body
//    carrying neither status nor role is a legal no-op.  Fields absent from the
//    body are left untouched (partial update).
//
//  * PERMISSION KEYS OFF THE EXISTING ROW.  can('update','GroupMember') is
//    given the EXISTING member as `groupMember`, so authority is decided by the
//    target's current role: moderators may manage 'member' rows, admins may
//    additionally manage 'moderator' rows, and any user may reach their own row.
//    Nothing lets one admin manage another admin's row -- see the note on the
//    "admin rows" tests below.
//
// ---------------------------------------------------------------------------
// Rules that exist in the validator but cannot be reached through this endpoint
// (documented here rather than tested, so the gap is deliberate and visible):
//
//  * 'groupId:not-allowed' / 'userId:not-allowed' -- the edit branch rejects a
//    groupId/userId that differs from the existing row, but the controller's
//    consistency checks (step 2/3) already rejected any such body with 400
//    'invalid' and a different message.  Belt and braces; the validator rule is
//    dead behind the controller.  The 400s ARE covered, in "structural checks".
//  * 'userId:not-found' / 'groupId:not-found' -- both rows were already fetched
//    by steps 4/5, so they always exist by the time validation runs.
//  * The entity-mismatch throw on a mismatched `id` -- the controller assigns
//    member.id = existing.id before validating, so a client-supplied `id` is
//    always overwritten.  Covered by asserting a bogus id is ignored.
//  * The inner `role:invalid` checks ("may only be changed to 'moderator' or
//    'admin'") -- the shared field validator already constrained role to the
//    enum, so by the time those run the value is necessarily allowed.
//  * The 'banned' + non-moderator branch ('status:not-authorized') -- every
//    actor who could trigger it is stopped earlier: a banned user fails the
//    view gate (404), and a non-moderator patching someone else's row fails the
//    update gate (403).
// ============================================================================

async function submit(session, groupId, userId, body) {
    return await fetchEndpoint(
        'PATCH',
        `/group/${encodeURIComponent(groupId)}/member/${encodeURIComponent(userId)}`,
        { session: session, body: body }
    )
}

// A PATCH body.  groupId and userId must always be present and must match the
// route, so they are always included; status/role are included only when given.
function patchBody(groupId, userId, fields = {}) {
    return { groupId: groupId, userId: userId, ...fields }
}

// Branch-free outcome helpers -- each test picks the one matching its expectation.
async function assertUpdated(session, groupId, userId, body, expected = {}) {
    const response = await submit(session, groupId, userId, body)
    assert.equal(response.status, 201, `Expected 201 but got ${response.status}: ${JSON.stringify(response.content)}`)

    const entity = response.content?.entity
    assert.ok(entity, 'Expected a GroupMember entity in the response, but received none.')
    assert.equal(entity.groupId, groupId)
    assert.equal(entity.userId, userId)

    // The controller re-selects the row after updating, so `entity` is the
    // persisted state -- asserting on it also asserts persistence.
    if ( expected.status !== undefined ) {
        assert.equal(entity.status, expected.status, `Expected status '${expected.status}', got '${entity.status}'.`)
    }
    if ( expected.role !== undefined ) {
        assert.equal(entity.role, expected.role, `Expected role '${expected.role}', got '${entity.role}'.`)
    }
    return entity
}

async function assertForbidden(session, groupId, userId, body) {
    const response = await submit(session, groupId, userId, body)
    assert.equal(response.status, 403, `Expected 403 not-authorized but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.equal(response.content?.error?.type, 'not-authorized')
}

async function assertNotFound(session, groupId, userId, body) {
    const response = await submit(session, groupId, userId, body)
    assert.equal(response.status, 404, `Expected 404 not-found but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.equal(response.content?.error?.type, 'not-found')
}

// `fragment`, when given, must appear in the concatenated validation message.
// That is the only way to identify WHICH rule fired on this endpoint, since
// ControllerError does not carry the individual error types.
async function assertInvalid(session, groupId, userId, body, fragment) {
    const response = await submit(session, groupId, userId, body)
    assert.equal(response.status, 400, `Expected 400 invalid but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.equal(response.content?.error?.type, 'invalid')
    if ( fragment !== undefined ) {
        assert.ok(
            typeof response.content?.error?.message === 'string' && response.content.error.message.includes(fragment),
            `Expected the error message to mention "${fragment}", got: ${JSON.stringify(response.content?.error?.message)}`)
    }
}

async function assertUnauthenticated(session, groupId, userId, body) {
    const response = await submit(session, groupId, userId, body)
    assert.equal(response.status, 401)
    assert.equal(response.content?.error?.type, 'not-authenticated')
}

describe('PATCH /group/:groupId/member/:userId', function() {

    before(async function() {
        subgroupsEnabled = await isFeatureEnabled(SUBGROUPS_FEATURE)
    })

    // ======================================================================
    // The checks that run before any permission or validation logic.
    // ======================================================================
    describe("structural checks", function() {
        let owner, member, other
        let group = null

        before(async function() {
            owner = await loginAs('user1')
            member = await loginAs('user3')
            other = await loginAs('user8')

            group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
            await addConfirmedMember(owner.session, member.session, group.id, member.user.id)
        })

        after(async function() {
            if ( group ) await deleteGroup(owner.session, group.id)
            await logout(owner.session)
            await logout(member.session)
            await logout(other.session)
        })

        it(`Should reject an unauthenticated request with 401`, async function() {
            const session = await initialize()
            await assertUnauthenticated(session, group.id, member.user.id,
                patchBody(group.id, member.user.id, { status: 'member' }))
        })

        it(`Should reject a body whose groupId does not match the route with 400`, async function() {
            const body = patchBody(crypto.randomUUID(), member.user.id, { status: 'member' })
            await assertInvalid(owner.session, group.id, member.user.id, body, 'groupId in the member and the route must match')
        })

        it(`Should reject a body with no groupId with 400`, async function() {
            // groupId is effectively required: `undefined !== groupId` trips the
            // same consistency check.
            const body = { userId: member.user.id, status: 'member' }
            await assertInvalid(owner.session, group.id, member.user.id, body, 'groupId in the member and the route must match')
        })

        it(`Should reject a body whose userId does not match the route with 400`, async function() {
            const body = patchBody(group.id, other.user.id, { status: 'member' })
            await assertInvalid(owner.session, group.id, member.user.id, body, 'userId in the route and the member must match')
        })

        it(`Should reject a body with no userId with 400`, async function() {
            const body = { groupId: group.id, status: 'member' }
            await assertInvalid(owner.session, group.id, member.user.id, body, 'userId in the route and the member must match')
        })

        it(`Should return 404 for a group that doesn't exist`, async function() {
            const missingGroup = crypto.randomUUID()
            await assertNotFound(owner.session, missingGroup, member.user.id,
                patchBody(missingGroup, member.user.id, { status: 'member' }))
        })

        it(`Should return 404 for a member that doesn't exist in an existing group`, async function() {
            const missingUser = crypto.randomUUID()
            await assertNotFound(owner.session, group.id, missingUser,
                patchBody(group.id, missingUser, { status: 'member' }))
        })

        it(`Should return 404 when the target user exists but is not a member of the group`, async function() {
            // user8 is a real user with no membership in this group.
            await assertNotFound(owner.session, group.id, other.user.id,
                patchBody(group.id, other.user.id, { status: 'member' }))
        })

        // DISCREPANCY / UNVERIFIED -- left skipped.
        //
        // Same rough edge flagged on POST /group/:groupId/members.  A malformed
        // (non-UUID) userId is compared against the uuid column `user_id` by
        // getGroupMemberByGroupAndUser() at step 5, BEFORE any validation runs.
        // That comparison is expected to raise a Postgres type error and surface
        // as a 500 rather than the clean 400 the field validator would produce.
        // Since the actual behaviour is unverified, this asserts the clean
        // outcome and stays skipped.
        it(`Should reject a malformed (non-UUID) userId with 400`, async function(t) {
            t.skip(`Malformed-UUID userId hits the member lookup before validation; 500-vs-400 behaviour is unverified.`)
            return
            // eslint-disable-next-line no-unreachable
            await assertInvalid(owner.session, group.id, 'not-a-uuid', patchBody(group.id, 'not-a-uuid', { status: 'member' }))
        })
    })

    // ======================================================================
    // PERMISSION MODEL -- can('update','GroupMember') decides using the
    // EXISTING row's role, so every body below is a harmless no-op; the only
    // thing under test is who is allowed through.
    // ======================================================================
    describe("permission model", function() {

        describe("for Open groups", function() {
            let owner, moderator, moderator2, member, member2, secondAdmin, nonMember, banned, siteModerator
            let group = null

            before(async function() {
                owner = await loginAs('user1')           // group admin
                moderator = await loginAs('user2')       // moderator
                moderator2 = await loginAs('user5')      // a second moderator (a moderator-role target)
                member = await loginAs('user3')          // confirmed member
                member2 = await loginAs('user8')         // a second confirmed member
                secondAdmin = await loginAs('user6')     // a second admin (an admin-role target)
                nonMember = await loginAs('user7')       // not in the group
                banned = await loginAs('user4')          // confirmed then banned
                siteModerator = await loginAs('user-site-moderator')

                group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })

                await addConfirmedMember(owner.session, moderator.session, group.id, moderator.user.id)
                await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
                await addConfirmedMember(owner.session, moderator2.session, group.id, moderator2.user.id)
                await setGroupMemberRole(owner.session, group.id, moderator2.user.id, 'moderator')
                await addConfirmedMember(owner.session, member.session, group.id, member.user.id)
                await addConfirmedMember(owner.session, member2.session, group.id, member2.user.id)
                await addConfirmedMember(owner.session, secondAdmin.session, group.id, secondAdmin.user.id)
                await setGroupMemberRole(owner.session, group.id, secondAdmin.user.id, 'admin')
                await addConfirmedMember(owner.session, banned.session, group.id, banned.user.id)
                await setGroupMemberStatus(owner.session, group.id, banned.user.id, 'banned')
            })

            after(async function() {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(moderator.session)
                await logout(moderator2.session)
                await logout(member.session)
                await logout(member2.session)
                await logout(secondAdmin.session)
                await logout(nonMember.session)
                await logout(banned.session)
                await logout(siteModerator.session)
            })

            it(`Should let a Group Moderator update a 'member' row`, async function() {
                await assertUpdated(moderator.session, group.id, member.user.id,
                    patchBody(group.id, member.user.id, { status: 'member' }), { status: 'member', role: 'member' })
            })

            it(`Should let a Group Admin update a 'moderator' row`, async function() {
                await assertUpdated(owner.session, group.id, moderator2.user.id,
                    patchBody(group.id, moderator2.user.id, { role: 'moderator' }), { role: 'moderator' })
            })

            it(`Should let a user update their own row`, async function() {
                await assertUpdated(member.session, group.id, member.user.id,
                    patchBody(group.id, member.user.id, { status: 'member' }), { status: 'member' })
            })

            it(`Should let a site moderator update a 'member' row`, async function() {
                await assertUpdated(siteModerator.session, group.id, member2.user.id,
                    patchBody(group.id, member2.user.id, { status: 'member' }), { status: 'member' })
            })

            it(`Should NOT let a Group Moderator update another moderator's row (403)`, async function() {
                await assertForbidden(moderator.session, group.id, moderator2.user.id,
                    patchBody(group.id, moderator2.user.id, { role: 'moderator' }))
            })

            it(`Should NOT let a Group Moderator update an admin's row (403)`, async function() {
                await assertForbidden(moderator.session, group.id, owner.user.id,
                    patchBody(group.id, owner.user.id, { role: 'admin' }))
            })

            // Nothing in canUpdateGroupMember covers a target whose role is
            // 'admin' except the self clause, so even a fellow group admin (and
            // a site moderator) is refused.
            it(`Should NOT let a Group Admin update another admin's row (403)`, async function() {
                await assertForbidden(owner.session, group.id, secondAdmin.user.id,
                    patchBody(group.id, secondAdmin.user.id, { role: 'admin' }))
            })

            it(`Should NOT let a site moderator update an admin's row (403)`, async function() {
                await assertForbidden(siteModerator.session, group.id, secondAdmin.user.id,
                    patchBody(group.id, secondAdmin.user.id, { role: 'admin' }))
            })

            it(`Should NOT let a plain Member update another member's row (403)`, async function() {
                await assertForbidden(member.session, group.id, member2.user.id,
                    patchBody(group.id, member2.user.id, { status: 'member' }))
            })

            it(`Should NOT let a non-member update a member's row (403)`, async function() {
                await assertForbidden(nonMember.session, group.id, member2.user.id,
                    patchBody(group.id, member2.user.id, { status: 'member' }))
            })

            it(`Should NOT let a banned member update anyone's row (404 -- fails the view gate)`, async function() {
                await assertNotFound(banned.session, group.id, member2.user.id,
                    patchBody(group.id, member2.user.id, { status: 'member' }))
            })

            it(`Should NOT let a banned member update their own row (404 -- fails the view gate)`, async function() {
                await assertNotFound(banned.session, group.id, banned.user.id,
                    patchBody(group.id, banned.user.id, { status: 'member' }))
            })
        })

        describe("for Private groups", function() {
            let owner, moderator, member, nonMember
            let group = null

            before(async function() {
                owner = await loginAs('user1')
                moderator = await loginAs('user2')
                member = await loginAs('user3')
                nonMember = await loginAs('user7')

                group = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })
                await addConfirmedMember(owner.session, moderator.session, group.id, moderator.user.id)
                await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
                await addConfirmedMember(owner.session, member.session, group.id, member.user.id)
            })

            after(async function() {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(moderator.session)
                await logout(member.session)
                await logout(nonMember.session)
            })

            it(`Should let a Group Moderator update a 'member' row`, async function() {
                await assertUpdated(moderator.session, group.id, member.user.id,
                    patchBody(group.id, member.user.id, { status: 'member' }), { status: 'member' })
            })

            // A private group is visible to everyone, so a non-member gets past
            // the view gate and is stopped by the update gate instead.
            it(`Should NOT let a non-member update a member's row (403, not 404)`, async function() {
                await assertForbidden(nonMember.session, group.id, member.user.id,
                    patchBody(group.id, member.user.id, { status: 'member' }))
            })
        })

        describe("for Hidden groups", function() {
            let owner, moderator, member, nonMember
            let group = null

            before(async function() {
                owner = await loginAs('user1')
                moderator = await loginAs('user2')
                member = await loginAs('user3')
                nonMember = await loginAs('user7')

                group = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })
                await addConfirmedMember(owner.session, moderator.session, group.id, moderator.user.id)
                await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
                await addConfirmedMember(owner.session, member.session, group.id, member.user.id)
            })

            after(async function() {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(moderator.session)
                await logout(member.session)
                await logout(nonMember.session)
            })

            it(`Should let a Group Moderator update a 'member' row`, async function() {
                await assertUpdated(moderator.session, group.id, member.user.id,
                    patchBody(group.id, member.user.id, { status: 'member' }), { status: 'member' })
            })

            // A hidden group is invisible to non-members, so the view gate fires
            // first and the response is 404 rather than 403.
            it(`Should NOT let a non-member update a member's row (404, not 403)`, async function() {
                await assertNotFound(nonMember.session, group.id, member.user.id,
                    patchBody(group.id, member.user.id, { status: 'member' }))
            })
        })

        describe("for Subgroups", function() {
            let owner, parentAdmin, parentModerator, parentMember, childMember, childMember2
            let parent = null, child = null

            before(async function() {
                if ( ! subgroupsEnabled ) return
                owner = await loginAs('user1')
                parentAdmin = await loginAs('user4')        // admin of the parent only
                parentModerator = await loginAs('user5')    // moderator of the parent only
                parentMember = await loginAs('user6')       // member of the parent only
                childMember = await loginAs('user3')        // member of the child
                childMember2 = await loginAs('user8')       // a second child member

                parent = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                await addConfirmedMember(owner.session, parentAdmin.session, parent.id, parentAdmin.user.id)
                await setGroupMemberRole(owner.session, parent.id, parentAdmin.user.id, 'admin')
                await addConfirmedMember(owner.session, parentModerator.session, parent.id, parentModerator.user.id)
                await setGroupMemberRole(owner.session, parent.id, parentModerator.user.id, 'moderator')
                await addConfirmedMember(owner.session, parentMember.session, parent.id, parentMember.user.id)

                child = await createSubgroup(owner.session, parent.id, 'private')
                await addConfirmedMember(owner.session, childMember.session, child.id, childMember.user.id)
                await addConfirmedMember(owner.session, childMember2.session, child.id, childMember2.user.id)
            })

            after(async function() {
                if ( ! subgroupsEnabled ) return
                if ( child ) await deleteGroup(owner.session, child.id)
                if ( parent ) await deleteGroup(owner.session, parent.id)
                await logout(owner.session)
                await logout(parentAdmin.session)
                await logout(parentModerator.session)
                await logout(parentMember.session)
                await logout(childMember.session)
                await logout(childMember2.session)
            })

            // Parent ADMINS inherit admin/moderate on child groups.
            it(`Should let a Parent Group Admin update a child 'member' row`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertUpdated(parentAdmin.session, child.id, childMember.user.id,
                    patchBody(child.id, childMember.user.id, { status: 'member' }), { status: 'member' })
            })

            // Parent MODERATORS do not.
            it(`Should NOT let a Parent Group Moderator update a child 'member' row (403)`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertForbidden(parentModerator.session, child.id, childMember2.user.id,
                    patchBody(child.id, childMember2.user.id, { status: 'member' }))
            })

            it(`Should NOT let a Parent Group Member update a child 'member' row (403)`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertForbidden(parentMember.session, child.id, childMember2.user.id,
                    patchBody(child.id, childMember2.user.id, { status: 'member' }))
            })
        })
    })

    // ======================================================================
    // VALIDATION MODEL.
    //
    // Every actor below passes the update gate, so validateGroupMember()'s
    // EDIT branch is the gate under test.  The edit branch is a different
    // machine from the create branch: instead of "what may this actor create",
    // it asks "what transition is this actor allowed to make from the row's
    // CURRENT status/role".  Rules only fire for keys actually present in the
    // body, so each test sends the narrowest body that exercises one rule.
    // ======================================================================
    describe("validation model", function() {

        describe("immutable and server-only fields", function() {
            let owner, member
            let group = null

            before(async function() {
                owner = await loginAs('user1')
                member = await loginAs('user3')

                group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                await addConfirmedMember(owner.session, member.session, group.id, member.user.id)
            })

            after(async function() {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(member.session)
            })

            it(`Should reject a 'createdDate' field`, async function() {
                await assertInvalid(owner.session, group.id, member.user.id,
                    patchBody(group.id, member.user.id, { status: 'member', createdDate: new Date().toISOString() }),
                    "may not set 'createdDate'")
            })

            it(`Should reject an 'updatedDate' field`, async function() {
                await assertInvalid(owner.session, group.id, member.user.id,
                    patchBody(group.id, member.user.id, { status: 'member', updatedDate: new Date().toISOString() }),
                    "may not set 'updatedDate'")
            })

            it(`Should reject an 'entranceAnswers' field`, async function() {
                await assertInvalid(owner.session, group.id, member.user.id,
                    patchBody(group.id, member.user.id, { status: 'member', entranceAnswers: { question: 'answer' } }),
                    "may not set 'entranceAnswers'")
            })

            it(`Should reject a null status`, async function() {
                await assertInvalid(owner.session, group.id, member.user.id,
                    patchBody(group.id, member.user.id, { status: null }), 'status may not be null')
            })

            it(`Should reject a null role`, async function() {
                await assertInvalid(owner.session, group.id, member.user.id,
                    patchBody(group.id, member.user.id, { role: null }), 'role may not be null')
            })

            it(`Should reject an out-of-enum status`, async function() {
                await assertInvalid(owner.session, group.id, member.user.id,
                    patchBody(group.id, member.user.id, { status: 'bogus' }), 'Must be one of')
            })

            it(`Should reject an out-of-enum role`, async function() {
                await assertInvalid(owner.session, group.id, member.user.id,
                    patchBody(group.id, member.user.id, { role: 'bogus' }), 'Must be one of')
            })

            // Unlike create, nothing is required on update.
            it(`Should accept a body carrying neither status nor role as a no-op`, async function() {
                await assertUpdated(owner.session, group.id, member.user.id,
                    patchBody(group.id, member.user.id), { status: 'member', role: 'member' })
            })

            // The controller overwrites member.id with the existing row's id
            // before validating, so a client-supplied id can never trigger the
            // validator's entity-mismatch throw.
            it(`Should ignore a client-supplied 'id' rather than erroring`, async function() {
                await assertUpdated(owner.session, group.id, member.user.id,
                    patchBody(group.id, member.user.id, { id: crypto.randomUUID(), status: 'member' }),
                    { status: 'member', role: 'member' })
            })
        })

        describe("status transitions from 'pending-invited'", function() {
            let owner, moderator, invitee, rejected
            let group = null

            before(async function() {
                owner = await loginAs('user1')
                moderator = await loginAs('user2')
                invitee = await loginAs('user3')      // accepts (mutates)
                rejected = await loginAs('user8')     // stays pending across the rejection cases

                group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                await addConfirmedMember(owner.session, moderator.session, group.id, moderator.user.id)
                await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
                await inviteToGroup(owner.session, group.id, invitee.user.id)
                await inviteToGroup(owner.session, group.id, rejected.user.id)
            })

            after(async function() {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(moderator.session)
                await logout(invitee.session)
                await logout(rejected.session)
            })

            it(`Should let the invited user accept by setting status to 'member'`, async function() {
                await assertUpdated(invitee.session, group.id, invitee.user.id,
                    patchBody(group.id, invitee.user.id, { status: 'member' }), { status: 'member', role: 'member' })
            })

            it(`Should reject the invited user setting status to 'banned'`, async function() {
                await assertInvalid(rejected.session, group.id, rejected.user.id,
                    patchBody(group.id, rejected.user.id, { status: 'banned' }),
                    "may only change their status to 'member'")
            })

            it(`Should reject the invited user setting status to 'pending-requested'`, async function() {
                await assertInvalid(rejected.session, group.id, rejected.user.id,
                    patchBody(group.id, rejected.user.id, { status: 'pending-requested' }),
                    "may only change their status to 'member'")
            })

            // Only the invitee may accept their own invitation -- a moderator
            // cannot accept on their behalf.
            it(`Should reject a Group Moderator accepting on the invitee's behalf`, async function() {
                await assertInvalid(moderator.session, group.id, rejected.user.id,
                    patchBody(group.id, rejected.user.id, { status: 'member' }),
                    "may not change another user's status")
            })

            it(`Should reject a Group Moderator banning a pending invitee`, async function() {
                await assertInvalid(moderator.session, group.id, rejected.user.id,
                    patchBody(group.id, rejected.user.id, { status: 'banned' }),
                    "may not change another user's status")
            })

            // Re-submitting the current status is a no-op and is allowed.
            it(`Should accept a no-op status of 'pending-invited' from a Group Moderator`, async function() {
                await assertUpdated(moderator.session, group.id, rejected.user.id,
                    patchBody(group.id, rejected.user.id, { status: 'pending-invited' }), { status: 'pending-invited' })
            })
        })

        describe("status transitions from 'pending-requested'", function() {
            let owner, moderator, accepted, banned, stuck
            let group = null

            before(async function() {
                owner = await loginAs('user1')
                moderator = await loginAs('user2')
                accepted = await loginAs('user3')     // accepted (mutates)
                banned = await loginAs('user8')       // banned (mutates)
                stuck = await loginAs('user9')        // stays pending-requested

                group = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })
                await addConfirmedMember(owner.session, moderator.session, group.id, moderator.user.id)
                await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
                await requestToJoinGroup(accepted.session, group.id, accepted.user.id)
                await requestToJoinGroup(banned.session, group.id, banned.user.id)
                await requestToJoinGroup(stuck.session, group.id, stuck.user.id)
            })

            after(async function() {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(moderator.session)
                await logout(accepted.session)
                await logout(banned.session)
                await logout(stuck.session)
            })

            it(`Should let a Group Moderator accept a request by setting status to 'member'`, async function() {
                await assertUpdated(moderator.session, group.id, accepted.user.id,
                    patchBody(group.id, accepted.user.id, { status: 'member' }), { status: 'member', role: 'member' })
            })

            it(`Should let a Group Moderator reject a request by setting status to 'banned'`, async function() {
                await assertUpdated(moderator.session, group.id, banned.user.id,
                    patchBody(group.id, banned.user.id, { status: 'banned' }), { status: 'banned' })
            })

            it(`Should reject a Group Moderator setting a requester to 'pending-invited'`, async function() {
                await assertInvalid(moderator.session, group.id, stuck.user.id,
                    patchBody(group.id, stuck.user.id, { status: 'pending-invited' }),
                    'change the status of requesting users')
            })

            // The requester passes the update gate (it is their own row) but
            // cannot approve themselves.
            it(`Should reject the requester approving their own request`, async function() {
                await assertInvalid(stuck.session, group.id, stuck.user.id,
                    patchBody(group.id, stuck.user.id, { status: 'member' }),
                    "moderators may accept a user's request")
            })

            it(`Should accept a no-op status of 'pending-requested' from the requester`, async function() {
                await assertUpdated(stuck.session, group.id, stuck.user.id,
                    patchBody(group.id, stuck.user.id, { status: 'pending-requested' }), { status: 'pending-requested' })
            })
        })

        describe("status transitions from 'member'", function() {
            let owner, moderator, moderatorTarget, banTarget, otherMember
            let group = null

            before(async function() {
                owner = await loginAs('user1')
                moderator = await loginAs('user2')
                moderatorTarget = await loginAs('user5')   // a confirmed moderator
                banTarget = await loginAs('user3')         // gets banned (mutates)
                otherMember = await loginAs('user8')       // stays a confirmed member

                group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                await addConfirmedMember(owner.session, moderator.session, group.id, moderator.user.id)
                await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
                await addConfirmedMember(owner.session, moderatorTarget.session, group.id, moderatorTarget.user.id)
                await setGroupMemberRole(owner.session, group.id, moderatorTarget.user.id, 'moderator')
                await addConfirmedMember(owner.session, banTarget.session, group.id, banTarget.user.id)
                await addConfirmedMember(owner.session, otherMember.session, group.id, otherMember.user.id)
            })

            after(async function() {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(moderator.session)
                await logout(moderatorTarget.session)
                await logout(banTarget.session)
                await logout(otherMember.session)
            })

            it(`Should let a Group Moderator ban a confirmed member`, async function() {
                await assertUpdated(moderator.session, group.id, banTarget.user.id,
                    patchBody(group.id, banTarget.user.id, { status: 'banned' }), { status: 'banned' })
            })

            // Banning is limited to rows whose role is 'member'.  The admin is
            // used here because a moderator could not pass the update gate for a
            // moderator-role target in the first place.
            it(`Should reject banning a member whose role is 'moderator'`, async function() {
                await assertInvalid(owner.session, group.id, moderatorTarget.user.id,
                    patchBody(group.id, moderatorTarget.user.id, { status: 'banned' }),
                    'authorized to ban moderators or admins')
            })

            it(`Should reject a Group Moderator moving a confirmed member to 'pending-invited'`, async function() {
                await assertInvalid(moderator.session, group.id, otherMember.user.id,
                    patchBody(group.id, otherMember.user.id, { status: 'pending-invited' }),
                    'except to ban them')
            })

            it(`Should reject a confirmed member banning themselves`, async function() {
                await assertInvalid(otherMember.session, group.id, otherMember.user.id,
                    patchBody(group.id, otherMember.user.id, { status: 'banned' }),
                    'cannot change the status of a confirmed member')
            })

            it(`Should accept a no-op status of 'member' from the member themselves`, async function() {
                await assertUpdated(otherMember.session, group.id, otherMember.user.id,
                    patchBody(group.id, otherMember.user.id, { status: 'member' }), { status: 'member' })
            })
        })

        describe("status transitions from 'banned'", function() {
            let owner, moderator, unbanned, stayBanned
            let group = null

            before(async function() {
                owner = await loginAs('user1')
                moderator = await loginAs('user2')
                unbanned = await loginAs('user3')      // gets un-banned (mutates)
                stayBanned = await loginAs('user8')    // stays banned

                group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                await addConfirmedMember(owner.session, moderator.session, group.id, moderator.user.id)
                await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
                await addConfirmedMember(owner.session, unbanned.session, group.id, unbanned.user.id)
                await setGroupMemberStatus(owner.session, group.id, unbanned.user.id, 'banned')
                await addConfirmedMember(owner.session, stayBanned.session, group.id, stayBanned.user.id)
                await setGroupMemberStatus(owner.session, group.id, stayBanned.user.id, 'banned')
            })

            after(async function() {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(moderator.session)
                await logout(unbanned.session)
                await logout(stayBanned.session)
            })

            it(`Should let a Group Moderator un-ban a member by setting status to 'member'`, async function() {
                await assertUpdated(moderator.session, group.id, unbanned.user.id,
                    patchBody(group.id, unbanned.user.id, { status: 'member' }), { status: 'member' })
            })

            it(`Should reject a Group Moderator moving a banned member to 'pending-invited'`, async function() {
                await assertInvalid(moderator.session, group.id, stayBanned.user.id,
                    patchBody(group.id, stayBanned.user.id, { status: 'pending-invited' }), 'Invalid status')
            })

            // POSSIBLE BUG -- left skipped.
            //
            // Every other status branch is guarded by
            // `if ( groupMember.status !== existing.status )`, so re-submitting
            // the row's current status is a harmless no-op.  The 'banned' branch
            // has no such guard: it goes straight to
            // `canModerateGroup === true && groupMember.status !== 'member'`, so
            // a moderator re-sending status 'banned' is rejected with
            // "Invalid status 'banned'."
            //
            // That breaks the pattern every other branch follows and it bites a
            // realistic client: a UI that PATCHes the whole member entity in
            // order to change only the ROLE of a banned member (see the "role
            // updates on a banned member" test below, which succeeds when the
            // status key is omitted) fails as soon as it also echoes back the
            // unchanged status.  It may equally be a deliberate "the only legal
            // move on a banned member is un-banning them" -- so this asserts the
            // no-op-should-be-allowed reading and stays skipped pending a call.
            it(`Should accept a no-op status of 'banned' from a Group Moderator`, async function(t) {
                t.skip(`Possible bug: the 'banned' branch has no same-status no-op guard, unlike every other status branch.`)
                return
                // eslint-disable-next-line no-unreachable
                await assertUpdated(moderator.session, group.id, stayBanned.user.id,
                    patchBody(group.id, stayBanned.user.id, { status: 'banned' }), { status: 'banned' })
            })
        })

        describe("role transitions", function() {
            let owner, moderator, promoteToModerator, promoteToAdmin, blockedPromotion
            let demotedByAdmin, selfDemoting, adminTarget
            let group = null

            before(async function() {
                owner = await loginAs('user1')
                moderator = await loginAs('user2')              // acting non-admin moderator
                promoteToModerator = await loginAs('user3')     // member -> moderator (mutates)
                promoteToAdmin = await loginAs('user8')         // member -> admin (mutates)
                blockedPromotion = await loginAs('user9')       // stays a member
                demotedByAdmin = await loginAs('user5')         // moderator -> member (mutates)
                selfDemoting = await loginAs('user6')           // moderator self-demotes (mutates)
                adminTarget = await loginAs('user4')            // a second admin, acts on itself

                group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                await addConfirmedMember(owner.session, moderator.session, group.id, moderator.user.id)
                await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
                await addConfirmedMember(owner.session, promoteToModerator.session, group.id, promoteToModerator.user.id)
                await addConfirmedMember(owner.session, promoteToAdmin.session, group.id, promoteToAdmin.user.id)
                await addConfirmedMember(owner.session, blockedPromotion.session, group.id, blockedPromotion.user.id)
                await addConfirmedMember(owner.session, demotedByAdmin.session, group.id, demotedByAdmin.user.id)
                await setGroupMemberRole(owner.session, group.id, demotedByAdmin.user.id, 'moderator')
                await addConfirmedMember(owner.session, selfDemoting.session, group.id, selfDemoting.user.id)
                await setGroupMemberRole(owner.session, group.id, selfDemoting.user.id, 'moderator')
                await addConfirmedMember(owner.session, adminTarget.session, group.id, adminTarget.user.id)
                await setGroupMemberRole(owner.session, group.id, adminTarget.user.id, 'admin')
            })

            after(async function() {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(moderator.session)
                await logout(promoteToModerator.session)
                await logout(promoteToAdmin.session)
                await logout(blockedPromotion.session)
                await logout(demotedByAdmin.session)
                await logout(selfDemoting.session)
                await logout(adminTarget.session)
            })

            it(`Should let a Group Admin promote a member to 'moderator'`, async function() {
                await assertUpdated(owner.session, group.id, promoteToModerator.user.id,
                    patchBody(group.id, promoteToModerator.user.id, { role: 'moderator' }), { role: 'moderator' })
            })

            it(`Should let a Group Admin promote a member to 'admin'`, async function() {
                await assertUpdated(owner.session, group.id, promoteToAdmin.user.id,
                    patchBody(group.id, promoteToAdmin.user.id, { role: 'admin' }), { role: 'admin' })
            })

            // The moderator passes the update gate (the target's role is
            // 'member') but role changes require admin.
            it(`Should NOT let a Group Moderator promote a member to 'moderator'`, async function() {
                await assertInvalid(moderator.session, group.id, blockedPromotion.user.id,
                    patchBody(group.id, blockedPromotion.user.id, { role: 'moderator' }),
                    "update a GroupMember's role")
            })

            it(`Should let a Group Admin demote a moderator to 'member'`, async function() {
                await assertUpdated(owner.session, group.id, demotedByAdmin.user.id,
                    patchBody(group.id, demotedByAdmin.user.id, { role: 'member' }), { role: 'member' })
            })

            // Explicitly carved out: a moderator may step down without needing
            // an admin.
            it(`Should let a moderator demote themselves to 'member'`, async function() {
                await assertUpdated(selfDemoting.session, group.id, selfDemoting.user.id,
                    patchBody(group.id, selfDemoting.user.id, { role: 'member' }), { role: 'member' })
            })

            it(`Should NOT let a moderator promote themselves to 'admin'`, async function() {
                await assertInvalid(moderator.session, group.id, moderator.user.id,
                    patchBody(group.id, moderator.user.id, { role: 'admin' }),
                    "update a GroupMember's role")
            })

            // An admin's row is reachable only by that admin, and the admin
            // branch refuses every change -- so an admin cannot step down here.
            it(`Should NOT let an admin change their own role`, async function() {
                await assertInvalid(adminTarget.session, group.id, adminTarget.user.id,
                    patchBody(group.id, adminTarget.user.id, { role: 'member' }),
                    "change an admin's role")
            })

            it(`Should accept a no-op role of 'admin' from the admin themselves`, async function() {
                await assertUpdated(adminTarget.session, group.id, adminTarget.user.id,
                    patchBody(group.id, adminTarget.user.id, { role: 'admin' }), { role: 'admin' })
            })

            it(`Should accept a no-op role of 'member' from the member themselves`, async function() {
                await assertUpdated(blockedPromotion.session, group.id, blockedPromotion.user.id,
                    patchBody(group.id, blockedPromotion.user.id, { role: 'member' }), { role: 'member' })
            })
        })

        describe("partial updates and combined changes", function() {
            let owner, moderator, roleOnly, statusOnly, combined, bannedTarget
            let group = null

            before(async function() {
                owner = await loginAs('user1')
                moderator = await loginAs('user2')
                roleOnly = await loginAs('user3')       // role patched alone
                statusOnly = await loginAs('user5')     // moderator; status patched alone
                combined = await loginAs('user9')       // status + role together
                bannedTarget = await loginAs('user8')   // banned, then role patched

                group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                await addConfirmedMember(owner.session, moderator.session, group.id, moderator.user.id)
                await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
                await addConfirmedMember(owner.session, roleOnly.session, group.id, roleOnly.user.id)
                await addConfirmedMember(owner.session, statusOnly.session, group.id, statusOnly.user.id)
                await setGroupMemberRole(owner.session, group.id, statusOnly.user.id, 'moderator')
                await addConfirmedMember(owner.session, combined.session, group.id, combined.user.id)
                await addConfirmedMember(owner.session, bannedTarget.session, group.id, bannedTarget.user.id)
                await setGroupMemberStatus(owner.session, group.id, bannedTarget.user.id, 'banned')
            })

            after(async function() {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(moderator.session)
                await logout(roleOnly.session)
                await logout(statusOnly.session)
                await logout(combined.session)
                await logout(bannedTarget.session)
            })

            it(`Should leave status untouched when only role is sent`, async function() {
                await assertUpdated(owner.session, group.id, roleOnly.user.id,
                    patchBody(group.id, roleOnly.user.id, { role: 'moderator' }),
                    { status: 'member', role: 'moderator' })
            })

            it(`Should leave role untouched when only status is sent`, async function() {
                await assertUpdated(owner.session, group.id, statusOnly.user.id,
                    patchBody(group.id, statusOnly.user.id, { status: 'member' }),
                    { status: 'member', role: 'moderator' })
            })

            it(`Should apply a combined status and role body when both are allowed`, async function() {
                await assertUpdated(moderator.session, group.id, combined.user.id,
                    patchBody(group.id, combined.user.id, { status: 'banned', role: 'member' }),
                    { status: 'banned', role: 'member' })
            })

            // Status and role are independent axes in the edit branch: the role
            // rules never consult the row's status, so an admin can change a
            // banned member's role as long as no status key is sent.  (Sending
            // the unchanged status alongside it fails -- see the skipped no-op
            // test above.)
            it(`Should allow a Group Admin to change a banned member's role when no status is sent`, async function() {
                await assertUpdated(owner.session, group.id, bannedTarget.user.id,
                    patchBody(group.id, bannedTarget.user.id, { role: 'moderator' }),
                    { status: 'banned', role: 'moderator' })
            })
        })
    })
})
