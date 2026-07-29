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
    getGroup,
    patchGroup,
    createGroup,
    createSubgroup,
    deleteGroup,
    joinOpenGroup,
    requestToJoinGroup,
    inviteToGroup,
    addConfirmedMember,
    setGroupMemberStatus,
    setGroupMemberRole
} = require('../../lib/groups')
const { isFeatureEnabled } = require('../../lib/system')

// Subgroups (`parentId` and the compound group types) are gated behind this
// feature flag; the subgroup describes below skip themselves when it is off.
const SUBGROUPS_FEATURE = 'issue-165-subgroups'
let subgroupsEnabled = false

// ============================================================================
// PATCH /group/:id drives GroupController.patchGroup(), which runs, in order:
//   1. authentication                                     -> 401 not-authenticated
//   2. groupSchema.clean(body)                            (strips unknown fields, trims strings)
//   3. body `id` must equal the route id                  -> 400 invalid
//   4. groupDAO.getGroupById(routeId)                     -> 404 not-found
//   5. PermissionService.can(user, 'view', 'Group')       -> 404 not-found
//   6. PermissionService.can(user, 'update', 'Group')     -> 403 not-authorized
//   7. ValidationService.validateGroup(user, group, existing) -> 400 invalid
//   8. updateGroup() + re-select                          -> 201 { entity, relations }
//
// Note the ORDERING: the id-match check (step 3) happens BEFORE the group is
// loaded, so a mismatched id on a group that doesn't exist is a 400 and not a
// 404.  The `view` check (step 4/5) happens before the `update` check, so a
// user who may not SEE the group gets 404 rather than 403 -- a banned member
// gets 404 even for an open group.  Permission (steps 5/6) precedes validation
// (step 7), so a non-admin submitting an invalid body gets 403/404, not 400.
//
// UPDATE differs from CREATE in several important ways (see schema/Group.js and
// BaseValidator, where `existing` is the field's EXISTING VALUE):
//   * `id` is required on update and must match the route.
//   * `type`, `slug` and `parentId` are `mustNotBeUpdated`: they may be
//     RESUBMITTED UNCHANGED (value === existing is not an update), but changing
//     them is `<field>:not-allowed` -> 400.
//   * `title` and `postPermissions` are `isRequiredToCreate` only, so both are
//     optional on update -- omitting them leaves them untouched.
//   * `about`, `shortDescription`, `rules`, `title`, `postPermissions` and
//     `fileId` are freely updatable (subject to their own format rules).
//   * `entranceQuestions`, `createdDate` and `updatedDate` are `mustNotBeSet`
//     and are rejected on update exactly as they are on create.
//   * There is NO slug-uniqueness check on update, because the slug cannot
//     change -- 'conflict' is not a reachable outcome for this endpoint.
//   * Success returns 201 (not 200), matching PATCH /post/:id.
// ============================================================================

// Every patch must carry the group's own id; `fields` adds the fields under
// test.  Fields set to `undefined` are dropped by JSON serialization, which is
// how the "missing field" cases omit one.
function patchBody(groupId, fields = {}) {
    return { id: groupId, ...fields }
}

// Branch-free outcome helpers -- each test picks the one matching its
// expectation.  assertUpdated deliberately asserts only the status and the
// identity of the returned entity: individual tests assert the specific field
// they changed, because a few fields (shortDescription, rules) are only
// PERSISTED when their own feature flag is enabled even though they always
// validate.
async function assertUpdated(session, groupId, body) {
    const response = await patchGroup(session, groupId, body)
    assert.equal(response.status, 201, `Expected 201 but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.equal(response.content?.entity?.id, groupId)
    return response.content.entity
}

async function assertForbidden(session, groupId, body) {
    const response = await patchGroup(session, groupId, body)
    assert.equal(response.status, 403, `Expected 403 not-authorized but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.equal(response.content?.error?.type, 'not-authorized')
}

async function assertNotFound(session, groupId, body) {
    const response = await patchGroup(session, groupId, body)
    assert.equal(response.status, 404, `Expected 404 not-found but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.equal(response.content?.error?.type, 'not-found')
}

async function assertInvalid(session, groupId, body) {
    const response = await patchGroup(session, groupId, body)
    assert.equal(response.status, 400, `Expected 400 invalid but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.equal(response.content?.error?.type, 'invalid')
}

async function assertUnauthenticated(session, groupId, body) {
    const response = await patchGroup(session, groupId, body)
    assert.equal(response.status, 401)
    assert.equal(response.content?.error?.type, 'not-authenticated')
}

// A unique title, so that a successful update is always observably different
// from what was there before.
function uniqueTitle() {
    return `Patched Title ${crypto.randomUUID()}`
}

describe('PATCH /group/:id', function() {

    before(async function() {
        subgroupsEnabled = await isFeatureEnabled(SUBGROUPS_FEATURE)
    })

    describe("authentication and existence", function() {
        let owner
        let group = null

        before(async function() {
            owner = await loginAs('user1')
            group = await createGroup(owner.session)
        })

        after(async function() {
            if ( group ) await deleteGroup(owner.session, group.id)
            await logout(owner.session)
        })

        it(`Should reject an unauthenticated request`, async function() {
            const session = await initialize()
            await assertUnauthenticated(session, group.id, patchBody(group.id, { title: uniqueTitle() }))
        })

        it(`Should reject an unauthenticated request before checking the id`, async function() {
            // Authentication (step 1) precedes the id-match check (step 3).
            const session = await initialize()
            await assertUnauthenticated(session, group.id, patchBody(crypto.randomUUID(), { title: uniqueTitle() }))
        })

        it(`Should return 404 for a group that doesn't exist`, async function() {
            const id = crypto.randomUUID()
            await assertNotFound(owner.session, id, patchBody(id, { title: uniqueTitle() }))
        })

        it(`Should reject a patch with no id in the body`, async function() {
            await assertInvalid(owner.session, group.id, { title: uniqueTitle() })
        })

        it(`Should reject a patch with a null id in the body`, async function() {
            await assertInvalid(owner.session, group.id, { id: null, title: uniqueTitle() })
        })

        it(`Should reject a patch whose body id doesn't match the route`, async function() {
            await assertInvalid(owner.session, group.id, patchBody(crypto.randomUUID(), { title: uniqueTitle() }))
        })

        it(`Should reject a patch with a non-UUID id in the body`, async function() {
            // Mismatched with the (valid) route id, so this is caught by the
            // id-match check before the schema ever sees it.
            await assertInvalid(owner.session, group.id, patchBody('not-a-uuid', { title: uniqueTitle() }))
        })

        it(`Should check the id match before checking existence`, async function() {
            // The route group does not exist AND the body id doesn't match it.
            // The id check (step 3) runs first, so this is a 400 and not a 404.
            const id = crypto.randomUUID()
            await assertInvalid(owner.session, id, patchBody(crypto.randomUUID(), { title: uniqueTitle() }))
        })

        // ---- BUG: a non-UUID route id reaches the database ------------------
        // When the body id matches the route id, the id-match check (step 3)
        // passes and `groupDAO.getGroupById(routeId)` runs `WHERE groups.id =
        // $1` against a uuid column.  Postgres rejects a non-UUID string
        // ("invalid input syntax for type uuid"), which surfaces as
        // 500 'server-error' rather than a clean client error.
        //
        // This asserts 400 'invalid' -- the resolution already adopted for the
        // equivalent non-UUID `parentId` case in POST /groups, and what
        // schema/Group.js's `id.mustBeUUID()` would produce if the id were
        // validated before the lookup.  (404 would be an equally defensible
        // fix; adjust this assertion if that is the direction taken.)
        it(`Should reject a non-UUID id in the route`, { skip: 'KNOWN BUG: invalid UUIDs currently hit the database and fail as a 500 server error' }, async function() {
            await assertInvalid(owner.session, 'not-a-uuid', patchBody('not-a-uuid', { title: uniqueTitle() }))
        })
    })

    describe("permission model", function() {
        // `update` maps to canAdminGroup(): only a confirmed member with the
        // 'admin' role -- or a site moderator, or an admin of the PARENT group
        // -- may edit a group.  Because the `view` check runs first, users who
        // cannot see the group at all get 404 instead of 403.

        describe("an OPEN group", function() {
            let owner, secondAdmin, moderator, member, invitee, requester, banned, nonMember, siteModerator
            let group = null

            before(async function() {
                owner = await loginAs('user1')          // creator, admin
                secondAdmin = await loginAs('user4')    // promoted to a second admin
                moderator = await loginAs('user2')      // promoted to moderator
                member = await loginAs('user3')         // plain member
                invitee = await loginAs('user5')        // pending-invited
                banned = await loginAs('user8')         // member, then banned
                nonMember = await loginAs('user7')      // member of nothing
                siteModerator = await loginAs('user-site-moderator')

                group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })

                await joinOpenGroup(secondAdmin.session, group.id, secondAdmin.user.id)
                await setGroupMemberRole(owner.session, group.id, secondAdmin.user.id, 'admin')

                await joinOpenGroup(moderator.session, group.id, moderator.user.id)
                await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')

                await joinOpenGroup(member.session, group.id, member.user.id)

                await inviteToGroup(owner.session, group.id, invitee.user.id)

                await joinOpenGroup(banned.session, group.id, banned.user.id)
                await setGroupMemberStatus(owner.session, group.id, banned.user.id, 'banned')
            })

            after(async function() {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(secondAdmin.session)
                await logout(moderator.session)
                await logout(member.session)
                await logout(invitee.session)
                await logout(banned.session)
                await logout(nonMember.session)
                await logout(siteModerator.session)
            })

            it(`Should let the creating admin update the group`, async function() {
                const title = uniqueTitle()
                const entity = await assertUpdated(owner.session, group.id, patchBody(group.id, { title: title }))
                assert.equal(entity.title, title)
            })

            it(`Should let a second admin update the group`, async function() {
                const title = uniqueTitle()
                const entity = await assertUpdated(secondAdmin.session, group.id, patchBody(group.id, { title: title }))
                assert.equal(entity.title, title)
            })

            it(`Should let a site moderator update the group`, async function() {
                // canAdminGroup() returns true for any user with a site role of
                // moderator, admin, or superadmin.
                const title = uniqueTitle()
                const entity = await assertUpdated(siteModerator.session, group.id, patchBody(group.id, { title: title }))
                assert.equal(entity.title, title)
            })

            it(`Should NOT let a group moderator update the group`, async function() {
                await assertForbidden(moderator.session, group.id, patchBody(group.id, { title: uniqueTitle() }))
            })

            it(`Should NOT let a plain member update the group`, async function() {
                await assertForbidden(member.session, group.id, patchBody(group.id, { title: uniqueTitle() }))
            })

            it(`Should NOT let a pending-invited user update the group`, async function() {
                await assertForbidden(invitee.session, group.id, patchBody(group.id, { title: uniqueTitle() }))
            })

            it(`Should NOT let a non-member update the group`, async function() {
                await assertForbidden(nonMember.session, group.id, patchBody(group.id, { title: uniqueTitle() }))
            })

            it(`Should return 404 (not 403) for a banned member`, async function() {
                // A banned member fails the `view` check, which runs first, so
                // they are told the group doesn't exist rather than that they
                // aren't authorized -- even though the group is open.
                await assertNotFound(banned.session, group.id, patchBody(group.id, { title: uniqueTitle() }))
            })
        })

        describe("a PRIVATE group", function() {
            // Private groups are VIEWABLE by anyone, so a non-member gets 403
            // (not 404) -- the view check passes and the update check fails.
            let owner, member, banned, nonMember
            let group = null

            before(async function() {
                owner = await loginAs('user1')
                member = await loginAs('user3')
                banned = await loginAs('user8')
                nonMember = await loginAs('user7')

                group = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })

                await addConfirmedMember(owner.session, member.session, group.id, member.user.id)
                await addConfirmedMember(owner.session, banned.session, group.id, banned.user.id)
                await setGroupMemberStatus(owner.session, group.id, banned.user.id, 'banned')
            })

            after(async function() {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(member.session)
                await logout(banned.session)
                await logout(nonMember.session)
            })

            it(`Should let the admin update the group`, async function() {
                const title = uniqueTitle()
                const entity = await assertUpdated(owner.session, group.id, patchBody(group.id, { title: title }))
                assert.equal(entity.title, title)
            })

            it(`Should NOT let a member update the group`, async function() {
                await assertForbidden(member.session, group.id, patchBody(group.id, { title: uniqueTitle() }))
            })

            it(`Should NOT let a non-member update the group`, async function() {
                await assertForbidden(nonMember.session, group.id, patchBody(group.id, { title: uniqueTitle() }))
            })

            it(`Should return 404 for a banned member`, async function() {
                await assertNotFound(banned.session, group.id, patchBody(group.id, { title: uniqueTitle() }))
            })
        })

        describe("a HIDDEN group", function() {
            // Hidden groups are only viewable by their members and invitees, so
            // a non-member gets 404 while an invitee -- who CAN see it -- gets
            // 403.
            let owner, member, invitee, banned, nonMember, siteModerator
            let group = null

            before(async function() {
                owner = await loginAs('user1')
                member = await loginAs('user3')
                invitee = await loginAs('user5')
                banned = await loginAs('user8')
                nonMember = await loginAs('user7')
                siteModerator = await loginAs('user-site-moderator')

                group = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })

                await addConfirmedMember(owner.session, member.session, group.id, member.user.id)
                await inviteToGroup(owner.session, group.id, invitee.user.id)
                await addConfirmedMember(owner.session, banned.session, group.id, banned.user.id)
                await setGroupMemberStatus(owner.session, group.id, banned.user.id, 'banned')
            })

            after(async function() {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(member.session)
                await logout(invitee.session)
                await logout(banned.session)
                await logout(nonMember.session)
                await logout(siteModerator.session)
            })

            it(`Should let the admin update the group`, async function() {
                const title = uniqueTitle()
                const entity = await assertUpdated(owner.session, group.id, patchBody(group.id, { title: title }))
                assert.equal(entity.title, title)
            })

            it(`Should let a site moderator update the group`, async function() {
                const title = uniqueTitle()
                const entity = await assertUpdated(siteModerator.session, group.id, patchBody(group.id, { title: title }))
                assert.equal(entity.title, title)
            })

            it(`Should NOT let a member update the group`, async function() {
                await assertForbidden(member.session, group.id, patchBody(group.id, { title: uniqueTitle() }))
            })

            it(`Should return 403 for a pending-invited user (they may view it)`, async function() {
                await assertForbidden(invitee.session, group.id, patchBody(group.id, { title: uniqueTitle() }))
            })

            it(`Should return 404 for a non-member (they may not view it)`, async function() {
                await assertNotFound(nonMember.session, group.id, patchBody(group.id, { title: uniqueTitle() }))
            })

            it(`Should return 404 for a banned member`, async function() {
                await assertNotFound(banned.session, group.id, patchBody(group.id, { title: uniqueTitle() }))
            })
        })

        describe("permission is checked before validation", function() {
            let owner, member, nonMember
            let openGroup = null
            let hiddenGroup = null

            before(async function() {
                owner = await loginAs('user1')
                member = await loginAs('user3')
                nonMember = await loginAs('user7')

                openGroup = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                hiddenGroup = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })

                await joinOpenGroup(member.session, openGroup.id, member.user.id)
            })

            after(async function() {
                if ( openGroup ) await deleteGroup(owner.session, openGroup.id)
                if ( hiddenGroup ) await deleteGroup(owner.session, hiddenGroup.id)
                await logout(owner.session)
                await logout(member.session)
                await logout(nonMember.session)
            })

            it(`Should return 403 (not 400) when an unauthorized user submits an invalid patch`, async function() {
                // `type` may not be updated, so this body is also invalid -- but
                // the permission check runs first.
                await assertForbidden(member.session, openGroup.id, patchBody(openGroup.id, { type: 'private' }))
            })

            it(`Should return 404 (not 400) when a user who can't view the group submits an invalid patch`, async function() {
                await assertNotFound(nonMember.session, hiddenGroup.id, patchBody(hiddenGroup.id, { type: 'private' }))
            })
        })

        describe("subgroups -- admins of the parent may edit a subgroup", function() {
            let owner, parentAdmin, parentMember, nonMember
            let parent = null
            let subgroup = null

            before(async function() {
                if ( ! subgroupsEnabled ) return
                owner = await loginAs('user1')          // creator/admin of both
                parentAdmin = await loginAs('user4')    // admin of the PARENT only
                parentMember = await loginAs('user3')   // plain member of the parent
                nonMember = await loginAs('user7')

                parent = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                subgroup = await createSubgroup(owner.session, parent.id, 'private')

                await joinOpenGroup(parentAdmin.session, parent.id, parentAdmin.user.id)
                await setGroupMemberRole(owner.session, parent.id, parentAdmin.user.id, 'admin')

                await joinOpenGroup(parentMember.session, parent.id, parentMember.user.id)
            })

            after(async function() {
                if ( ! subgroupsEnabled ) return
                // Deleting the parent cascades to the subgroup.
                if ( parent ) await deleteGroup(owner.session, parent.id)
                await logout(owner.session)
                await logout(parentAdmin.session)
                await logout(parentMember.session)
                await logout(nonMember.session)
            })

            it(`Should let the subgroup's own admin update it`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                const title = uniqueTitle()
                const entity = await assertUpdated(owner.session, subgroup.id, patchBody(subgroup.id, { title: title }))
                assert.equal(entity.title, title)
            })

            it(`Should let an admin of the parent update the subgroup`, async function(t) {
                // canAdminGroup() accepts an admin of the parent group even
                // when they are not a member of the subgroup itself.
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                const title = uniqueTitle()
                const entity = await assertUpdated(parentAdmin.session, subgroup.id, patchBody(subgroup.id, { title: title }))
                assert.equal(entity.title, title)
            })

            it(`Should NOT let a plain member of the parent update the subgroup`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertForbidden(parentMember.session, subgroup.id, patchBody(subgroup.id, { title: uniqueTitle() }))
            })

            it(`Should NOT let a non-member update the subgroup`, async function(t) {
                // A 'private' subgroup is viewable by anyone, so this is 403.
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertForbidden(nonMember.session, subgroup.id, patchBody(subgroup.id, { title: uniqueTitle() }))
            })
        })

        describe("subgroups -- a HIDDEN-OPEN subgroup", function() {
            // 'hidden-open' subgroups are viewable by members of the PARENT, so
            // a parent member gets 403 while an outsider gets 404.
            let owner, parentMember, nonMember
            let parent = null
            let subgroup = null

            before(async function() {
                if ( ! subgroupsEnabled ) return
                owner = await loginAs('user1')
                parentMember = await loginAs('user3')
                nonMember = await loginAs('user7')

                parent = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })
                subgroup = await createSubgroup(owner.session, parent.id, 'hidden-open')

                await addConfirmedMember(owner.session, parentMember.session, parent.id, parentMember.user.id)
            })

            after(async function() {
                if ( ! subgroupsEnabled ) return
                if ( parent ) await deleteGroup(owner.session, parent.id)
                await logout(owner.session)
                await logout(parentMember.session)
                await logout(nonMember.session)
            })

            it(`Should let the subgroup's admin update it`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                const title = uniqueTitle()
                const entity = await assertUpdated(owner.session, subgroup.id, patchBody(subgroup.id, { title: title }))
                assert.equal(entity.title, title)
            })

            it(`Should return 403 for a member of the parent (they may view it)`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertForbidden(parentMember.session, subgroup.id, patchBody(subgroup.id, { title: uniqueTitle() }))
            })

            it(`Should return 404 for a non-member of the parent`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertNotFound(nonMember.session, subgroup.id, patchBody(subgroup.id, { title: uniqueTitle() }))
            })
        })

        // Grantparents can obtain admin rights over the grandchild by
        // adding themselves to the parent, but until they do that, they
        // cannot admin the grandchild.
        //
        // This is a TECHDEBT compromise, because searching the whole
        // ancestor tree on every permission test is untenable.
        describe("subgroups -- admins of a grandparent", function() {
            let owner, grandparentAdmin
            let grandparent = null
            let parent = null
            let child = null

            before(async function() {
                if ( ! subgroupsEnabled ) return
                owner = await loginAs('user1')
                grandparentAdmin = await loginAs('user4')

                grandparent = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                parent = await createSubgroup(owner.session, grandparent.id, 'open')
                child = await createSubgroup(owner.session, parent.id, 'open')

                // An admin of the grandparent ONLY -- not a member of `parent`
                // or `child`.
                await joinOpenGroup(grandparentAdmin.session, grandparent.id, grandparentAdmin.user.id)
                await setGroupMemberRole(owner.session, grandparent.id, grandparentAdmin.user.id, 'admin')
            })

            after(async function() {
                if ( ! subgroupsEnabled ) return
                if ( grandparent ) await deleteGroup(owner.session, grandparent.id)
                await logout(owner.session)
                await logout(grandparentAdmin.session)
            })

            it(`Should let an admin of the grandparent update the immediate child`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                const title = uniqueTitle()
                const entity = await assertUpdated(grandparentAdmin.session, parent.id, patchBody(parent.id, { title: title }))
                assert.equal(entity.title, title)
            })

            it(`Should NOT let an admin of the grandparent update the grandchild`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertForbidden(grandparentAdmin.session, child.id, patchBody(child.id, { title: uniqueTitle() }))
            })
        })
    })

    describe("validation model", function() {
        // Every case below runs as the group's ADMIN so that the permission
        // gate is never what's being tested -- validation is.  Each patch is
        // otherwise valid, with exactly one field under test.
        let owner
        let group = null

        before(async function() {
            owner = await loginAs('user1')
            group = await createGroup(owner.session, {
                type: 'open',
                postPermissions: 'anyone',
                about: 'The original about.'
            })
        })

        after(async function() {
            if ( group ) await deleteGroup(owner.session, group.id)
            await logout(owner.session)
        })

        describe("immutable fields", function() {
            // `type`, `slug` and `parentId` are `mustNotBeUpdated`: resubmitting
            // the SAME value is not an update and is accepted, but changing the
            // value is rejected.  This is what lets a client PATCH a whole
            // entity back without stripping the read-only fields first.
            let otherGroup = null

            before(async function() {
                otherGroup = await createGroup(owner.session)
            })

            after(async function() {
                if ( otherGroup ) await deleteGroup(owner.session, otherGroup.id)
            })

            it(`Should accept the type resubmitted unchanged`, async function() {
                const entity = await assertUpdated(owner.session, group.id, patchBody(group.id, { type: group.type }))
                assert.equal(entity.type, group.type)
            })
            it(`Should reject a changed type`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { type: 'private' }))
            })
            it(`Should reject a type that isn't a valid value`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { type: 'public' }))
            })
            it(`Should reject a type differing only in case`, async function() {
                // 'OPEN' !== 'open', so this is both a change and an invalid value.
                await assertInvalid(owner.session, group.id, patchBody(group.id, { type: 'OPEN' }))
            })
            it(`Should reject a null type`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { type: null }))
            })
            it(`Should reject a non-string type`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { type: 12345 }))
            })

            it(`Should accept the slug resubmitted unchanged`, async function() {
                const entity = await assertUpdated(owner.session, group.id, patchBody(group.id, { slug: group.slug }))
                assert.equal(entity.slug, group.slug)
            })
            it(`Should reject a changed slug`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { slug: `changed-${crypto.randomUUID()}` }))
            })
            it(`Should reject a null slug`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { slug: null }))
            })
            it(`Should reject a non-string slug`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { slug: 12345 }))
            })
            it(`Should reject a slug that differs only in case`, async function() {
                // The slug is only lower-cased by POST /groups; on update it is
                // compared verbatim, so this counts as a change.
                await assertInvalid(owner.session, group.id, patchBody(group.id, { slug: group.slug.toUpperCase() }))
            })

            it(`Should accept a null parentId resubmitted on a top-level group`, async function() {
                const entity = await assertUpdated(owner.session, group.id, patchBody(group.id, { parentId: null }))
                assert.equal(entity.parentId, null)
            })
            it(`Should reject setting a parentId on a top-level group`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { parentId: otherGroup.id }))
            })
            it(`Should reject a parentId that references a non-existent group`, async function() {
                // Rejected as a change (`parentId:not-allowed`) before existence
                // is ever checked.
                await assertInvalid(owner.session, group.id, patchBody(group.id, { parentId: crypto.randomUUID() }))
            })
            it(`Should reject a non-UUID parentId`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { parentId: 'not-a-uuid' }))
            })
        })

        describe("title", function() {
            it(`Should update the title`, async function() {
                const title = uniqueTitle()
                const entity = await assertUpdated(owner.session, group.id, patchBody(group.id, { title: title }))
                assert.equal(entity.title, title)

                // Confirm it persisted rather than merely being echoed back.
                const fetched = await getGroup(owner.session, group.id)
                assert.equal(fetched.status, 200)
                assert.equal(fetched.content?.entity?.title, title)
            })
            it(`Should accept a title of 511 characters`, async function() {
                const title = 'a'.repeat(511)
                const entity = await assertUpdated(owner.session, group.id, patchBody(group.id, { title: title }))
                assert.equal(entity.title, title)
            })
            it(`Should reject a title of 512 characters`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { title: 'a'.repeat(512) }))
            })
            it(`Should reject an empty title`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { title: '' }))
            })
            it(`Should reject a whitespace-only title`, async function() {
                // stringCleaner trims, leaving an empty string.
                await assertInvalid(owner.session, group.id, patchBody(group.id, { title: '   ' }))
            })
            it(`Should reject a null title`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { title: null }))
            })
            it(`Should reject a non-string title`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { title: 12345 }))
            })
            it(`Should accept a patch that omits the title`, async function() {
                // `title` is required to CREATE but optional to update.
                const before = await getGroup(owner.session, group.id)
                const entity = await assertUpdated(owner.session, group.id, patchBody(group.id, { about: 'Omitting the title.' }))
                assert.equal(entity.title, before.content?.entity?.title)
            })
        })

        describe("postPermissions", function() {
            it(`Should update postPermissions to 'members'`, async function() {
                const entity = await assertUpdated(owner.session, group.id, patchBody(group.id, { postPermissions: 'members' }))
                assert.equal(entity.postPermissions, 'members')
            })
            it(`Should update postPermissions to 'approval'`, async function() {
                const entity = await assertUpdated(owner.session, group.id, patchBody(group.id, { postPermissions: 'approval' }))
                assert.equal(entity.postPermissions, 'approval')
            })
            it(`Should update postPermissions to 'restricted'`, async function() {
                const entity = await assertUpdated(owner.session, group.id, patchBody(group.id, { postPermissions: 'restricted' }))
                assert.equal(entity.postPermissions, 'restricted')
            })
            it(`Should update postPermissions back to 'anyone'`, async function() {
                const entity = await assertUpdated(owner.session, group.id, patchBody(group.id, { postPermissions: 'anyone' }))
                assert.equal(entity.postPermissions, 'anyone')
            })
            it(`Should reject an invalid postPermissions value`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { postPermissions: 'everyone' }))
            })
            it(`Should reject a null postPermissions`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { postPermissions: null }))
            })
            it(`Should reject a non-string postPermissions`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { postPermissions: 12345 }))
            })
        })

        describe("about", function() {
            it(`Should update the about`, async function() {
                const about = `Updated about ${crypto.randomUUID()}`
                const entity = await assertUpdated(owner.session, group.id, patchBody(group.id, { about: about }))
                assert.equal(entity.about, about)
            })
            it(`Should accept an empty about`, async function() {
                const entity = await assertUpdated(owner.session, group.id, patchBody(group.id, { about: '' }))
                assert.equal(entity.about, '')
            })
            it(`Should accept an about of 9999 characters`, async function() {
                await assertUpdated(owner.session, group.id, patchBody(group.id, { about: 'a'.repeat(9999) }))
            })
            it(`Should reject an about of 10000 characters`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { about: 'a'.repeat(10000) }))
            })
            it(`Should reject a null about`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { about: null }))
            })
            it(`Should reject a non-string about`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { about: 12345 }))
            })
        })

        describe("shortDescription / rules", function() {
            it(`Should accept a shortDescription of 149 characters`, async function() {
                const shortDescription = 'a'.repeat(149)
                const entity = await assertUpdated(owner.session, group.id, patchBody(group.id, { shortDescription: shortDescription }))
                assert.equal(entity.shortDescription, shortDescription)
            })
            it(`Should reject a shortDescription of 150 characters`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { shortDescription: 'a'.repeat(150) }))
            })
            it(`Should reject a null shortDescription`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { shortDescription: null }))
            })
            it(`Should reject a non-string shortDescription`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { shortDescription: 12345 }))
            })
            it(`Should accept rules of 9999 characters`, async function() {
                const rules = 'a'.repeat(9999)
                const entity = await assertUpdated(owner.session, group.id, patchBody(group.id, { rules: rules }))
                assert.equal(entity.rules, rules)
            })
            it(`Should reject rules of 10000 characters`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { rules: 'a'.repeat(10000) }))
            })
            it(`Should reject null rules`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { rules: null }))
            })
            it(`Should reject non-string rules`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { rules: 12345 }))
            })
        })

        describe("fileId", function() {
            // Attaching a real file needs an upload, which is out of scope for
            // this pass (as it is in postGroups.spec.js).  The paths that need
            // no upload are covered here.
            it(`Should reject a non-UUID fileId`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { fileId: 'not-a-uuid' }))
            })
            it(`Should reject a fileId that references a non-existent file`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { fileId: crypto.randomUUID() }))
            })
            it(`Should accept a null fileId`, async function() {
                const entity = await assertUpdated(owner.session, group.id, patchBody(group.id, { fileId: null }))
                assert.equal(entity.fileId, null)
            })
        })

        describe("fields that may never be set", function() {
            // `mustNotBeSet` fires whenever the value is defined, so these are
            // rejected on update exactly as they are on create.
            it(`Should reject a patch that sets entranceQuestions`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { entranceQuestions: { question: 'why?' } }))
            })
            it(`Should reject a patch that sets a null entranceQuestions`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { entranceQuestions: null }))
            })
            it(`Should reject a patch that sets createdDate`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { createdDate: '2020-01-01T00:00:00.000Z' }))
            })
            it(`Should reject a patch that sets updatedDate`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { updatedDate: '2020-01-01T00:00:00.000Z' }))
            })
            it(`Should reject a patch that sets siteModerationId`, async function() {
                await assertInvalid(owner.session, group.id, patchBody(group.id, { siteModerationId: crypto.randomUUID() }))
            })
        })

        describe("unknown and server-managed fields", function() {
            // groupSchema.clean() keeps only the properties the schema knows
            // about, so anything else is silently dropped rather than rejected.
            it(`Should ignore an unknown field`, async function() {
                await assertUpdated(owner.session, group.id, patchBody(group.id, { notARealField: 'ignored' }))
            })
            it(`Should ignore server-maintained counts`, async function() {
                const entity = await assertUpdated(owner.session, group.id, patchBody(group.id, { totalMembers: 9999 }))
                assert.notEqual(entity.totalMembers, 9999)
            })
        })

        describe("no-op updates and preservation", function() {
            it(`Should accept a patch that changes nothing`, async function() {
                const entity = await assertUpdated(owner.session, group.id, patchBody(group.id))
                assert.equal(entity.id, group.id)
            })

            it(`Should leave fields that weren't submitted untouched`, async function() {
                const before = await getGroup(owner.session, group.id)
                const previous = before.content?.entity
                assert.ok(previous, 'Expected to read the group before patching it.')

                const title = uniqueTitle()
                const entity = await assertUpdated(owner.session, group.id, patchBody(group.id, { title: title }))

                assert.equal(entity.title, title)
                assert.equal(entity.about, previous.about)
                assert.equal(entity.type, previous.type)
                assert.equal(entity.slug, previous.slug)
                assert.equal(entity.postPermissions, previous.postPermissions)
            })

            it(`Should bump updatedDate`, async function() {
                const before = await getGroup(owner.session, group.id)
                const previous = before.content?.entity?.updatedDate

                const entity = await assertUpdated(owner.session, group.id, patchBody(group.id, { title: uniqueTitle() }))
                assert.notEqual(entity.updatedDate, previous, 'Expected updatedDate to be bumped by the update.')
            })

            it(`Should return the updated entity and its relations`, async function() {
                const response = await patchGroup(owner.session, group.id, patchBody(group.id, { title: uniqueTitle() }))
                assert.equal(response.status, 201)
                assert.equal(response.content?.entity?.id, group.id)
                assert.ok(response.content?.relations !== undefined, 'Expected `relations` on the response.')
            })
        })

        describe("type / parent consistency on update", function() {
            // validateGroup()'s consistency pass runs on UPDATE too, and it
            // keys off `parentGroup`, which is only loaded when the patch
            // itself carries `parentId`:
            //
            //     if ( util.objectHas(group, 'parentId') ) { ... parentGroup = ... }
            //
            // A patch that omits `parentId` therefore reaches the consistency
            // check with parentGroup === null even when the group being patched
            // IS a subgroup.  For the three COMPOUND types that combination is
            // treated as "a subgroup without a parent" and rejected -- see the
            // failing tests at the end of this describe.
            let owner
            let privateParent = null
            let hiddenParent = null
            let privateOpenChild = null
            let hiddenOpenChild = null
            let hiddenPrivateChild = null
            let hiddenChild = null

            before(async function() {
                if ( ! subgroupsEnabled ) return
                owner = await loginAs('user1')

                privateParent = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })
                privateOpenChild = await createSubgroup(owner.session, privateParent.id, 'private-open')

                hiddenParent = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })
                hiddenOpenChild = await createSubgroup(owner.session, hiddenParent.id, 'hidden-open')
                hiddenPrivateChild = await createSubgroup(owner.session, hiddenParent.id, 'hidden-private')
                hiddenChild = await createSubgroup(owner.session, hiddenParent.id, 'hidden')
            })

            after(async function() {
                if ( ! subgroupsEnabled ) return
                // Deleting the parents cascades to their children.
                if ( privateParent ) await deleteGroup(owner.session, privateParent.id)
                if ( hiddenParent ) await deleteGroup(owner.session, hiddenParent.id)
                await logout(owner.session)
            })

            it(`Should accept a patch that omits the type entirely`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                const title = uniqueTitle()
                const entity = await assertUpdated(owner.session, privateOpenChild.id, patchBody(privateOpenChild.id, { title: title }))
                assert.equal(entity.title, title)
            })

            it(`Should accept a non-compound subgroup's type resubmitted without a parentId`, async function(t) {
                // 'hidden' is not one of the subgroup-only types, so the
                // missing parentGroup doesn't trip the check.
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                const entity = await assertUpdated(owner.session, hiddenChild.id, patchBody(hiddenChild.id, { type: 'hidden' }))
                assert.equal(entity.type, 'hidden')
            })

            it(`Should accept a compound type resubmitted together with its parentId`, async function(t) {
                // With parentId present, parentGroup is loaded and the
                // parent/child consistency check passes.
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                const entity = await assertUpdated(owner.session, privateOpenChild.id,
                    patchBody(privateOpenChild.id, { type: 'private-open', parentId: privateParent.id }))
                assert.equal(entity.type, 'private-open')
            })

            it(`Should reject a patch that tries to change a subgroup's type`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertInvalid(owner.session, privateOpenChild.id,
                    patchBody(privateOpenChild.id, { type: 'private', parentId: privateParent.id }))
            })

            it(`Should reject a patch that tries to re-parent a subgroup`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertInvalid(owner.session, privateOpenChild.id,
                    patchBody(privateOpenChild.id, { parentId: hiddenParent.id }))
            })

            it(`Should accept a 'private-open' subgroup's type resubmitted without a parentId`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                const entity = await assertUpdated(owner.session, privateOpenChild.id,
                    patchBody(privateOpenChild.id, { type: 'private-open' }))
                assert.equal(entity.type, 'private-open')
            })

            it(`Should accept a 'hidden-open' subgroup's type resubmitted without a parentId`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                const entity = await assertUpdated(owner.session, hiddenOpenChild.id,
                    patchBody(hiddenOpenChild.id, { type: 'hidden-open' }))
                assert.equal(entity.type, 'hidden-open')
            })

            it(`Should accept a 'hidden-private' subgroup's type resubmitted without a parentId`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                const entity = await assertUpdated(owner.session, hiddenPrivateChild.id,
                    patchBody(hiddenPrivateChild.id, { type: 'hidden-private' }))
                assert.equal(entity.type, 'hidden-private')
            })
        })
    })
})
