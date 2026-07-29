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
const { isFeatureEnabled } = require('../../lib/system')

// Subgroups (child groups) and their compound types ('private-open',
// 'hidden-open', 'hidden-private') are gated behind this server feature flag.
// When it is off the compound types and the `parentId` column do not exist, so
// the subgroup tests below skip themselves rather than failing spuriously.
const SUBGROUPS_FEATURE = 'issue-165-subgroups'

// Small, branch-free assertion helpers.  These only wrap the HTTP round-trip
// and the status/body checks -- they compute nothing about *who* should be
// allowed.  Each test states its own expectation by choosing which one to call
// (assertCanViewGroup for a permitted view, assertCannotViewGroup for a denied
// one), so the expected outcome is always visible in the test itself.
//
//   assertCanViewGroup    -- 200 + the group's stable identifying fields.
//   assertCannotViewGroup -- 404 + error.type 'not-found' (a denied view).
//
// NOTE: Unlike getPost.spec.js's assertCanView we do NOT deep-equal the whole
// entity here.  The Group entity carries dynamic, environment-dependent fields
// -- membership/post counters (`totalMembers`, `totalPosts`,
// `mostRecentPostDate`, gated behind 'feat-484-find-active-groups'),
// `updatedDate`, and other feature-gated columns -- that change as the shared
// setup adds members, so a snapshot taken at creation time would not match a
// later GET.  Instead we assert the stable, viewer-independent fields the
// endpoint returns for the group metadata (`id`, `type`, `slug`, `about`),
// which is exactly the "can see this group exists and read its description"
// question the permission model governs.
async function assertCanViewGroup(session, expectedGroup) {
    const response = await getGroup(session, expectedGroup.id)
    assert.equal(response.status, 200)
    assert.equal(response.content?.entity?.id, expectedGroup.id)
    assert.equal(response.content?.entity?.type, expectedGroup.type)
    assert.equal(response.content?.entity?.slug, expectedGroup.slug)
    assert.equal(response.content?.entity?.about, expectedGroup.about)
}

async function assertCannotViewGroup(session, groupId) {
    const response = await getGroup(session, groupId)
    assert.equal(response.status, 404)
    assert.equal(response.content?.error?.type, 'not-found')
}

describe('GET /group/:id', function() {

    // Detected once, up front: are subgroups available on the target server?
    // The subgroup tests further down consult this and skip themselves when the
    // feature is disabled.
    let subgroupsEnabled = false

    before(async function() {
        subgroupsEnabled = await isFeatureEnabled(SUBGROUPS_FEATURE)
    })

    it(`Should return the requested group`, async function() {
        const { session, user } = await loginAs('user1')
        let group = null
        try {
            group = await createGroup(session, { type: 'open', postPermissions: 'anyone' })

            const response = await fetchEndpoint('GET', `/group/${encodeURIComponent(group.id)}`, { session: session })

            if ( ! response.ok ) {
                assert.fail('Failed to retrieve the group under test.')
            }

            const entity = response.content.entity
            assert.equal(entity.id, group.id)
            assert.equal(entity.type, group.type)
            assert.equal(entity.slug, group.slug)
            assert.equal(entity.title, group.title)
            assert.equal(entity.about, group.about)
        } finally {
            if ( group ) await deleteGroup(session, group.id)
            await logout(session)
        }
    })

    it(`Should reject an unauthenticated request`, async function() {
        // The authentication check happens before the group is even looked up,
        // so any id (even one that doesn't exist) exercises this path.
        const session = await initialize()

        const response = await getGroup(session, crypto.randomUUID())

        assert.equal(response.status, 401)
        assert.equal(response.content?.error?.type, 'not-authenticated')
    })

    it(`Should return 404 for a group that doesn't exist`, async function() {
        const { session } = await loginAs('user1')
        try {
            const response = await getGroup(session, crypto.randomUUID())

            assert.equal(response.status, 404)
            assert.equal(response.content?.error?.type, 'not-found')
        } finally {
            await logout(session)
        }
    })

    describe("for top-level groups", function() {
        // ======================================================================
        // Group metadata: `canViewGroup` governs who may read a group's
        // existence and description via GET /group/:id.  Cases mirror the "can
        // see a Group exists and read its description" column of
        // documentation/testing/test-cases/Group/regression/read.md.
        //
        // This is deliberately DIFFERENT from the GroupPost read model
        // (getPost.spec.js):
        //   - For PRIVATE groups the metadata is visible to non-members even
        //     though the posts are not.
        //   - For HIDDEN groups a pending invitee can read the metadata even
        //     though they cannot read the posts.
        //
        // user1 is the admin/creator; the remaining users take fixed roles.
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

            it(`Should let a Group Admin view the group`, async function() {
                await assertCanViewGroup(owner.session, group)
            })

            it(`Should let a Group Moderator view the group`, async function() {
                await assertCanViewGroup(moderator.session, group)
            })

            it(`Should let a Member view the group`, async function() {
                await assertCanViewGroup(member.session, group)
            })

            it(`Should let an Invited/Requested (pending) member view the group`, async function() {
                await assertCanViewGroup(invited.session, group)
            })

            it(`Should let a Non-member view the group`, async function() {
                await assertCanViewGroup(nonMember.session, group)
            })

            it(`Should let a site moderator view the group`, async function() {
                await assertCanViewGroup(siteModerator.session, group)
            })

            it(`Should NOT let a banned member view the group`, async function() {
                // Borrow the non-member transiently: make them a member, ban them,
                // assert, then remove them so the non-member case is unaffected.
                try {
                    await joinOpenGroup(nonMember.session, group.id, nonMember.user.id)
                    await setGroupMemberStatus(owner.session, group.id, nonMember.user.id, 'banned')
                    await assertCannotViewGroup(nonMember.session, group.id)
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

            it(`Should let a Group Admin view the group`, async function() {
                await assertCanViewGroup(owner.session, group)
            })

            it(`Should let a Group Moderator view the group`, async function() {
                await assertCanViewGroup(moderator.session, group)
            })

            it(`Should let a Member view the group`, async function() {
                await assertCanViewGroup(member.session, group)
            })

            it(`Should let an Invited/Requested (pending) member view the group`, async function() {
                await assertCanViewGroup(invited.session, group)
            })

            // The distinguishing case for PRIVATE groups: the group metadata is
            // visible to non-members even though the posts are not.
            it(`Should let a Non-member view the group`, async function() {
                await assertCanViewGroup(nonMember.session, group)
            })

            it(`Should let a site moderator view the group`, async function() {
                await assertCanViewGroup(siteModerator.session, group)
            })

            it(`Should NOT let a banned member view the group`, async function() {
                // Borrow the non-member transiently: make them a member, ban them,
                // assert, then remove them so the non-member case is unaffected.
                try {
                    await addConfirmedMember(owner.session, nonMember.session, group.id, nonMember.user.id)
                    await setGroupMemberStatus(owner.session, group.id, nonMember.user.id, 'banned')
                    await assertCannotViewGroup(nonMember.session, group.id)
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

            it(`Should let a Group Admin view the group`, async function() {
                await assertCanViewGroup(owner.session, group)
            })

            it(`Should let a Group Moderator view the group`, async function() {
                await assertCanViewGroup(moderator.session, group)
            })

            it(`Should let a Member view the group`, async function() {
                await assertCanViewGroup(member.session, group)
            })

            // The distinguishing case for HIDDEN groups: a pending invitee can
            // read the group metadata even though they cannot read its posts.
            it(`Should let an Invited/Requested (pending) member view the group`, async function() {
                await assertCanViewGroup(invited.session, group)
            })

            it(`Should NOT let a Non-member view the group`, async function() {
                await assertCannotViewGroup(nonMember.session, group.id)
            })

            it(`Should let a site moderator view the group`, async function() {
                await assertCanViewGroup(siteModerator.session, group)
            })

            it(`Should NOT let a banned member view the group`, async function() {
                // Borrow the non-member transiently: make them a member, ban them,
                // assert, then remove them so the non-member case is unaffected.
                try {
                    await addConfirmedMember(owner.session, nonMember.session, group.id, nonMember.user.id)
                    await setGroupMemberStatus(owner.session, group.id, nonMember.user.id, 'banned')
                    await assertCannotViewGroup(nonMember.session, group.id)
                } finally {
                    await removeGroupMember(owner.session, group.id, nonMember.user.id)
                }
            })
        })
    })

    describe("for Subgroups", function() {
        // ======================================================================
        // Subgroup metadata visibility.  Stored `type` per (parent, child
        // choice) -- mirrors getPost.spec.js:
        //   PUBLIC parent:  open->'open'          private->'private'        hidden->'hidden'
        //   PRIVATE parent: open->'private-open'  private->'private'        hidden->'hidden'
        //   HIDDEN parent:  open->'hidden-open'   private->'hidden-private' hidden->'hidden'
        //
        // Setup is shared per describe: a parent group (with its role members)
        // is built once per parent type and reused across that parent's three
        // subgroup describes; each subgroup builds its own child group.
        //
        // Key contrasts with the GroupPost read model:
        //   - `-open` metadata (open/private/private-open) is visible to
        //     everyone, just like the top-level open/private cases.
        //   - For `hidden-open` AND `hidden-private` the metadata is visible to
        //     PARENT members/moderators (both compound types are treated the
        //     same by canViewGroup), even though only `hidden-open` *posts* are.
        //   - A pending invitee of a subgroup can always read that subgroup's
        //     metadata (the invite alone is a non-banned membership), even for
        //     the hidden family where they could not read the posts.
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

                    // Two pending (invited) members: one who is not a parent member and
                    // one (user9) who is also a member of the parent group.
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

                it(`Should let a Group Admin view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(owner.session, child)
                })

                it(`Should let a Group Moderator view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(subModerator.session, child)
                })

                it(`Should let a Member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(subMember.session, child)
                })

                it(`Should let a Parent Group Admin view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(parentAdmin.session, child)
                })

                it(`Should let a Parent Group Moderator view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(parentModerator.session, child)
                })

                it(`Should let a Parent Group Member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(parentMember.session, child)
                })

                it(`Should let a Non-member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(nonMember.session, child)
                })

                it(`Should let an Invited/Requested (pending) member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(invited.session, child)
                })

                it(`Should let an Invited/Requested (pending) member who is a Parent Group Member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(invitedParentMember.session, child)
                })

                it(`Should let a site moderator view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(siteModerator.session, child)
                })

                it(`Should NOT let a banned subgroup member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    // Borrow the non-member transiently: add to the subgroup, ban, assert,
                    // then remove.  The ban overrides even the parent-member path.
                    try {
                        await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                        await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                        await assertCannotViewGroup(nonMember.session, child.id)
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

                it(`Should let a Group Admin view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(owner.session, child)
                })

                it(`Should let a Group Moderator view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(subModerator.session, child)
                })

                it(`Should let a Member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(subMember.session, child)
                })

                it(`Should let a Parent Group Admin view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(parentAdmin.session, child)
                })

                // For PRIVATE subgroup metadata, parent members/moderators CAN see
                // the group exists (unlike the posts, which they cannot read).
                it(`Should let a Parent Group Moderator view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(parentModerator.session, child)
                })

                it(`Should let a Parent Group Member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(parentMember.session, child)
                })

                it(`Should let a Non-member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(nonMember.session, child)
                })

                it(`Should let an Invited/Requested (pending) member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(invited.session, child)
                })

                it(`Should let an Invited/Requested (pending) member who is a Parent Group Member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(invitedParentMember.session, child)
                })

                it(`Should let a site moderator view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(siteModerator.session, child)
                })

                it(`Should NOT let a banned subgroup member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    try {
                        await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                        await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                        await assertCannotViewGroup(nonMember.session, child.id)
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

                it(`Should let a Group Admin view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(owner.session, child)
                })

                it(`Should let a Group Moderator view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(subModerator.session, child)
                })

                it(`Should let a Member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(subMember.session, child)
                })

                // A plain 'hidden' subgroup is NOT viewable via the parent path
                // (that path only exists for the compound hidden-open/hidden-private
                // types).  Only the subgroup's own admins/members/invitees -- and
                // parent *admins* (who inherit admin rights) -- can see it.
                it(`Should let a Parent Group Admin view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(parentAdmin.session, child)
                })

                it(`Should NOT let a Parent Group Moderator view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCannotViewGroup(parentModerator.session, child.id)
                })

                it(`Should NOT let a Parent Group Member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCannotViewGroup(parentMember.session, child.id)
                })

                it(`Should NOT let a Non-member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCannotViewGroup(nonMember.session, child.id)
                })

                it(`Should let an Invited/Requested (pending) member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(invited.session, child)
                })

                it(`Should let an Invited/Requested (pending) member who is a Parent Group Member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(invitedParentMember.session, child)
                })

                it(`Should let a site moderator view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(siteModerator.session, child)
                })

                it(`Should NOT let a banned subgroup member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    try {
                        await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                        await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                        await assertCannotViewGroup(nonMember.session, child.id)
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

                it(`Should let a Group Admin view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(owner.session, child)
                })

                it(`Should let a Group Moderator view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(subModerator.session, child)
                })

                it(`Should let a Member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(subMember.session, child)
                })

                it(`Should let a Parent Group Admin view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(parentAdmin.session, child)
                })

                it(`Should let a Parent Group Moderator view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(parentModerator.session, child)
                })

                it(`Should let a Parent Group Member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(parentMember.session, child)
                })

                it(`Should let a Non-member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(nonMember.session, child)
                })

                it(`Should let an Invited/Requested (pending) member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(invited.session, child)
                })

                it(`Should let an Invited/Requested (pending) member who is a Parent Group Member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(invitedParentMember.session, child)
                })

                it(`Should let a site moderator view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(siteModerator.session, child)
                })

                it(`Should NOT let a banned subgroup member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    try {
                        await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                        await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                        await assertCannotViewGroup(nonMember.session, child.id)
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

                it(`Should let a Group Admin view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(owner.session, child)
                })

                it(`Should let a Group Moderator view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(subModerator.session, child)
                })

                it(`Should let a Member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(subMember.session, child)
                })

                it(`Should let a Parent Group Admin view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(parentAdmin.session, child)
                })

                // PRIVATE subgroup metadata is visible to everyone (parent members
                // included), even though only parent *admins* can read the posts.
                it(`Should let a Parent Group Moderator view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(parentModerator.session, child)
                })

                it(`Should let a Parent Group Member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(parentMember.session, child)
                })

                it(`Should let a Non-member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(nonMember.session, child)
                })

                it(`Should let an Invited/Requested (pending) member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(invited.session, child)
                })

                it(`Should let an Invited/Requested (pending) member who is a Parent Group Member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(invitedParentMember.session, child)
                })

                it(`Should let a site moderator view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(siteModerator.session, child)
                })

                it(`Should NOT let a banned subgroup member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    try {
                        await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                        await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                        await assertCannotViewGroup(nonMember.session, child.id)
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

                it(`Should let a Group Admin view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(owner.session, child)
                })

                it(`Should let a Group Moderator view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(subModerator.session, child)
                })

                it(`Should let a Member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(subMember.session, child)
                })

                it(`Should let a Parent Group Admin view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(parentAdmin.session, child)
                })

                // A plain 'hidden' subgroup ignores the parent-member path; only
                // subgroup members/invitees and parent *admins* can see it.
                it(`Should NOT let a Parent Group Moderator view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCannotViewGroup(parentModerator.session, child.id)
                })

                it(`Should NOT let a Parent Group Member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCannotViewGroup(parentMember.session, child.id)
                })

                it(`Should NOT let a Non-member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCannotViewGroup(nonMember.session, child.id)
                })

                it(`Should let an Invited/Requested (pending) member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(invited.session, child)
                })

                // user9 is invited to the subgroup, so the invite (a non-banned
                // membership) lets them see it -- their parent membership is
                // irrelevant for a plain 'hidden' subgroup.
                it(`Should let an Invited/Requested (pending) member who is a Parent Group Member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(invitedParentMember.session, child)
                })

                it(`Should let a site moderator view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(siteModerator.session, child)
                })

                it(`Should NOT let a banned subgroup member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    try {
                        await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                        await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                        await assertCannotViewGroup(nonMember.session, child.id)
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

                it(`Should let a Group Admin view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(owner.session, child)
                })

                it(`Should let a Group Moderator view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(subModerator.session, child)
                })

                it(`Should let a Member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(subMember.session, child)
                })

                it(`Should let a Parent Group Admin view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(parentAdmin.session, child)
                })

                // HIDDEN-OPEN metadata is visible to parent members/moderators.
                it(`Should let a Parent Group Moderator view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(parentModerator.session, child)
                })

                it(`Should let a Parent Group Member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(parentMember.session, child)
                })

                it(`Should NOT let a Non-member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCannotViewGroup(nonMember.session, child.id)
                })

                it(`Should let an Invited/Requested (pending) member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(invited.session, child)
                })

                it(`Should let an Invited/Requested (pending) member who is a Parent Group Member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(invitedParentMember.session, child)
                })

                it(`Should let a site moderator view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(siteModerator.session, child)
                })

                it(`Should NOT let a banned subgroup member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    try {
                        await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                        await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                        await assertCannotViewGroup(nonMember.session, child.id)
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

                it(`Should let a Group Admin view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(owner.session, child)
                })

                it(`Should let a Group Moderator view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(subModerator.session, child)
                })

                it(`Should let a Member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(subMember.session, child)
                })

                it(`Should let a Parent Group Admin view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(parentAdmin.session, child)
                })

                // KEY Group-vs-GroupPost contrast: for HIDDEN-PRIVATE, parent
                // members/moderators CAN see the group exists (canViewGroup treats
                // hidden-private the same as hidden-open) even though they CANNOT
                // read its posts (canViewGroupPost is stricter for hidden-private).
                it(`Should let a Parent Group Moderator view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(parentModerator.session, child)
                })

                it(`Should let a Parent Group Member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(parentMember.session, child)
                })

                it(`Should NOT let a Non-member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCannotViewGroup(nonMember.session, child.id)
                })

                it(`Should let an Invited/Requested (pending) member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(invited.session, child)
                })

                it(`Should let an Invited/Requested (pending) member who is a Parent Group Member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(invitedParentMember.session, child)
                })

                it(`Should let a site moderator view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(siteModerator.session, child)
                })

                it(`Should NOT let a banned subgroup member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    try {
                        await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                        await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                        await assertCannotViewGroup(nonMember.session, child.id)
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

                it(`Should let a Group Admin view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(owner.session, child)
                })

                it(`Should let a Group Moderator view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(subModerator.session, child)
                })

                it(`Should let a Member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(subMember.session, child)
                })

                it(`Should let a Parent Group Admin view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(parentAdmin.session, child)
                })

                // A plain 'hidden' subgroup ignores the parent-member path even when
                // the parent is itself hidden; only subgroup members/invitees and
                // parent *admins* can see it.
                it(`Should NOT let a Parent Group Moderator view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCannotViewGroup(parentModerator.session, child.id)
                })

                it(`Should NOT let a Parent Group Member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCannotViewGroup(parentMember.session, child.id)
                })

                it(`Should NOT let a Non-member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCannotViewGroup(nonMember.session, child.id)
                })

                it(`Should let an Invited/Requested (pending) member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(invited.session, child)
                })

                it(`Should let an Invited/Requested (pending) member who is a Parent Group Member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(invitedParentMember.session, child)
                })

                it(`Should let a site moderator view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCanViewGroup(siteModerator.session, child)
                })

                it(`Should NOT let a banned subgroup member view the group`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    try {
                        await addConfirmedMember(owner.session, nonMember.session, child.id, nonMember.user.id)
                        await setGroupMemberStatus(owner.session, child.id, nonMember.user.id, 'banned')
                        await assertCannotViewGroup(nonMember.session, child.id)
                    } finally {
                        await removeGroupMember(owner.session, child.id, nonMember.user.id)
                    }
                })
            })
        })
    })
})
