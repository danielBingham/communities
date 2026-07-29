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
const {
    getGroup,
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
const { isFeatureEnabled } = require('../../../lib/system')

const userDictionary = require('../../../fixtures/users')

// Subgroups (and their compound types) are gated behind this feature flag; the
// subgroup blocks skip themselves when it is off, exactly as in getGroup.spec.js.
const SUBGROUPS_FEATURE = 'issue-165-subgroups'

let subgroupsEnabled = false

// ============================================================================
// Approach
//
// GET /groups is the LIST endpoint.  Its permission filter is a hand-written
// SQL WHERE clause in GroupController.createQuery() that is meant to reproduce,
// in SQL, the row-by-row logic of PermissionService.can(user, 'view', 'Group')
// -- i.e. permissions.Group.canViewGroup() -- which GET /group/:id uses.  A
// comment on that SQL even says so:
//     "Logic should exactly match that found in
//      /packages/shared/permissions/Group/index.js:canViewGroup()".
// The purpose of this suite is to verify that claim across the full group /
// subgroup / role matrix and surface any gap between the two implementations.
//
// Unlike GET /group/:id we cannot reset the environment to a known set of
// groups (the query returns every group the caller may see, across all users),
// so we cannot match the whole result to an exact expected list.  Instead we
// seed a specific group, then check whether it appears in the caller's list and
// compare that to whether GET /group/:id lets the same caller see it.
//
// Two ways to get the "should this caller see it?" answer to compare against:
//   (a) call GET /group/:id for the seeded group, per caller, and read 200/404;
//   (b) import canViewGroup() from @communities/shared and evaluate it.
//
// We use (a).  The dominant cost -- paginating the whole list -- is identical
// either way, so the only difference is how we derive the single-group answer.
// (b) requires reconstructing the full permission *context* (group, parentGroup,
// the caller's membership in both, canModerateSite); building that faithfully
// means extra membership look-ups (as many calls as (a), or more) or
// hand-building the context in the test, which re-implements the model we are
// trying to verify.  (a) needs none of that: one cheap indexed GET per (group,
// caller) hits the real canViewGroup() code directly, and comparing two live
// endpoints is the truest "does the list SQL agree with the permission model?"
// check.  getGroup.spec.js pins down the single-group side's absolute
// correctness against the documented matrix; this suite pins the list to it.
// ============================================================================

// Paginate the caller's entire GET /groups result and return true as soon as
// `groupId` appears; scans every page before returning false.
async function listContainsGroup(session, groupId) {
    let page = 1
    let numberOfPages = 1
    while ( page <= numberOfPages ) {
        const response = await fetchEndpoint('GET', `/groups?page=${page}`, { session: session })
        if ( ! response.ok ) {
            throw new Error(`GET /groups failed on page ${page}: ${response.status} ${JSON.stringify(response.content)}`)
        }
        const content = response.content
        numberOfPages = content.meta.numberOfPages
        if ( Array.isArray(content.list) && content.list.includes(groupId) ) {
            return true
        }
        page = page + 1
    }
    return false
}

// The core cross-check: the bare GET /groups list must include a group exactly
// when GET /group/:id returns it (200) and omit it exactly when GET /group/:id
// denies it (404).  Asserts the createQuery() SQL agrees with canViewGroup().
async function assertListMatchesGetGroup(session, group) {
    const single = await getGroup(session, group.id)
    assert.ok(single.status === 200 || single.status === 404,
        `GET /group/:id returned unexpected status ${single.status} for group ${group.id}`)
    const singleAllows = single.status === 200

    const inList = await listContainsGroup(session, group.id)

    assert.equal(inList, singleAllows,
        `GET /groups ${inList ? 'INCLUDED' : 'OMITTED'} group ${group.id}, but GET /group/:id `
        + `${singleAllows ? 'ALLOWED it (200)' : 'DENIED it (404)'} -- the list query in `
        + `GroupController.createQuery() and the single-group permission model (canViewGroup) disagree.`)
}

describe('GET /groups', function() {

    before(async function() {
        subgroupsEnabled = await isFeatureEnabled(SUBGROUPS_FEATURE)
    })

    // A basic pagination sanity check on the bare list call: paginating the
    // whole result yields a self-consistent set (no duplicate ids across pages)
    // whose size equals meta.count.  The permission matrix below is the
    // substance of the suite.
    it(`Should return a self-consistent, de-duplicated paginated list`, async function() {
        const session = await initialize()
        const user1 = userDictionary['user1']
        await login({ email: user1.email, password: user1.password }, session)

        try {
            const collected = []
            let page = 1
            let numberOfPages = 1
            let metaCount = 0

            while ( page <= numberOfPages ) {
                const response = await fetchEndpoint('GET', `/groups?page=${page}`, { session: session })
                assert.equal(response.status, 200)

                const content = response.content
                numberOfPages = content.meta.numberOfPages
                metaCount = parseInt(content.meta.count, 10)

                for(const groupId of content.list) {
                    collected.push(groupId)
                }

                page = page + 1
            }

            assert.equal(collected.length, new Set(collected).size,
                'GET /groups returned the same group id on more than one page.')
            assert.equal(collected.length, metaCount,
                'The number of groups paginated does not match meta.count.')
        } finally {
            await logout(session)
        }
    })

    it(`GET /groups matches GET /group/:id for the creator of their own group`, async function() {
        const owner = await loginAs('user1')
        let group = null
        try {
            group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
            await assertListMatchesGetGroup(owner.session, group)
        } finally {
            if ( group ) await deleteGroup(owner.session, group.id)
            await logout(owner.session)
        }
    })

    describe("for top-level groups", function() {
        // ======================================================================
        // Top-level groups.  Setup is identical to getGroup.spec.js; here every
        // role simply asserts the list agrees with GET /group/:id.
        // ======================================================================

        describe("for Open groups", function() {
            let owner, moderator, member, invited, nonMember, siteModerator
            let group = null

            before(async function() {
                owner = await loginAs('user1')            // group admin (and creator)
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

            it(`GET /groups matches GET /group/:id for a Group Admin`, async function() {
                await assertListMatchesGetGroup(owner.session, group)
            })

            it(`GET /groups matches GET /group/:id for a Group Moderator`, async function() {
                await assertListMatchesGetGroup(moderator.session, group)
            })

            it(`GET /groups matches GET /group/:id for a Member`, async function() {
                await assertListMatchesGetGroup(member.session, group)
            })

            it(`GET /groups matches GET /group/:id for an Invited/Requested (pending) member`, async function() {
                await assertListMatchesGetGroup(invited.session, group)
            })

            it(`GET /groups matches GET /group/:id for a Non-member`, async function() {
                await assertListMatchesGetGroup(nonMember.session, group)
            })

            it(`GET /groups matches GET /group/:id for a site moderator`, async function() {
                await assertListMatchesGetGroup(siteModerator.session, group)
            })

            it(`GET /groups matches GET /group/:id for a banned member`, async function() {
                try {
                    await joinOpenGroup(nonMember.session, group.id, nonMember.user.id)
                    await setGroupMemberStatus(owner.session, group.id, nonMember.user.id, 'banned')
                    await assertListMatchesGetGroup(nonMember.session, group)
                } finally {
                    await removeGroupMember(owner.session, group.id, nonMember.user.id)
                }
            })
        })

        describe("for Private groups", function() {
            let owner, moderator, member, invited, nonMember, siteModerator
            let group = null

            before(async function() {
                owner = await loginAs('user1')            // group admin (and creator)
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

            it(`GET /groups matches GET /group/:id for a Group Admin`, async function() {
                await assertListMatchesGetGroup(owner.session, group)
            })

            it(`GET /groups matches GET /group/:id for a Group Moderator`, async function() {
                await assertListMatchesGetGroup(moderator.session, group)
            })

            it(`GET /groups matches GET /group/:id for a Member`, async function() {
                await assertListMatchesGetGroup(member.session, group)
            })

            it(`GET /groups matches GET /group/:id for an Invited/Requested (pending) member`, async function() {
                await assertListMatchesGetGroup(invited.session, group)
            })

            // The distinguishing case for PRIVATE groups: the metadata is visible
            // to non-members, so it must appear in a non-member's list too.
            it(`GET /groups matches GET /group/:id for a Non-member`, async function() {
                await assertListMatchesGetGroup(nonMember.session, group)
            })

            it(`GET /groups matches GET /group/:id for a site moderator`, async function() {
                await assertListMatchesGetGroup(siteModerator.session, group)
            })

            it(`GET /groups matches GET /group/:id for a banned member`, async function() {
                try {
                    await addConfirmedMember(owner.session, nonMember.session, group.id, nonMember.user.id)
                    await setGroupMemberStatus(owner.session, group.id, nonMember.user.id, 'banned')
                    await assertListMatchesGetGroup(nonMember.session, group)
                } finally {
                    await removeGroupMember(owner.session, group.id, nonMember.user.id)
                }
            })
        })

        describe("for Hidden groups", function() {
            let owner, moderator, member, invited, nonMember, siteModerator
            let group = null

            before(async function() {
                owner = await loginAs('user1')            // group admin (and creator)
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

            it(`GET /groups matches GET /group/:id for a Group Admin`, async function() {
                await assertListMatchesGetGroup(owner.session, group)
            })

            it(`GET /groups matches GET /group/:id for a Group Moderator`, async function() {
                await assertListMatchesGetGroup(moderator.session, group)
            })

            it(`GET /groups matches GET /group/:id for a Member`, async function() {
                await assertListMatchesGetGroup(member.session, group)
            })

            // The distinguishing case for HIDDEN groups: a pending invitee can see
            // the metadata, so it must appear in their list too.
            it(`GET /groups matches GET /group/:id for an Invited/Requested (pending) member`, async function() {
                await assertListMatchesGetGroup(invited.session, group)
            })

            it(`GET /groups matches GET /group/:id for a Non-member`, async function() {
                await assertListMatchesGetGroup(nonMember.session, group)
            })

            it(`GET /groups matches GET /group/:id for a site moderator`, async function() {
                await assertListMatchesGetGroup(siteModerator.session, group)
            })

            it(`GET /groups matches GET /group/:id for a banned member`, async function() {
                try {
                    await addConfirmedMember(owner.session, nonMember.session, group.id, nonMember.user.id)
                    await setGroupMemberStatus(owner.session, group.id, nonMember.user.id, 'banned')
                    await assertListMatchesGetGroup(nonMember.session, group)
                } finally {
                    await removeGroupMember(owner.session, group.id, nonMember.user.id)
                }
            })
        })
    })

    describe("for Subgroups", function() {
        // ======================================================================
        // Subgroups.  Setup mirrors getGroup.spec.js; every role asserts the
        // list agrees with GET /group/:id.  The SQL's parent-admin join and its
        // `hidden-open`/`hidden-private`-via-parent-member branch are exercised
        // here against the same branches of canViewGroup().  Stored `type` per
        // (parent, child choice):
        //   PUBLIC parent:  open->'open'          private->'private'        hidden->'hidden'
        //   PRIVATE parent: open->'private-open'  private->'private'        hidden->'hidden'
        //   HIDDEN parent:  open->'hidden-open'   private->'hidden-private' hidden->'hidden'
        // ======================================================================

        describe("For subgroups of Public groups", function() {
            let owner, parentAdmin, parentModerator, parentMember, invitedParentMember, nonMember, siteModerator
            let parent = null

            before(async function() {
                if ( ! subgroupsEnabled ) return
                owner = await loginAs('user1')                    // admin of every group
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

                it(`GET /groups matches GET /group/:id for a Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(owner.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(subModerator.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(subMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Parent Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(parentAdmin.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Parent Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(parentModerator.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(parentMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Non-member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(nonMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for an Invited/Requested (pending) member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(invited.session, child)
                })

                it(`GET /groups matches GET /group/:id for an Invited/Requested (pending) member who is a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(invitedParentMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for a site moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(siteModerator.session, child)
                })

                it(`GET /groups matches GET /group/:id for a banned subgroup member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    try {
                        await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                        await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                        await assertListMatchesGetGroup(nonMember.session, child)
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
                    subModerator = await loginAs('user2')     // subgroup moderator
                    subMember = await loginAs('user3')        // confirmed subgroup member
                    invited = await loginAs('user8')          // invited to subgroup; NOT a parent member

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

                it(`GET /groups matches GET /group/:id for a Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(owner.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(subModerator.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(subMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Parent Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(parentAdmin.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Parent Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(parentModerator.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(parentMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Non-member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(nonMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for an Invited/Requested (pending) member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(invited.session, child)
                })

                it(`GET /groups matches GET /group/:id for an Invited/Requested (pending) member who is a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(invitedParentMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for a site moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(siteModerator.session, child)
                })

                it(`GET /groups matches GET /group/:id for a banned subgroup member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    try {
                        await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                        await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                        await assertListMatchesGetGroup(nonMember.session, child)
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
                    subModerator = await loginAs('user2')     // subgroup moderator
                    subMember = await loginAs('user3')        // confirmed subgroup member
                    invited = await loginAs('user8')          // invited to subgroup; NOT a parent member

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

                it(`GET /groups matches GET /group/:id for a Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(owner.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(subModerator.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(subMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Parent Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(parentAdmin.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Parent Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(parentModerator.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(parentMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Non-member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(nonMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for an Invited/Requested (pending) member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(invited.session, child)
                })

                it(`GET /groups matches GET /group/:id for an Invited/Requested (pending) member who is a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(invitedParentMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for a site moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(siteModerator.session, child)
                })

                it(`GET /groups matches GET /group/:id for a banned subgroup member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    try {
                        await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                        await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                        await assertListMatchesGetGroup(nonMember.session, child)
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
                owner = await loginAs('user1')                    // admin of every group
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
                })

                after(async function() {
                    if ( ! subgroupsEnabled ) return
                    if ( child ) await deleteGroup(owner.session, child.id)
                    await logout(subModerator.session)
                    await logout(subMember.session)
                    await logout(invited.session)
                })

                it(`GET /groups matches GET /group/:id for a Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(owner.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(subModerator.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(subMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Parent Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(parentAdmin.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Parent Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(parentModerator.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(parentMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Non-member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(nonMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for an Invited/Requested (pending) member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(invited.session, child)
                })

                it(`GET /groups matches GET /group/:id for an Invited/Requested (pending) member who is a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(invitedParentMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for a site moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(siteModerator.session, child)
                })

                it(`GET /groups matches GET /group/:id for a banned subgroup member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    try {
                        await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                        await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                        await assertListMatchesGetGroup(nonMember.session, child)
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
                    subModerator = await loginAs('user2')     // subgroup moderator
                    subMember = await loginAs('user3')        // confirmed subgroup member
                    invited = await loginAs('user8')          // invited to subgroup; NOT a parent member

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

                it(`GET /groups matches GET /group/:id for a Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(owner.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(subModerator.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(subMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Parent Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(parentAdmin.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Parent Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(parentModerator.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(parentMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Non-member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(nonMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for an Invited/Requested (pending) member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(invited.session, child)
                })

                it(`GET /groups matches GET /group/:id for an Invited/Requested (pending) member who is a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(invitedParentMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for a site moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(siteModerator.session, child)
                })

                it(`GET /groups matches GET /group/:id for a banned subgroup member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    try {
                        await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                        await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                        await assertListMatchesGetGroup(nonMember.session, child)
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
                    subModerator = await loginAs('user2')     // subgroup moderator
                    subMember = await loginAs('user3')        // confirmed subgroup member
                    invited = await loginAs('user8')          // invited to subgroup; NOT a parent member

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

                it(`GET /groups matches GET /group/:id for a Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(owner.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(subModerator.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(subMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Parent Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(parentAdmin.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Parent Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(parentModerator.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(parentMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Non-member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(nonMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for an Invited/Requested (pending) member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(invited.session, child)
                })

                it(`GET /groups matches GET /group/:id for an Invited/Requested (pending) member who is a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(invitedParentMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for a site moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(siteModerator.session, child)
                })

                it(`GET /groups matches GET /group/:id for a banned subgroup member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    try {
                        await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                        await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                        await assertListMatchesGetGroup(nonMember.session, child)
                    } finally {
                        await removeGroupMember(owner.session, child.id, nonMember.user.id)
                    }
                })
            })
        })

        describe("For subgroups of Hidden groups", function() {
            let owner, parentAdmin, parentModerator, parentMember, invitedParentMember, nonMember, siteModerator
            let parent = null

            before(async function() {
                if ( ! subgroupsEnabled ) return
                owner = await loginAs('user1')                    // admin of every group
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
                })

                after(async function() {
                    if ( ! subgroupsEnabled ) return
                    if ( child ) await deleteGroup(owner.session, child.id)
                    await logout(subModerator.session)
                    await logout(subMember.session)
                    await logout(invited.session)
                })

                it(`GET /groups matches GET /group/:id for a Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(owner.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(subModerator.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(subMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Parent Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(parentAdmin.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Parent Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(parentModerator.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(parentMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Non-member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(nonMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for an Invited/Requested (pending) member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(invited.session, child)
                })

                it(`GET /groups matches GET /group/:id for an Invited/Requested (pending) member who is a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(invitedParentMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for a site moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(siteModerator.session, child)
                })

                it(`GET /groups matches GET /group/:id for a banned subgroup member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    try {
                        await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                        await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                        await assertListMatchesGetGroup(nonMember.session, child)
                    } finally {
                        await removeGroupMember(owner.session, child.id, nonMember.user.id)
                    }
                })
            })

            describe("For a PRIVATE subgroup of a HIDDEN group (HIDDEN-PRIVATE)", function() {
                let subModerator, subMember, invited
                let child = null

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
                })

                after(async function() {
                    if ( ! subgroupsEnabled ) return
                    if ( child ) await deleteGroup(owner.session, child.id)
                    await logout(subModerator.session)
                    await logout(subMember.session)
                    await logout(invited.session)
                })

                it(`GET /groups matches GET /group/:id for a Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(owner.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(subModerator.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(subMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Parent Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(parentAdmin.session, child)
                })

                // KEY Group-vs-GroupPost contrast preserved by the SQL: for
                // HIDDEN-PRIVATE, parent members/moderators appear in the list
                // (canViewGroup treats hidden-private the same as hidden-open) even
                // though they cannot see the *posts*.
                it(`GET /groups matches GET /group/:id for a Parent Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(parentModerator.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(parentMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Non-member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(nonMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for an Invited/Requested (pending) member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(invited.session, child)
                })

                it(`GET /groups matches GET /group/:id for an Invited/Requested (pending) member who is a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(invitedParentMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for a site moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(siteModerator.session, child)
                })

                it(`GET /groups matches GET /group/:id for a banned subgroup member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    try {
                        await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                        await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                        await assertListMatchesGetGroup(nonMember.session, child)
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
                    subModerator = await loginAs('user2')     // subgroup moderator
                    subMember = await loginAs('user3')        // confirmed subgroup member
                    invited = await loginAs('user8')          // invited to subgroup; NOT a parent member

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

                it(`GET /groups matches GET /group/:id for a Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(owner.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(subModerator.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(subMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Parent Group Admin`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(parentAdmin.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Parent Group Moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(parentModerator.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(parentMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for a Non-member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(nonMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for an Invited/Requested (pending) member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(invited.session, child)
                })

                it(`GET /groups matches GET /group/:id for an Invited/Requested (pending) member who is a Parent Group Member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(invitedParentMember.session, child)
                })

                it(`GET /groups matches GET /group/:id for a site moderator`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertListMatchesGetGroup(siteModerator.session, child)
                })

                it(`GET /groups matches GET /group/:id for a banned subgroup member`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    try {
                        await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                        await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                        await assertListMatchesGetGroup(nonMember.session, child)
                    } finally {
                        await removeGroupMember(owner.session, child.id, nonMember.user.id)
                    }
                })
            })
        })
    })
})
