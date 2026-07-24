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
const { getPost, createPost, createGroupPost, deletePost } = require('../../lib/posts')
const { addComment } = require('../../lib/postComments')
const { addReaction } = require('../../lib/postReactions')
const {
    getGroup,
    createGroup,
    createSubgroup,
    deleteGroup,
    deleteGroupRequest,
    joinOpenGroup,
    joinGroupAsAdmin,
    requestToJoinGroup,
    inviteToGroup,
    addConfirmedMember,
    setGroupMemberStatus,
    setGroupMemberRole
} = require('../../lib/groups')
const { isFeatureEnabled } = require('../../lib/system')

const SUBGROUPS_FEATURE = 'issue-165-subgroups'
let subgroupsEnabled = false

// ============================================================================
// DELETE /group/:id drives GroupController.deleteGroup(), which runs, in order:
//   1. authentication                                   -> 401 not-authenticated
//   2. groupSchema.properties.id.validate(routeId)      -> 400 invalid
//   3. groupDAO.getGroupById(routeId)                   -> 404 not-found
//   4. PermissionService.can(user, 'view', 'Group')     -> 404 not-found
//   5. PermissionService.can(user, 'delete', 'Group')   -> 403 not-authorized
//   6. groupDAO.deleteGroup()                           -> 200 { entity, relations }
//
// Two things to note against its siblings:
//   * Unlike PATCH /group/:id, this endpoint VALIDATES THE ROUTE ID before it
//     touches the database, so a malformed id is a clean 400 rather than a
//     uuid-cast error.
//   * It responds 200 (PATCH responds 201) and echoes back the entity as it
//     was immediately before deletion.
//
// `delete` maps to canDeleteGroup(), which is canAdminGroup() -- the same
// permission that governs update.  So a group may be deleted by a confirmed
// member with the 'admin' role, by a site moderator, or by an admin of the
// group's IMMEDIATE parent.  Admin rights deliberately inherit only one level:
// canAdminGroup()'s `ancestors` branch is never populated, so an admin of a
// grandparent cannot delete a grandchild directly (they can join the parent as
// an admin to gain the right).  That is a deliberate TECHDEBT compromise to
// avoid walking the full ancestor tree on every permission check, and the
// tests below assert it as intended behavior.
//
// Because the `view` check precedes the `delete` check, a user who cannot SEE
// the group gets 404 rather than 403 -- most notably a BANNED member, who gets
// 404 even for an open group.
//
// DELETE is destructive, so every test that expects a SUCCESSFUL delete creates
// its own group; only the tests that expect a refusal share one.
// ============================================================================

async function assertDeleted(session, groupId) {
    const response = await deleteGroupRequest(session, groupId)
    assert.equal(response.status, 200, `Expected 200 but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.equal(response.content?.entity?.id, groupId, 'Expected the deleted group to be echoed back.')
    return response.content.entity
}

async function assertForbidden(session, groupId) {
    const response = await deleteGroupRequest(session, groupId)
    assert.equal(response.status, 403, `Expected 403 not-authorized but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.equal(response.content?.error?.type, 'not-authorized')
}

async function assertNotFound(session, groupId) {
    const response = await deleteGroupRequest(session, groupId)
    assert.equal(response.status, 404, `Expected 404 not-found but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.equal(response.content?.error?.type, 'not-found')
}

async function assertInvalid(session, groupId) {
    const response = await deleteGroupRequest(session, groupId)
    assert.equal(response.status, 400, `Expected 400 invalid but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.equal(response.content?.error?.type, 'invalid')
}

async function assertUnauthenticated(session, groupId) {
    const response = await deleteGroupRequest(session, groupId)
    assert.equal(response.status, 401)
    assert.equal(response.content?.error?.type, 'not-authenticated')
}

// Assert a group is gone as far as the API is concerned.
async function assertGroupGone(session, groupId) {
    const response = await getGroup(session, groupId)
    assert.equal(response.status, 404, `Expected Group(${groupId}) to be gone, got ${response.status}.`)
}

// Tear down a group that a test expected to delete but may not have (e.g. when
// an assertion failed first).  Never throws, so it is safe in a `finally`.
async function cleanupGroup(session, groupId) {
    try {
        await deleteGroup(session, groupId)
    } catch (error) {
        // Already gone -- which is the expected case.
    }
}

describe('DELETE /group/:id', function() {

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
            if ( group ) await cleanupGroup(owner.session, group.id)
            await logout(owner.session)
        })

        it(`Should reject an unauthenticated request`, async function() {
            const session = await initialize()
            await assertUnauthenticated(session, group.id)
        })

        it(`Should reject an unauthenticated request before validating the id`, async function() {
            // Authentication (step 1) precedes id validation (step 2).
            const session = await initialize()
            await assertUnauthenticated(session, 'not-a-uuid')
        })

        it(`Should reject a non-UUID id with 400`, async function() {
            // deleteGroup() validates the route id up front, so a malformed id
            // never reaches the uuid column.
            await assertInvalid(owner.session, 'not-a-uuid')
        })

        it(`Should reject an empty-ish id with 400`, async function() {
            await assertInvalid(owner.session, '12345')
        })

        it(`Should validate the id before checking existence`, async function() {
            // A malformed id is a 400 even though no such group exists.
            await assertInvalid(owner.session, 'also-not-a-uuid')
        })

        it(`Should return 404 for a group that doesn't exist`, async function() {
            await assertNotFound(owner.session, crypto.randomUUID())
        })

        it(`Should return 404 when deleting the same group twice`, async function() {
            const doomed = await createGroup(owner.session)
            await assertDeleted(owner.session, doomed.id)
            await assertNotFound(owner.session, doomed.id)
        })
    })

    describe("permission model", function() {

        describe("an OPEN group", function() {
            // The shared `group` is only used by the tests that expect a
            // REFUSAL -- a refused delete leaves it intact.  Each test that
            // expects a successful delete makes its own group.
            let owner, secondAdmin, moderator, member, invitee, requester, banned, nonMember, siteModerator
            let group = null

            before(async function() {
                owner = await loginAs('user1')
                secondAdmin = await loginAs('user4')
                moderator = await loginAs('user2')
                member = await loginAs('user3')
                invitee = await loginAs('user5')
                banned = await loginAs('user8')
                nonMember = await loginAs('user7')
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
                if ( group ) await cleanupGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(secondAdmin.session)
                await logout(moderator.session)
                await logout(member.session)
                await logout(invitee.session)
                await logout(banned.session)
                await logout(nonMember.session)
                await logout(siteModerator.session)
            })

            it(`Should let the creating admin delete the group`, async function() {
                const doomed = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                try {
                    await assertDeleted(owner.session, doomed.id)
                    await assertGroupGone(owner.session, doomed.id)
                } finally {
                    await cleanupGroup(owner.session, doomed.id)
                }
            })

            it(`Should let a second admin delete the group`, async function() {
                const doomed = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                try {
                    await joinOpenGroup(secondAdmin.session, doomed.id, secondAdmin.user.id)
                    await setGroupMemberRole(owner.session, doomed.id, secondAdmin.user.id, 'admin')
                    await assertDeleted(secondAdmin.session, doomed.id)
                } finally {
                    await cleanupGroup(owner.session, doomed.id)
                }
            })

            it(`Should let a site moderator delete the group`, async function() {
                // canAdminGroup() grants any user with a site role of
                // moderator, admin, or superadmin -- explicitly so that site
                // moderators can remove groups.
                const doomed = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                try {
                    await assertDeleted(siteModerator.session, doomed.id)
                } finally {
                    await cleanupGroup(owner.session, doomed.id)
                }
            })

            it(`Should NOT let a group moderator delete the group`, async function() {
                await assertForbidden(moderator.session, group.id)
            })

            it(`Should NOT let a plain member delete the group`, async function() {
                await assertForbidden(member.session, group.id)
            })

            it(`Should NOT let a pending-invited user delete the group`, async function() {
                await assertForbidden(invitee.session, group.id)
            })

            it(`Should NOT let a non-member delete the group`, async function() {
                await assertForbidden(nonMember.session, group.id)
            })

            it(`Should return 404 (not 403) for a banned member`, async function() {
                // The `view` check runs first and excludes banned members, so
                // they're told it doesn't exist -- even though it's open.
                await assertNotFound(banned.session, group.id)
            })

            it(`Should leave the group intact after a refused delete`, async function() {
                // Every refusal above ran against this group; it must still be
                // there.
                const response = await getGroup(owner.session, group.id)
                assert.equal(response.status, 200, 'A refused delete must not remove the group.')
            })
        })

        describe("a PRIVATE group", function() {
            // Private groups are viewable by anyone, so a non-member is refused
            // with 403 rather than 404.
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
                if ( group ) await cleanupGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(member.session)
                await logout(banned.session)
                await logout(nonMember.session)
            })

            it(`Should let the admin delete the group`, async function() {
                const doomed = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })
                try {
                    await assertDeleted(owner.session, doomed.id)
                    await assertGroupGone(owner.session, doomed.id)
                } finally {
                    await cleanupGroup(owner.session, doomed.id)
                }
            })

            it(`Should NOT let a member delete the group`, async function() {
                await assertForbidden(member.session, group.id)
            })

            it(`Should NOT let a non-member delete the group`, async function() {
                await assertForbidden(nonMember.session, group.id)
            })

            it(`Should return 404 for a banned member`, async function() {
                await assertNotFound(banned.session, group.id)
            })

            it(`Should leave the group intact after a refused delete`, async function() {
                // Every refusal above ran against this group; it must still be
                // there.
                const response = await getGroup(owner.session, group.id)
                assert.equal(response.status, 200, 'A refused delete must not remove the group.')
            })
        })

        describe("a HIDDEN group", function() {
            // Hidden groups are viewable only by their members and invitees, so
            // an outsider gets 404 while an invitee -- who can see it -- gets 403.
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
                if ( group ) await cleanupGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(member.session)
                await logout(invitee.session)
                await logout(banned.session)
                await logout(nonMember.session)
                await logout(siteModerator.session)
            })

            it(`Should let the admin delete the group`, async function() {
                const doomed = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })
                try {
                    await assertDeleted(owner.session, doomed.id)
                } finally {
                    await cleanupGroup(owner.session, doomed.id)
                }
            })

            it(`Should let a site moderator delete the group`, async function() {
                const doomed = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })
                try {
                    await assertDeleted(siteModerator.session, doomed.id)
                } finally {
                    await cleanupGroup(owner.session, doomed.id)
                }
            })

            it(`Should NOT let a member delete the group`, async function() {
                await assertForbidden(member.session, group.id)
            })

            it(`Should return 403 for a pending-invited user (they may view it)`, async function() {
                await assertForbidden(invitee.session, group.id)
            })

            it(`Should return 404 for a non-member (they may not view it)`, async function() {
                await assertNotFound(nonMember.session, group.id)
            })

            it(`Should return 404 for a banned member`, async function() {
                await assertNotFound(banned.session, group.id)
            })

            it(`Should leave the group intact after a refused delete`, async function() {
                // Every refusal above ran against this group; it must still be
                // there.
                const response = await getGroup(owner.session, group.id)
                assert.equal(response.status, 200, 'A refused delete must not remove the group.')
            })
        })

        describe("subgroups", function() {
            let owner, parentAdmin, parentMember, nonMember
            let parent = null
            let subgroup = null

            before(async function() {
                if ( ! subgroupsEnabled ) return
                owner = await loginAs('user1')
                parentAdmin = await loginAs('user4')
                parentMember = await loginAs('user3')
                nonMember = await loginAs('user7')

                parent = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                subgroup = await createSubgroup(owner.session, parent.id, 'private')

                await joinOpenGroup(parentAdmin.session, parent.id, parentAdmin.user.id)
                await setGroupMemberRole(owner.session, parent.id, parentAdmin.user.id, 'admin')

                await joinOpenGroup(parentMember.session, parent.id, parentMember.user.id)
            })

            after(async function() {
                if ( ! subgroupsEnabled ) return
                if ( parent ) await cleanupGroup(owner.session, parent.id)
                await logout(owner.session)
                await logout(parentAdmin.session)
                await logout(parentMember.session)
                await logout(nonMember.session)
            })

            it(`Should let the subgroup's own admin delete it`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                const doomed = await createSubgroup(owner.session, parent.id, 'private')
                try {
                    await assertDeleted(owner.session, doomed.id)
                    await assertGroupGone(owner.session, doomed.id)
                } finally {
                    await cleanupGroup(owner.session, doomed.id)
                }
            })

            it(`Should let an admin of the parent delete the subgroup`, async function(t) {
                // canAdminGroup() accepts an admin of the immediate parent even
                // when they aren't a member of the subgroup itself.
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                const doomed = await createSubgroup(owner.session, parent.id, 'private')
                try {
                    await assertDeleted(parentAdmin.session, doomed.id)
                } finally {
                    await cleanupGroup(owner.session, doomed.id)
                }
            })

            it(`Should NOT let a plain member of the parent delete the subgroup`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertForbidden(parentMember.session, subgroup.id)
            })

            it(`Should NOT let a non-member delete the subgroup`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertForbidden(nonMember.session, subgroup.id)
            })

            it(`Should leave the parent intact when a subgroup is deleted`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                const doomed = await createSubgroup(owner.session, parent.id, 'private')
                try {
                    await assertDeleted(owner.session, doomed.id)
                    const response = await getGroup(owner.session, parent.id)
                    assert.equal(response.status, 200, 'Deleting a subgroup must not remove its parent.')
                } finally {
                    await cleanupGroup(owner.session, doomed.id)
                }
            })

            it(`Should leave the subgroup intact after a refused delete`, async function() {
                // Every refusal above ran against this group; it must still be
                // there.
                const response = await getGroup(owner.session, subgroup.id)
                assert.equal(response.status, 200, 'A refused delete must not remove the subgroup.')
            })
        })

        describe("a HIDDEN-OPEN subgroup", function() {
            // Viewable by members of the PARENT, so a parent member gets 403
            // while an outsider gets 404.
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
                if ( parent ) await cleanupGroup(owner.session, parent.id)
                await logout(owner.session)
                await logout(parentMember.session)
                await logout(nonMember.session)
            })

            it(`Should return 403 for a member of the parent (they may view it)`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertForbidden(parentMember.session, subgroup.id)
            })

            it(`Should return 404 for a non-member of the parent`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertNotFound(nonMember.session, subgroup.id)
            })

            it(`Should leave the subgroup intact after a refused delete`, async function() {
                // Every refusal above ran against this group; it must still be
                // there.
                const response = await getGroup(owner.session, subgroup.id)
                assert.equal(response.status, 200, 'A refused delete must not remove the subgroup.')
            })
        })

        describe("admins of a grandparent -- inheritance stops at one level", function() {
            // Deliberate TECHDEBT: canAdminGroup()'s `ancestors` branch is never
            // populated (canDeleteGroup only supplies group/userMember/
            // parentGroup/parentMember), so admin rights inherit exactly one
            // level rather than walking the whole ancestor tree on every check.
            // A grandparent admin who needs to act on a grandchild can join the
            // intervening parent as an admin -- which the last test here shows.
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

                // Admin of the grandparent ONLY.
                await joinOpenGroup(grandparentAdmin.session, grandparent.id, grandparentAdmin.user.id)
                await setGroupMemberRole(owner.session, grandparent.id, grandparentAdmin.user.id, 'admin')
            })

            after(async function() {
                if ( ! subgroupsEnabled ) return
                if ( grandparent ) await cleanupGroup(owner.session, grandparent.id)
                await logout(owner.session)
                await logout(grandparentAdmin.session)
            })

            it(`Should NOT let an admin of the grandparent delete the grandchild`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertForbidden(grandparentAdmin.session, child.id)
            })

            it(`Should let an admin of the grandparent delete the immediate child`, async function(t) {
                // One level of inheritance does work: `parentMember` is loaded.
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                const doomed = await createSubgroup(owner.session, grandparent.id, 'open')
                try {
                    await assertDeleted(grandparentAdmin.session, doomed.id)
                } finally {
                    await cleanupGroup(owner.session, doomed.id)
                }
            })

            it(`Should let a grandparent admin delete a grandchild once they join the parent as an admin`, async function(t) {
                // The documented workaround for the TECHDEBT above.
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                const midGroup = await createSubgroup(owner.session, grandparent.id, 'open')
                try {
                    const doomed = await createSubgroup(owner.session, midGroup.id, 'open')

                    await assertForbidden(grandparentAdmin.session, doomed.id)

                    await joinGroupAsAdmin(grandparentAdmin.session, midGroup.id, grandparentAdmin.user.id)

                    await assertDeleted(grandparentAdmin.session, doomed.id)
                } finally {
                    await cleanupGroup(owner.session, midGroup.id)
                }
            })
        })
    })

    // ========================================================================
    // CASCADES
    //
    // groupDAO.deleteGroup() is a bare `DELETE FROM groups WHERE id = $1`, so
    // every child row is removed by the database's own ON DELETE CASCADE rules
    // rather than by application code.  Per schema.sql the following reference
    // groups(id) ON DELETE CASCADE: groups.parent_id (subgroups, recursively),
    // group_members, group_subscriptions, posts, group_moderation,
    // group_moderation_events, site_moderation and site_moderation_events.
    // Posts in turn cascade to post_files, post_versions, post_reactions,
    // post_comments and post_subscriptions.
    //
    // That makes a successful delete meaningful in itself: if any populated
    // child table were missing its CASCADE (i.e. left at the default NO
    // ACTION), Postgres would refuse the DELETE with a foreign-key violation
    // and the request would surface as 500 rather than 200.  The first test
    // below -- deleting a group that has members, a subscription, posts,
    // comments and reactions -- is therefore the STRUCTURAL cascade test, and
    // it is the one that would catch a missing CASCADE.
    //
    // The checks that follow it assert the API contract rather than the row
    // count: once the group is gone its members, subscription, posts and
    // comments must all be unreachable.  Note that they cannot by themselves
    // distinguish "row deleted" from "row present but no longer viewable",
    // because every one of those endpoints resolves the group first and 404s
    // when it is missing.  Deletion of the group ROW itself is proved
    // independently by the slug-reuse test, since POST /groups checks slug
    // uniqueness with a direct lookup.
    //
    // NOT covered here: group_moderation / site_moderation rows, which would
    // need the moderation endpoints to set up.  They are declared CASCADE in
    // schema.sql alongside the tables exercised below.
    // ========================================================================
    describe("cascades", function() {

        describe("a fully populated group", function() {
            let owner, member, other
            let group = null
            let slug = null
            let ownerPost = null
            let memberPost = null

            before(async function() {
                owner = await loginAs('user1')
                member = await loginAs('user3')
                other = await loginAs('user4')

                slug = `cascade-${crypto.randomUUID()}`
                group = await createGroup(owner.session, {
                    type: 'open',
                    postPermissions: 'anyone',
                    slug: slug
                })

                // Members: one joined, one invited-and-accepted.  Creating the
                // group also subscribes the creator (group_subscriptions).
                await joinOpenGroup(member.session, group.id, member.user.id)
                await addConfirmedMember(owner.session, other.session, group.id, other.user.id)

                // Posts, with comments and reactions hanging off them.
                ownerPost = await createGroupPost(owner.session, owner.user.id, group.id, 'open')
                memberPost = await createGroupPost(member.session, member.user.id, group.id, 'open')

                await addComment(member.session, ownerPost.id, 'A comment from a member.')
                await addComment(owner.session, memberPost.id, 'A comment from the admin.')
                await addReaction(member.session, ownerPost.id, 'like')
                await addReaction(owner.session, memberPost.id, 'like')
            })

            after(async function() {
                if ( group ) await cleanupGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(member.session)
                await logout(other.session)
            })

            it(`Should delete a group that has members, posts, comments and reactions`, async function() {
                // The structural cascade test: a foreign key left at NO ACTION
                // anywhere in the tree would make this a 500.
                const entity = await assertDeleted(owner.session, group.id)
                assert.equal(entity.slug, slug, 'Expected the deleted group to be echoed back.')
            })

            it(`Should remove the group itself`, async function() {
                await assertGroupGone(owner.session, group.id)
            })

            it(`Should remove the group's members`, async function() {
                const response = await fetchEndpoint('GET', `/group/${encodeURIComponent(group.id)}/members`, { session: owner.session })
                assert.equal(response.status, 404, `Expected the members of a deleted group to be unreachable, got ${response.status}.`)
            })

            it(`Should remove the group's subscription`, async function() {
                const response = await fetchEndpoint('GET', `/group/${encodeURIComponent(group.id)}/subscription`, { session: owner.session })
                assert.equal(response.status, 404, `Expected the subscription of a deleted group to be unreachable, got ${response.status}.`)
            })

            it(`Should remove the group's posts`, async function() {
                const ownerResponse = await getPost(owner.session, ownerPost.id)
                assert.equal(ownerResponse.status, 404, `Expected the admin's group post to be gone, got ${ownerResponse.status}.`)

                const memberResponse = await getPost(member.session, memberPost.id)
                assert.equal(memberResponse.status, 404, `Expected the member's group post to be gone, got ${memberResponse.status}.`)
            })

            it(`Should remove the comments on those posts`, async function() {
                const response = await fetchEndpoint('GET', `/post/${encodeURIComponent(ownerPost.id)}/comments`, { session: owner.session })
                assert.equal(response.status, 404, `Expected the comments of a deleted post to be unreachable, got ${response.status}.`)
            })

            it(`Should free the group's slug for reuse`, async function() {
                // Definitive proof the row is gone rather than merely hidden:
                // POST /groups checks slug uniqueness with a direct lookup, so
                // a surviving row would come back as a 400 conflict.
                const replacement = await createGroup(owner.session, {
                    type: 'open',
                    postPermissions: 'anyone',
                    slug: slug
                })
                try {
                    assert.equal(replacement.slug, slug)
                    assert.notEqual(replacement.id, group.id)
                } finally {
                    await cleanupGroup(owner.session, replacement.id)
                }
            })
        })

        describe("subgroup trees", function() {
            let owner
            let parent = null
            let child = null
            let grandchild = null
            let parentPost = null
            let childPost = null
            let grandchildPost = null

            before(async function() {
                if ( ! subgroupsEnabled ) return
                owner = await loginAs('user1')

                parent = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                child = await createSubgroup(owner.session, parent.id, 'open')
                grandchild = await createSubgroup(owner.session, child.id, 'open')

                parentPost = await createGroupPost(owner.session, owner.user.id, parent.id, 'open')
                childPost = await createGroupPost(owner.session, owner.user.id, child.id, 'open')
                grandchildPost = await createGroupPost(owner.session, owner.user.id, grandchild.id, 'open')
            })

            after(async function() {
                if ( ! subgroupsEnabled ) return
                if ( parent ) await cleanupGroup(owner.session, parent.id)
                await logout(owner.session)
            })

            it(`Should delete a whole subgroup tree with the parent`, async function(t) {
                // groups.parent_id cascades recursively, so deleting the root
                // takes the child and grandchild with it.
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertDeleted(owner.session, parent.id)

                await assertGroupGone(owner.session, parent.id)
                await assertGroupGone(owner.session, child.id)
                await assertGroupGone(owner.session, grandchild.id)
            })

            it(`Should delete the posts belonging to every group in the tree`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                for ( const post of [ parentPost, childPost, grandchildPost ] ) {
                    const response = await getPost(owner.session, post.id)
                    assert.equal(response.status, 404, `Expected Post(${post.id}) to be gone with its group, got ${response.status}.`)
                }
            })
        })

        describe("deleting a subgroup leaves the rest of the tree intact", function() {
            let owner
            let parent = null
            let child = null
            let sibling = null
            let parentPost = null

            before(async function() {
                if ( ! subgroupsEnabled ) return
                owner = await loginAs('user1')

                parent = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                child = await createSubgroup(owner.session, parent.id, 'open')
                sibling = await createSubgroup(owner.session, parent.id, 'open')
                parentPost = await createGroupPost(owner.session, owner.user.id, parent.id, 'open')
            })

            after(async function() {
                if ( ! subgroupsEnabled ) return
                if ( parent ) await cleanupGroup(owner.session, parent.id)
                await logout(owner.session)
            })

            it(`Should leave the parent, its sibling and their posts untouched`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertDeleted(owner.session, child.id)

                await assertGroupGone(owner.session, child.id)

                const parentResponse = await getGroup(owner.session, parent.id)
                assert.equal(parentResponse.status, 200, 'The parent must survive its child being deleted.')

                const siblingResponse = await getGroup(owner.session, sibling.id)
                assert.equal(siblingResponse.status, 200, 'A sibling subgroup must survive.')

                const postResponse = await getPost(owner.session, parentPost.id)
                assert.equal(postResponse.status, 200, "The parent's posts must survive.")
            })
        })

        describe("scope -- unrelated data survives", function() {
            let owner, member
            let doomed = null
            let survivor = null
            let feedPost = null
            let survivorPost = null

            before(async function() {
                owner = await loginAs('user1')
                member = await loginAs('user3')

                doomed = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                survivor = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })

                await joinOpenGroup(member.session, doomed.id, member.user.id)
                await joinOpenGroup(member.session, survivor.id, member.user.id)

                feedPost = await createPost(owner.session, owner.user.id)
                survivorPost = await createGroupPost(owner.session, owner.user.id, survivor.id, 'open')

                await createGroupPost(owner.session, owner.user.id, doomed.id, 'open')
            })

            after(async function() {
                if ( doomed ) await cleanupGroup(owner.session, doomed.id)
                if ( survivor ) await cleanupGroup(owner.session, survivor.id)
                if ( feedPost ) await deletePost(owner.session, feedPost.id)
                await logout(owner.session)
                await logout(member.session)
            })

            it(`Should not touch the owner's other groups`, async function() {
                await assertDeleted(owner.session, doomed.id)

                const response = await getGroup(owner.session, survivor.id)
                assert.equal(response.status, 200, "Deleting one group must not remove the owner's other groups.")
            })

            it(`Should not touch posts in other groups`, async function() {
                const response = await getPost(owner.session, survivorPost.id)
                assert.equal(response.status, 200, 'A post in an unrelated group must survive.')
            })

            it(`Should not touch the owner's feed posts`, async function() {
                const response = await getPost(owner.session, feedPost.id)
                assert.equal(response.status, 200, 'A feed post must survive the deletion of an unrelated group.')
            })

            it(`Should not touch memberships in other groups`, async function() {
                const response = await fetchEndpoint('GET', `/group/${encodeURIComponent(survivor.id)}/member/${encodeURIComponent(member.user.id)}`, { session: member.session })
                assert.equal(response.status, 200, 'A membership in an unrelated group must survive.')
            })
        })
    })

    describe("response", function() {
        let owner

        before(async function() {
            owner = await loginAs('user1')
        })

        after(async function() {
            await logout(owner.session)
        })

        it(`Should return 200 with the deleted entity and relations`, async function() {
            // DELETE answers 200 (PATCH answers 201) and echoes the group as it
            // was immediately before deletion.
            const doomed = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })
            try {
                const response = await deleteGroupRequest(owner.session, doomed.id)

                assert.equal(response.status, 200)
                assert.equal(response.content?.entity?.id, doomed.id)
                assert.equal(response.content?.entity?.title, doomed.title)
                assert.equal(response.content?.entity?.type, 'private')
                assert.ok(response.content?.relations !== undefined, 'Expected `relations` on the response.')
            } finally {
                await cleanupGroup(owner.session, doomed.id)
            }
        })
    })
})
