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
const { createPost, deleteAllPostsForUser } = require('../../lib/posts')
const {
    createGroup,
    createSubgroup,
    deleteGroup,
    joinOpenGroup,
    addConfirmedMember,
    setGroupMemberStatus,
    setGroupMemberRole,
    removeGroupMember
} = require('../../lib/groups')
const { isFeatureEnabled } = require('../../lib/system')

// Subgroups are gated behind this feature flag; the subgroup describe below
// skips itself when it is off.
const SUBGROUPS_FEATURE = 'issue-165-subgroups'
let subgroupsEnabled = false

// ============================================================================
// POST /posts drives PostController.postPosts(), which runs, in order:
//   1. authentication          -> 401 not-authenticated
//   2. PermissionService.can(user, 'create', 'Post')   -> 403 not-authorized
//   3. ValidationService.validatePost(user, post)      -> 400 invalid
//   4. insert                                           -> 201 { entity }
//
// Because permission is checked BEFORE validation, a request that would fail
// both comes back 403.  The validation tests below therefore use requests that
// pass the permission check first (feed posts, or groups the caller may post
// to) so that validation is actually the gate being exercised.
//
// Media attachments (files / linkPreviewId) are deliberately out of scope for
// this pass, per plan; sharedPostId is covered since it needs no upload.
// ============================================================================

async function submitPost(session, body) {
    return await fetchEndpoint('POST', '/posts', { session: session, body: body })
}

// Branch-free outcome helpers -- each test picks the one matching its expectation.
async function assertCreated(session, body) {
    const response = await submitPost(session, body)
    assert.equal(response.status, 201, `Expected 201 Created but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.ok(response.content?.entity?.id, 'Created post is missing an entity id.')
    return response.content
}

// Posting to a group whose postPermissions is 'approval' is allowed (201) but
// has a side effect: the post is held for approval, so the controller attaches
// a pending group moderation and returns the post with `groupModerationId` set.
// This asserts the create succeeds AND that side effect landed.
async function assertCreatedPending(session, body) {
    const { entity, relations } = await assertCreated(session, body)
    assert.ok(entity.groupModerationId,
        `Expected an approval-group post to come back with a pending groupModerationId, got ${JSON.stringify(entity.groupModerationId)}`)
    assert.match(String(entity.groupModerationId), /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        `Expected groupModerationId to be a UUID, got ${entity.groupModerationId}`)
    const moderation = relations.groupModerations[entity.groupModerationId]
    assert.equal(moderation?.status, 'pending', `Expected approval-group post to come back with a 'pending' moderation status, got ${moderation?.status}.`)
    return entity
}

// The contrast: a post that is NOT held for approval comes back with no
// moderation attached.
async function assertCreatedNotPending(session, body) {
    const { entity } = await assertCreated(session, body)
    assert.equal(entity.groupModerationId, null,
        `Expected a non-approval post to have no groupModerationId, got ${JSON.stringify(entity.groupModerationId)}`)
    return entity
}

async function assertForbidden(session, body) {
    const response = await submitPost(session, body)
    assert.equal(response.status, 403, `Expected 403 not-authorized but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.equal(response.content?.error?.type, 'not-authorized')
}

async function assertInvalid(session, body) {
    const response = await submitPost(session, body)
    assert.equal(response.status, 400, `Expected 400 invalid but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.equal(response.content?.error?.type, 'invalid')
}

async function assertUnauthenticated(session, body) {
    const response = await submitPost(session, body)
    assert.equal(response.status, 401)
    assert.equal(response.content?.error?.type, 'not-authenticated')
}

// Submission builders.  Fields overridden to `undefined` are dropped by JSON
// serialization, which is how the "missing field" cases omit a field.
function feedSubmission(userId, overrides = {}) {
    return {
        type: 'feed',
        visibility: 'private',
        userId: userId,
        groupId: null,
        files: [],
        linkPreviewId: null,
        sharedPostId: null,
        content: 'A test feed post.',
        ...overrides
    }
}

function groupSubmission(userId, groupId, visibility, overrides = {}) {
    return {
        type: 'group',
        visibility: visibility,
        userId: userId,
        groupId: groupId,
        files: [],
        linkPreviewId: null,
        sharedPostId: null,
        content: 'A test group post.',
        ...overrides
    }
}

describe('POST /posts', function() {

    before(async function() {
        subgroupsEnabled = await isFeatureEnabled(SUBGROUPS_FEATURE)
    })

    describe("authentication", function() {
        it(`Should reject an unauthenticated request`, async function() {
            const session = await initialize()
            await assertUnauthenticated(session, feedSubmission(crypto.randomUUID()))
        })
    })

    describe("permission model", function() {
        describe("for feed posts", function() {
            it(`Should let any authenticated user create a feed post for themselves`, async function() {
                const owner = await loginAs('user1')
                try {
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await assertCreated(owner.session, feedSubmission(owner.user.id, { visibility: 'public' }))
                } finally {
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await logout(owner.session)
                }
            })
        })

        describe("for group posts (open group, isolating the postPermissions gate)", function() {
            describe("when postPermissions is 'anyone'", function() {
                let owner, moderator, member, nonMember
                let group = null

                before(async function() {
                    owner = await loginAs('user1')       // creator => admin
                    moderator = await loginAs('user2')
                    member = await loginAs('user3')
                    nonMember = await loginAs('user7')

                    group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })

                    await joinOpenGroup(moderator.session, group.id, moderator.user.id)
                    await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
                    await joinOpenGroup(member.session, group.id, member.user.id)
                })

                after(async function() {
                    if ( group ) await deleteGroup(owner.session, group.id)
                    await logout(owner.session)
                    await logout(moderator.session)
                    await logout(member.session)
                    await logout(nonMember.session)
                })

                it(`Should let a non-member create a post`, async function() {
                    await assertCreated(nonMember.session, groupSubmission(nonMember.user.id, group.id, 'public'))
                })

                it(`Should let a confirmed member create a post`, async function() {
                    await assertCreated(member.session, groupSubmission(member.user.id, group.id, 'public'))
                })

                it(`Should let a moderator create a post`, async function() {
                    await assertCreated(moderator.session, groupSubmission(moderator.user.id, group.id, 'public'))
                })

                it(`Should let an admin create a post`, async function() {
                    await assertCreated(owner.session, groupSubmission(owner.user.id, group.id, 'public'))
                })

                it(`Should NOT let a banned member create a post`, async function() {
                    try {
                        await joinOpenGroup(nonMember.session, group.id, nonMember.user.id)
                        await setGroupMemberStatus(owner.session, group.id, nonMember.user.id, 'banned')
                        await assertForbidden(nonMember.session, groupSubmission(nonMember.user.id, group.id, 'public'))
                    } finally {
                        await removeGroupMember(owner.session, group.id, nonMember.user.id)
                    }
                })
            })

            describe("when postPermissions is 'members'", function() {
                let owner, moderator, member, nonMember
                let group = null

                before(async function() {
                    owner = await loginAs('user1')       // creator => admin
                    moderator = await loginAs('user2')
                    member = await loginAs('user3')
                    nonMember = await loginAs('user7')

                    group = await createGroup(owner.session, { type: 'open', postPermissions: 'members' })

                    await joinOpenGroup(moderator.session, group.id, moderator.user.id)
                    await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
                    await joinOpenGroup(member.session, group.id, member.user.id)
                })

                after(async function() {
                    if ( group ) await deleteGroup(owner.session, group.id)
                    await logout(owner.session)
                    await logout(moderator.session)
                    await logout(member.session)
                    await logout(nonMember.session)
                })

                it(`Should NOT let a non-member create a post`, async function() {
                    await assertForbidden(nonMember.session, groupSubmission(nonMember.user.id, group.id, 'public'))
                })

                it(`Should let a confirmed member create a post`, async function() {
                    await assertCreated(member.session, groupSubmission(member.user.id, group.id, 'public'))
                })

                it(`Should let a moderator create a post`, async function() {
                    await assertCreated(moderator.session, groupSubmission(moderator.user.id, group.id, 'public'))
                })

                it(`Should let an admin create a post`, async function() {
                    await assertCreated(owner.session, groupSubmission(owner.user.id, group.id, 'public'))
                })

                it(`Should NOT let a banned member create a post`, async function() {
                    try {
                        await joinOpenGroup(nonMember.session, group.id, nonMember.user.id)
                        await setGroupMemberStatus(owner.session, group.id, nonMember.user.id, 'banned')
                        await assertForbidden(nonMember.session, groupSubmission(nonMember.user.id, group.id, 'public'))
                    } finally {
                        await removeGroupMember(owner.session, group.id, nonMember.user.id)
                    }
                })
            })

            describe("when postPermissions is 'restricted'", function() {
                let owner, moderator, member, nonMember
                let group = null

                before(async function() {
                    owner = await loginAs('user1')       // creator => admin
                    moderator = await loginAs('user2')
                    member = await loginAs('user3')
                    nonMember = await loginAs('user7')

                    group = await createGroup(owner.session, { type: 'open', postPermissions: 'restricted' })

                    await joinOpenGroup(moderator.session, group.id, moderator.user.id)
                    await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
                    await joinOpenGroup(member.session, group.id, member.user.id)
                })

                after(async function() {
                    if ( group ) await deleteGroup(owner.session, group.id)
                    await logout(owner.session)
                    await logout(moderator.session)
                    await logout(member.session)
                    await logout(nonMember.session)
                })

                it(`Should NOT let a non-member create a post`, async function() {
                    await assertForbidden(nonMember.session, groupSubmission(nonMember.user.id, group.id, 'public'))
                })

                it(`Should NOT let a confirmed member create a post`, async function() {
                    await assertForbidden(member.session, groupSubmission(member.user.id, group.id, 'public'))
                })

                it(`Should let a moderator create a post`, async function() {
                    await assertCreated(moderator.session, groupSubmission(moderator.user.id, group.id, 'public'))
                })

                it(`Should let an admin create a post`, async function() {
                    await assertCreated(owner.session, groupSubmission(owner.user.id, group.id, 'public'))
                })

                it(`Should NOT let a banned member create a post`, async function() {
                    try {
                        await joinOpenGroup(nonMember.session, group.id, nonMember.user.id)
                        await setGroupMemberStatus(owner.session, group.id, nonMember.user.id, 'banned')
                        await assertForbidden(nonMember.session, groupSubmission(nonMember.user.id, group.id, 'public'))
                    } finally {
                        await removeGroupMember(owner.session, group.id, nonMember.user.id)
                    }
                })
            })

            describe("when postPermissions is 'approval'", function() {
                let owner, moderator, member, nonMember
                let group = null

                before(async function() {
                    owner = await loginAs('user1')       // creator => admin
                    moderator = await loginAs('user2')
                    member = await loginAs('user3')
                    nonMember = await loginAs('user7')

                    group = await createGroup(owner.session, { type: 'open', postPermissions: 'approval' })

                    await joinOpenGroup(moderator.session, group.id, moderator.user.id)
                    await setGroupMemberRole(owner.session, group.id, moderator.user.id, 'moderator')
                    await joinOpenGroup(member.session, group.id, member.user.id)
                })

                after(async function() {
                    if ( group ) await deleteGroup(owner.session, group.id)
                    await logout(owner.session)
                    await logout(moderator.session)
                    await logout(member.session)
                    await logout(nonMember.session)
                })

                it(`Should NOT let a non-member create a post`, async function() {
                    await assertForbidden(nonMember.session, groupSubmission(nonMember.user.id, group.id, 'public'))
                })

                it(`Should let a confirmed member create a post, held pending approval`, async function() {
                    await assertCreatedPending(member.session, groupSubmission(member.user.id, group.id, 'public'))
                })

                it(`Should let a moderator create a post, held pending approval`, async function() {
                    // A moderator's own post is still routed through approval on
                    // creation; the pending moderation is attached regardless of role.
                    await assertCreatedPending(moderator.session, groupSubmission(moderator.user.id, group.id, 'public'))
                })

                it(`Should let an admin create a post, held pending approval`, async function() {
                    await assertCreatedPending(owner.session, groupSubmission(owner.user.id, group.id, 'public'))
                })

                it(`Should NOT let a banned member create a post`, async function() {
                    try {
                        await joinOpenGroup(nonMember.session, group.id, nonMember.user.id)
                        await setGroupMemberStatus(owner.session, group.id, nonMember.user.id, 'banned')
                        await assertForbidden(nonMember.session, groupSubmission(nonMember.user.id, group.id, 'public'))
                    } finally {
                        await removeGroupMember(owner.session, group.id, nonMember.user.id)
                    }
                })
            })

        })

        describe("view permission is a prerequisite for creating", function() {
            // A private group is not viewable by non-members, so even postPermissions
            // 'anyone' cannot let a non-member post to it.
            let owner, nonMember
            let group = null

            before(async function() {
                owner = await loginAs('user1')
                nonMember = await loginAs('user7')
                group = await createGroup(owner.session, { type: 'private', postPermissions: 'anyone' })
            })

            after(async function() {
                if ( group ) await deleteGroup(owner.session, group.id)
                await logout(owner.session)
                await logout(nonMember.session)
            })

            it(`Should NOT let a non-member post to a private group even when postPermissions is 'anyone'`, async function() {
                await assertForbidden(nonMember.session, groupSubmission(nonMember.user.id, group.id, 'private'))
            })

            it(`Should let a confirmed member post to that same private 'anyone' group`, async function() {
                try {
                    await addConfirmedMember(owner.session, nonMember.session, group.id, nonMember.user.id)
                    await assertCreated(nonMember.session, groupSubmission(nonMember.user.id, group.id, 'private'))
                } finally {
                    await removeGroupMember(owner.session, group.id, nonMember.user.id)
                }
            })
        })

        describe("for subgroup posts", function() {
            let owner, parentMember, subgroupMember, nonMember
            let parent = null

            before(async function() {
                if ( ! subgroupsEnabled ) return
                owner = await loginAs('user1')                // admin of parent and child
                parentMember = await loginAs('user6')         // member of the parent only
                subgroupMember = await loginAs('user3')       // member of the subgroup
                nonMember = await loginAs('user7')            // member of nothing

                parent = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })
                await addConfirmedMember(owner.session, parentMember.session, parent.id, parentMember.user.id)
            })

            after(async function() {
                if ( ! subgroupsEnabled ) return
                if ( parent ) await deleteGroup(owner.session, parent.id)
                await logout(owner.session)
                await logout(parentMember.session)
                await logout(subgroupMember.session)
                await logout(nonMember.session)
            })

            describe("a PRIVATE-OPEN subgroup with postPermissions 'anyone'", function() {
                let child = null

                before(async function() {
                    if ( ! subgroupsEnabled ) return
                    child = await createSubgroup(owner.session, parent.id, 'private-open', { postPermissions: 'anyone' })
                })

                after(async function() {
                    if ( ! subgroupsEnabled ) return
                    if ( child ) await deleteGroup(owner.session, child.id)
                })

                it(`Should let a parent member post (they can view it, and 'anyone' may post)`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCreated(parentMember.session, groupSubmission(parentMember.user.id, child.id, 'private'))
                })

                it(`Should NOT let a non-member of parent or subgroup post (cannot view it)`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertForbidden(nonMember.session, groupSubmission(nonMember.user.id, child.id, 'private'))
                })
            })

            describe("a PRIVATE-OPEN subgroup with postPermissions 'members'", function() {
                let child = null

                before(async function() {
                    if ( ! subgroupsEnabled ) return
                    child = await createSubgroup(owner.session, parent.id, 'private-open', { postPermissions: 'members' })
                    await addConfirmedMember(owner.session, subgroupMember.session, child.id, subgroupMember.user.id)
                })

                after(async function() {
                    if ( ! subgroupsEnabled ) return
                    if ( child ) await deleteGroup(owner.session, child.id)
                })

                it(`Should NOT let a parent member post (can view, but is not a subgroup member)`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertForbidden(parentMember.session, groupSubmission(parentMember.user.id, child.id, 'private'))
                })

                it(`Should let a confirmed subgroup member post`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    await assertCreated(subgroupMember.session, groupSubmission(subgroupMember.user.id, child.id, 'private'))
                })
            })
        })
    })

    describe("validation model", function() {

        describe("field validation (feed posts)", function() {
            let owner, other

            before(async function() {
                owner = await loginAs('user1')
                other = await loginAs('user2')   // a second real user, for the userId-mismatch case
            })

            after(async function() {
                await deleteAllPostsForUser(owner.session, owner.user.id)
                await logout(owner.session)
                await logout(other.session)
            })

            it(`Should reject a post with no type`, async function() {
                await assertInvalid(owner.session, feedSubmission(owner.user.id, { type: undefined }))
            })

            it(`Should reject a post with an invalid type`, async function() {
                await assertInvalid(owner.session, feedSubmission(owner.user.id, { type: 'banana' }))
            })

            it(`Should reject a post with no visibility`, async function() {
                await assertInvalid(owner.session, feedSubmission(owner.user.id, { visibility: undefined }))
            })

            it(`Should reject a post with an invalid visibility`, async function() {
                await assertInvalid(owner.session, feedSubmission(owner.user.id, { visibility: 'secret' }))
            })

            it(`Should reject a post with no userId`, async function() {
                await assertInvalid(owner.session, feedSubmission(owner.user.id, { userId: undefined }))
            })

            it(`Should reject a post whose content is too long`, async function() {
                await assertInvalid(owner.session, feedSubmission(owner.user.id, { content: 'a'.repeat(10001) }))
            })

            it(`Should reject a post with null content`, async function() {
                await assertInvalid(owner.session, feedSubmission(owner.user.id, { content: null }))
            })

            it(`Should reject a post that sets siteModerationId`, async function() {
                await assertInvalid(owner.session, feedSubmission(owner.user.id, { siteModerationId: crypto.randomUUID() }))
            })

            it(`Should reject a post that sets groupModerationId`, async function() {
                await assertInvalid(owner.session, feedSubmission(owner.user.id, { groupModerationId: crypto.randomUUID() }))
            })

            it(`Should reject a post that sets activity`, async function() {
                await assertInvalid(owner.session, feedSubmission(owner.user.id, { activity: 5 }))
            })

            it(`Should reject a post that sets createdDate`, async function() {
                await assertInvalid(owner.session, feedSubmission(owner.user.id, { createdDate: new Date().toISOString() }))
            })

            it(`Should reject a post that sets updatedDate`, async function() {
                await assertInvalid(owner.session, feedSubmission(owner.user.id, { updatedDate: new Date().toISOString() }))
            })

            it(`Should NOT let a user post on behalf of another user`, async function() {
                await assertInvalid(owner.session, feedSubmission(owner.user.id, { userId: other.user.id }))
            })
        })

        describe("type / visibility consistency", function() {
            let owner
            let openGroup = null
            let privateGroup = null

            before(async function() {
                owner = await loginAs('user1')
                openGroup = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                privateGroup = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })
            })

            after(async function() {
                if ( openGroup ) await deleteGroup(owner.session, openGroup.id)
                if ( privateGroup ) await deleteGroup(owner.session, privateGroup.id)
                await deleteAllPostsForUser(owner.session, owner.user.id)
                await logout(owner.session)
            })

            it(`Should reject a feed post that carries a groupId`, async function() {
                await assertInvalid(owner.session, feedSubmission(owner.user.id, { type: 'feed', groupId: openGroup.id }))
            })

            it(`Should reject a group post with no groupId`, async function() {
                await assertInvalid(owner.session, feedSubmission(owner.user.id, { type: 'group', visibility: 'public', groupId: null }))
            })

            it(`Should reject a post to an OPEN group that is not public`, async function() {
                await assertInvalid(owner.session, groupSubmission(owner.user.id, openGroup.id, 'private'))
            })

            it(`Should reject a post to a PRIVATE group that is not private`, async function() {
                await assertInvalid(owner.session, groupSubmission(owner.user.id, privateGroup.id, 'public'))
            })

            it(`Should reject an announcement post from a non-admin`, async function() {
                await assertInvalid(owner.session, feedSubmission(owner.user.id, { type: 'announcement', visibility: 'public' }))
            })

            it(`Should reject an info post from a non-admin`, async function() {
                await assertInvalid(owner.session, feedSubmission(owner.user.id, { type: 'info', visibility: 'public' }))
            })
        })

        describe("subgroup visibility consistency", function() {
            let owner
            let parent = null
            let child = null

            before(async function() {
                if ( ! subgroupsEnabled ) return
                owner = await loginAs('user1')
                parent = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })
                child = await createSubgroup(owner.session, parent.id, 'private-open', { postPermissions: 'members' })
            })

            after(async function() {
                if ( ! subgroupsEnabled ) return
                if ( child ) await deleteGroup(owner.session, child.id)
                if ( parent ) await deleteGroup(owner.session, parent.id)
                await logout(owner.session)
            })

            it(`Should reject a public post to a private-open subgroup (must be private)`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertInvalid(owner.session, groupSubmission(owner.user.id, child.id, 'public'))
            })
        })

        describe("shared posts", function() {
            let owner

            before(async function() {
                owner = await loginAs('user1')
            })

            after(async function() {
                await deleteAllPostsForUser(owner.session, owner.user.id)
                await logout(owner.session)
            })

            it(`Should let a user share a public post`, async function() {
                const shared = await createPost(owner.session, owner.user.id, { visibility: 'public' })
                await assertCreated(owner.session, feedSubmission(owner.user.id, { visibility: 'public', sharedPostId: shared.id }))
            })

            it(`Should NOT let a user share a private post`, async function() {
                const shared = await createPost(owner.session, owner.user.id, { visibility: 'private' })
                await assertInvalid(owner.session, feedSubmission(owner.user.id, { visibility: 'public', sharedPostId: shared.id }))
            })

            it(`Should NOT let a user share a post that doesn't exist`, async function() {
                await assertInvalid(owner.session, feedSubmission(owner.user.id, { visibility: 'public', sharedPostId: crypto.randomUUID() }))
            })
        })

        describe("valid submissions", function() {
            let owner
            let openGroup = null
            let privateGroup = null

            before(async function() {
                owner = await loginAs('user1')
                openGroup = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                privateGroup = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })
            })

            after(async function() {
                if ( openGroup ) await deleteGroup(owner.session, openGroup.id)
                if ( privateGroup ) await deleteGroup(owner.session, privateGroup.id)
                await deleteAllPostsForUser(owner.session, owner.user.id)
                await logout(owner.session)
            })

            it(`Should create a valid public feed post`, async function() {
                const { entity } = await assertCreated(owner.session, feedSubmission(owner.user.id, { visibility: 'public', content: 'Hello, world.' }))
                assert.equal(entity.type, 'feed')
                assert.equal(entity.visibility, 'public')
                assert.equal(entity.userId, owner.user.id)
                assert.equal(entity.groupId, null)
                assert.equal(entity.content, 'Hello, world.')
            })

            it(`Should create a valid private feed post`, async function() {
                const { entity } = await assertCreated(owner.session, feedSubmission(owner.user.id, { visibility: 'private' }))
                assert.equal(entity.type, 'feed')
                assert.equal(entity.visibility, 'private')
            })

            it(`Should create a valid public post to an OPEN group`, async function() {
                const entity = await assertCreatedNotPending(owner.session, groupSubmission(owner.user.id, openGroup.id, 'public'))
                assert.equal(entity.type, 'group')
                assert.equal(entity.visibility, 'public')
                assert.equal(entity.groupId, openGroup.id)
            })

            it(`Should create a valid private post to a PRIVATE group`, async function() {
                const entity = await assertCreatedNotPending(owner.session, groupSubmission(owner.user.id, privateGroup.id, 'private'))
                assert.equal(entity.type, 'group')
                assert.equal(entity.visibility, 'private')
                assert.equal(entity.groupId, privateGroup.id)
            })
        })
    })
})
