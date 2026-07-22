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
    deleteGroup,
    joinOpenGroup,
    setGroupMemberRole
} = require('../../lib/groups')
const { isFeatureEnabled } = require('../../lib/system')

// Subgroups (and the `parentId` column + compound types) are gated behind this
// feature flag; the subgroup describes below skip themselves when it is off.
const SUBGROUPS_FEATURE = 'issue-165-subgroups'
let subgroupsEnabled = false

// ============================================================================
// POST /groups drives GroupController.postGroups(), which runs, in order:
//   1. authentication                                              -> 401 not-authenticated
//   2. groupSchema.clean(body)                                     (strips unknown fields, trims)
//   3. PermissionService.can(user, 'create', 'Group', context)    -> 403 not-authorized
//        - top-level (no parentId): any confirmed user may create.
//        - subgroup  (parentId set): only an ADMIN of the parent may create.
//   4. slug lower-cased + groupSchema.properties.slug.validate()   -> 400 invalid (slug format)
//   5. getGroupBySlug() uniqueness                                 -> 400 conflict
//   6. ValidationService.validateGroup(user, group)               -> 400 invalid
//        - groupSchema.validate() (schema/Group.js) for every field, then
//        - parentId existence, then fileId existence/ownership/usage.
//   7. insert + make creator an admin member + subscribe          -> 201 { entity }
//
// Note the ORDERING carefully: permission is checked before validation, and the
// slug is lower-cased (step 4) and the parent is loaded for the permission check
// (step 3) BEFORE the schema validates those fields (step 6).  That ordering is
// the source of the three skipped "bug" cases below (missing/null/non-string
// slug and a non-UUID parentId throw before validation can turn them into a
// clean 400 -- see the comments on each).
// ============================================================================

async function submitGroup(session, body) {
    return await fetchEndpoint('POST', '/groups', { session: session, body: body })
}

// Branch-free outcome helpers -- each test picks the one matching its expectation.
async function assertCreated(session, body) {
    const response = await submitGroup(session, body)
    assert.equal(response.status, 201, `Expected 201 Created but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.ok(response.content?.entity?.id, 'Created group is missing an entity id.')
    assert.equal(response.content?.entity?.type, body.type)
    assert.equal(response.content?.entity?.postPermissions, body.postPermissions)
    return response.content.entity
}

async function assertForbidden(session, body) {
    const response = await submitGroup(session, body)
    assert.equal(response.status, 403, `Expected 403 not-authorized but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.equal(response.content?.error?.type, 'not-authorized')
}

async function assertInvalid(session, body) {
    const response = await submitGroup(session, body)
    assert.equal(response.status, 400, `Expected 400 invalid but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.equal(response.content?.error?.type, 'invalid')
}

async function assertConflict(session, body) {
    const response = await submitGroup(session, body)
    assert.equal(response.status, 400, `Expected 400 conflict but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.equal(response.content?.error?.type, 'conflict')
}

async function assertUnauthenticated(session, body) {
    const response = await submitGroup(session, body)
    assert.equal(response.status, 401)
    assert.equal(response.content?.error?.type, 'not-authenticated')
}

// A valid, unique top-level group submission.  Fields overridden to `undefined`
// are dropped by JSON serialization, which is how the "missing field" cases omit
// a field.  The unique slug keeps repeated/parallel runs from colliding.
function groupSubmission(overrides = {}) {
    const unique = crypto.randomUUID()
    return {
        type: 'open',
        postPermissions: 'anyone',
        title: `Test Group ${unique}`,
        slug: `test-group-${unique}`,
        about: 'A group created by the POST /groups integration test suite.',
        ...overrides
    }
}

describe('POST /groups', function() {

    before(async function() {
        subgroupsEnabled = await isFeatureEnabled(SUBGROUPS_FEATURE)
    })

    describe("authentication", function() {
        it(`Should reject an unauthenticated request`, async function() {
            const session = await initialize()
            await assertUnauthenticated(session, groupSubmission())
        })
    })

    describe("permission model", function() {

        describe("top-level groups", function() {
            // Any confirmed, authenticated user may create a top-level group of
            // any visibility.  (A banned or unconfirmed user is rejected at
            // authentication and can never obtain a session, so the
            // PermissionService banned/unconfirmed guards are not reachable
            // through this endpoint -- there is no test for them here.)

            it(`Should let any authenticated user create an Open group`, async function() {
                const owner = await loginAs('user1')
                let group = null
                try {
                    group = await assertCreated(owner.session, groupSubmission({ type: 'open', postPermissions: 'anyone' }))
                    assert.equal(group.type, 'open')
                } finally {
                    if ( group ) await deleteGroup(owner.session, group.id)
                    await logout(owner.session)
                }
            })

            it(`Should let any authenticated user create a Private group`, async function() {
                const owner = await loginAs('user1')
                let group = null
                try {
                    group = await assertCreated(owner.session, groupSubmission({ type: 'private', postPermissions: 'members' }))
                    assert.equal(group.type, 'private')
                } finally {
                    if ( group ) await deleteGroup(owner.session, group.id)
                    await logout(owner.session)
                }
            })

            it(`Should let any authenticated user create a Hidden group`, async function() {
                const owner = await loginAs('user1')
                let group = null
                try {
                    group = await assertCreated(owner.session, groupSubmission({ type: 'hidden', postPermissions: 'members' }))
                    assert.equal(group.type, 'hidden')
                } finally {
                    if ( group ) await deleteGroup(owner.session, group.id)
                    await logout(owner.session)
                }
            })

            it(`Should make the creator an admin member of the new group`, async function() {
                const owner = await loginAs('user1')
                let group = null
                try {
                    group = await assertCreated(owner.session, groupSubmission())

                    const member = await fetchEndpoint('GET', `/group/${encodeURIComponent(group.id)}/member/${encodeURIComponent(owner.user.id)}`, { session: owner.session })
                    assert.equal(member.status, 200, `Expected to find the creator's membership: ${JSON.stringify(member.content)}`)
                    assert.equal(member.content?.entity?.userId, owner.user.id)
                    assert.equal(member.content?.entity?.status, 'member')
                    assert.equal(member.content?.entity?.role, 'admin')
                } finally {
                    if ( group ) await deleteGroup(owner.session, group.id)
                    await logout(owner.session)
                }
            })
        })

        describe("subgroups -- creation is limited to admins of the parent", function() {
            let owner, secondAdmin, moderator, member, nonMember
            let parent = null

            before(async function() {
                if ( ! subgroupsEnabled ) return
                owner = await loginAs('user1')          // creator/admin of the parent
                secondAdmin = await loginAs('user4')    // promoted to a second parent admin
                moderator = await loginAs('user2')      // parent moderator
                member = await loginAs('user3')         // parent member
                nonMember = await loginAs('user7')      // member of nothing

                parent = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })

                await joinOpenGroup(secondAdmin.session, parent.id, secondAdmin.user.id)
                await setGroupMemberRole(owner.session, parent.id, secondAdmin.user.id, 'admin')
                await joinOpenGroup(moderator.session, parent.id, moderator.user.id)
                await setGroupMemberRole(owner.session, parent.id, moderator.user.id, 'moderator')
                await joinOpenGroup(member.session, parent.id, member.user.id)
            })

            after(async function() {
                if ( ! subgroupsEnabled ) return
                if ( parent ) await deleteGroup(owner.session, parent.id)
                await logout(owner.session)
                await logout(secondAdmin.session)
                await logout(moderator.session)
                await logout(member.session)
                await logout(nonMember.session)
            })

            it(`Should let the parent's creating admin create a subgroup`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                let child = null
                try {
                    child = await assertCreated(owner.session, groupSubmission({ parentId: parent.id, type: 'private', postPermissions: 'members' }))
                    assert.equal(child.parentId, parent.id)
                } finally {
                    if ( child ) await deleteGroup(owner.session, child.id)
                }
            })

            it(`Should let a second parent admin create a subgroup`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                let child = null
                try {
                    child = await assertCreated(secondAdmin.session, groupSubmission({ parentId: parent.id, type: 'private', postPermissions: 'members' }))
                    assert.equal(child.parentId, parent.id)
                } finally {
                    // The parent's creating admin can always tear down the subgroup.
                    if ( child ) await deleteGroup(owner.session, child.id)
                }
            })

            it(`Should NOT let a parent moderator create a subgroup`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertForbidden(moderator.session, groupSubmission({ parentId: parent.id, type: 'private', postPermissions: 'members' }))
            })

            it(`Should NOT let a parent member create a subgroup`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertForbidden(member.session, groupSubmission({ parentId: parent.id, type: 'private', postPermissions: 'members' }))
            })

            it(`Should NOT let a non-member of the parent create a subgroup`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertForbidden(nonMember.session, groupSubmission({ parentId: parent.id, type: 'private', postPermissions: 'members' }))
            })
        })

        describe("subgroups -- an admin can create every subgroup type", function() {
            // Mirrors documentation/testing/test-cases/Group/regression/create.md:
            // an admin of the parent can create each child type under each parent
            // type.  The stored child `type` per (parent, choice):
            //   PUBLIC:  open->'open'          private->'private'        hidden->'hidden'
            //   PRIVATE: open->'private-open'  private->'private'        hidden->'hidden'
            //   HIDDEN:  open->'hidden-open'   private->'hidden-private' hidden->'hidden'

            describe("under a PUBLIC parent", function() {
                let owner
                let parent = null

                before(async function() {
                    if ( ! subgroupsEnabled ) return
                    owner = await loginAs('user1')
                    parent = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                })

                after(async function() {
                    if ( ! subgroupsEnabled ) return
                    if ( parent ) await deleteGroup(owner.session, parent.id)
                    await logout(owner.session)
                })

                it(`Should create an OPEN subgroup ('open')`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    let child = null
                    try {
                        child = await assertCreated(owner.session, groupSubmission({ parentId: parent.id, type: 'open', postPermissions: 'anyone' }))
                        assert.equal(child.type, 'open')
                        assert.equal(child.parentId, parent.id)
                    } finally {
                        if ( child ) await deleteGroup(owner.session, child.id)
                    }
                })

                it(`Should create a PRIVATE subgroup ('private')`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    let child = null
                    try {
                        child = await assertCreated(owner.session, groupSubmission({ parentId: parent.id, type: 'private', postPermissions: 'members' }))
                        assert.equal(child.type, 'private')
                        assert.equal(child.parentId, parent.id)
                    } finally {
                        if ( child ) await deleteGroup(owner.session, child.id)
                    }
                })

                it(`Should create a HIDDEN subgroup ('hidden')`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    let child = null
                    try {
                        child = await assertCreated(owner.session, groupSubmission({ parentId: parent.id, type: 'hidden', postPermissions: 'members' }))
                        assert.equal(child.type, 'hidden')
                        assert.equal(child.parentId, parent.id)
                    } finally {
                        if ( child ) await deleteGroup(owner.session, child.id)
                    }
                })
            })

            describe("under a PRIVATE parent", function() {
                let owner
                let parent = null

                before(async function() {
                    if ( ! subgroupsEnabled ) return
                    owner = await loginAs('user1')
                    parent = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })
                })

                after(async function() {
                    if ( ! subgroupsEnabled ) return
                    if ( parent ) await deleteGroup(owner.session, parent.id)
                    await logout(owner.session)
                })

                it(`Should create an OPEN subgroup ('private-open')`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    let child = null
                    try {
                        child = await assertCreated(owner.session, groupSubmission({ parentId: parent.id, type: 'private-open', postPermissions: 'members' }))
                        assert.equal(child.type, 'private-open')
                        assert.equal(child.parentId, parent.id)
                    } finally {
                        if ( child ) await deleteGroup(owner.session, child.id)
                    }
                })

                it(`Should create a PRIVATE subgroup ('private')`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    let child = null
                    try {
                        child = await assertCreated(owner.session, groupSubmission({ parentId: parent.id, type: 'private', postPermissions: 'members' }))
                        assert.equal(child.type, 'private')
                        assert.equal(child.parentId, parent.id)
                    } finally {
                        if ( child ) await deleteGroup(owner.session, child.id)
                    }
                })

                it(`Should create a HIDDEN subgroup ('hidden')`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    let child = null
                    try {
                        child = await assertCreated(owner.session, groupSubmission({ parentId: parent.id, type: 'hidden', postPermissions: 'members' }))
                        assert.equal(child.type, 'hidden')
                        assert.equal(child.parentId, parent.id)
                    } finally {
                        if ( child ) await deleteGroup(owner.session, child.id)
                    }
                })
            })

            describe("under a HIDDEN parent", function() {
                let owner
                let parent = null

                before(async function() {
                    if ( ! subgroupsEnabled ) return
                    owner = await loginAs('user1')
                    parent = await createGroup(owner.session, { type: 'hidden', postPermissions: 'members' })
                })

                after(async function() {
                    if ( ! subgroupsEnabled ) return
                    if ( parent ) await deleteGroup(owner.session, parent.id)
                    await logout(owner.session)
                })

                it(`Should create an OPEN subgroup ('hidden-open')`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    let child = null
                    try {
                        child = await assertCreated(owner.session, groupSubmission({ parentId: parent.id, type: 'hidden-open', postPermissions: 'members' }))
                        assert.equal(child.type, 'hidden-open')
                        assert.equal(child.parentId, parent.id)
                    } finally {
                        if ( child ) await deleteGroup(owner.session, child.id)
                    }
                })

                it(`Should create a PRIVATE subgroup ('hidden-private')`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    let child = null
                    try {
                        child = await assertCreated(owner.session, groupSubmission({ parentId: parent.id, type: 'hidden-private', postPermissions: 'members' }))
                        assert.equal(child.type, 'hidden-private')
                        assert.equal(child.parentId, parent.id)
                    } finally {
                        if ( child ) await deleteGroup(owner.session, child.id)
                    }
                })

                it(`Should create a HIDDEN subgroup ('hidden')`, async function(t) {
                    if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                    let child = null
                    try {
                        child = await assertCreated(owner.session, groupSubmission({ parentId: parent.id, type: 'hidden', postPermissions: 'members' }))
                        assert.equal(child.type, 'hidden')
                        assert.equal(child.parentId, parent.id)
                    } finally {
                        if ( child ) await deleteGroup(owner.session, child.id)
                    }
                })
            })
        })
    })

    describe("validation model", function() {
        // All validation cases below are TOP-LEVEL submissions so that the
        // permission gate (which passes for any confirmed user) is never the
        // thing being tested -- validation is.  Each submission is otherwise
        // valid with a unique slug, with exactly one field made invalid.

        let owner

        before(async function() {
            owner = await loginAs('user1')
        })

        after(async function() {
            await logout(owner.session)
        })

        describe("type", function() {
            it(`Should reject a group with no type`, async function() {
                await assertInvalid(owner.session, groupSubmission({ type: undefined }))
            })
            it(`Should reject a group with a null type`, async function() {
                await assertInvalid(owner.session, groupSubmission({ type: null }))
            })
            it(`Should reject a group with an invalid type value`, async function() {
                await assertInvalid(owner.session, groupSubmission({ type: 'public' }))
            })
            it(`Should reject a group with a non-string type`, async function() {
                await assertInvalid(owner.session, groupSubmission({ type: 12345 }))
            })
        })

        describe("postPermissions", function() {
            it(`Should reject a group with no postPermissions`, async function() {
                await assertInvalid(owner.session, groupSubmission({ postPermissions: undefined }))
            })
            it(`Should reject a group with a null postPermissions`, async function() {
                await assertInvalid(owner.session, groupSubmission({ postPermissions: null }))
            })
            it(`Should reject a group with an invalid postPermissions value`, async function() {
                await assertInvalid(owner.session, groupSubmission({ postPermissions: 'everyone' }))
            })
            it(`Should accept postPermissions 'members'`, async function() {
                let group = null
                try {
                    group = await assertCreated(owner.session, groupSubmission({ postPermissions: 'members' }))
                } finally {
                    if ( group ) await deleteGroup(owner.session, group.id)
                }
            })
            it(`Should accept postPermissions 'approval'`, async function() {
                let group = null
                try {
                    group = await assertCreated(owner.session, groupSubmission({ postPermissions: 'approval' }))
                } finally {
                    if ( group ) await deleteGroup(owner.session, group.id)
                }
            })
            it(`Should accept postPermissions 'restricted'`, async function() {
                let group = null
                try {
                    group = await assertCreated(owner.session, groupSubmission({ postPermissions: 'restricted' }))
                } finally {
                    if ( group ) await deleteGroup(owner.session, group.id)
                }
            })
        })

        describe("title", function() {
            it(`Should reject a group with no title`, async function() {
                await assertInvalid(owner.session, groupSubmission({ title: undefined }))
            })
            it(`Should reject a group with a null title`, async function() {
                await assertInvalid(owner.session, groupSubmission({ title: null }))
            })
            it(`Should reject a group with an empty title`, async function() {
                await assertInvalid(owner.session, groupSubmission({ title: '' }))
            })
            it(`Should reject a group whose title is too long`, async function() {
                await assertInvalid(owner.session, groupSubmission({ title: 'a'.repeat(512) }))
            })
            it(`Should reject a group with a non-string title`, async function() {
                await assertInvalid(owner.session, groupSubmission({ title: 12345 }))
            })
        })

        describe("slug", function() {
            it(`Should reject a group with an empty slug`, async function() {
                await assertInvalid(owner.session, groupSubmission({ slug: '' }))
            })
            it(`Should reject a group with an invalid slug (illegal characters)`, async function() {
                await assertInvalid(owner.session, groupSubmission({ slug: 'Invalid Slug!' }))
            })
            it(`Should reject a group with a slug that does not start with a letter`, async function() {
                await assertInvalid(owner.session, groupSubmission({ slug: '1-leading-digit' }))
            })
            it(`Should reject a group whose slug is too long`, async function() {
                await assertInvalid(owner.session, groupSubmission({ slug: 'a'.repeat(512) }))
            })
            it(`Should reject a group whose slug conflicts with an existing group`, async function() {
                let first = null
                try {
                    const submission = groupSubmission()
                    first = await assertCreated(owner.session, submission)
                    // A second group with the same slug must conflict.
                    await assertConflict(owner.session, groupSubmission({ slug: submission.slug }))
                } finally {
                    if ( first ) await deleteGroup(owner.session, first.id)
                }
            })

            it(`Should reject a group with no slug`, async function() {
                await assertInvalid(owner.session, groupSubmission({ slug: undefined }))
            })
            it(`Should reject a group with a null slug`, async function() {
                await assertInvalid(owner.session, groupSubmission({ slug: null }))
            })
            it(`Should reject a group with a non-string slug`, async function() {
                await assertInvalid(owner.session, groupSubmission({ slug: 12345 }))
            })
        })

        describe("about", function() {
            it(`Should accept a group with no about (about is optional)`, async function() {
                let group = null
                try {
                    group = await assertCreated(owner.session, groupSubmission({ about: undefined }))
                } finally {
                    if ( group ) await deleteGroup(owner.session, group.id)
                }
            })
            it(`Should reject a group with a null about`, async function() {
                await assertInvalid(owner.session, groupSubmission({ about: null }))
            })
            it(`Should reject a group whose about is too long`, async function() {
                await assertInvalid(owner.session, groupSubmission({ about: 'a'.repeat(10000) }))
            })
            it(`Should reject a group with a non-string about`, async function() {
                await assertInvalid(owner.session, groupSubmission({ about: 12345 }))
            })
        })

        describe("shortDescription / rules", function() {
            // These optional fields are validated by schema/Group.js on every
            // create regardless of the 'issue-330-...' persistence feature flag
            // (Schema.validate() iterates all properties), so their length/null
            // rules are exercisable here without the flag.
            it(`Should reject a group whose shortDescription is too long`, async function() {
                await assertInvalid(owner.session, groupSubmission({ shortDescription: 'a'.repeat(150) }))
            })
            it(`Should reject a group with a null shortDescription`, async function() {
                await assertInvalid(owner.session, groupSubmission({ shortDescription: null }))
            })
            it(`Should reject a group whose rules are too long`, async function() {
                await assertInvalid(owner.session, groupSubmission({ rules: 'a'.repeat(10000) }))
            })
            it(`Should reject a group with null rules`, async function() {
                await assertInvalid(owner.session, groupSubmission({ rules: null }))
            })
        })

        describe("id", function() {
            it(`Should reject a group with a null id`, async function() {
                await assertInvalid(owner.session, groupSubmission({ id: null }))
            })
            it(`Should reject a group with a non-UUID id`, async function() {
                await assertInvalid(owner.session, groupSubmission({ id: 'not-a-uuid' }))
            })
        })

        describe("parentId", function() {
            it(`Should treat a null parentId as a top-level group and create it`, async function() {
                let group = null
                try {
                    group = await assertCreated(owner.session, groupSubmission({ parentId: null }))
                } finally {
                    if ( group ) await deleteGroup(owner.session, group.id)
                }
            })
            it(`Should reject a group whose parentId references a non-existent group`, async function() {
                // A well-formed but unknown UUID: the permission check loads the
                // parent as null (so create is allowed), then validateGroup's
                // parentId-existence check produces parentId:not-found -> 400.
                await assertInvalid(owner.session, groupSubmission({ parentId: crypto.randomUUID() }))
            })

            // ---- SKIPPED: suspected bug --------------------------------------
            // The permission check (step 3) loads the parent via
            // groupDAO.getGroupById(parentId) BEFORE the schema validates that
            // parentId is a UUID (step 6).  A non-UUID parentId is passed
            // straight into a `WHERE groups.id = $1` against a uuid column, which
            // Postgres rejects ("invalid input syntax for type uuid"), surfacing
            // as 500 'server-error' instead of the clean 400 parentId:invalid the
            // schema would produce.  Asserts the intended 400; skipped until the
            // controller validates parentId's format before loading the parent.
            it(`Should reject a group with a non-UUID parentId`, async function() {
                await assertInvalid(owner.session, groupSubmission({ parentId: 'not-a-uuid' }))
            })
        })

        describe("fileId", function() {
            // File ownership / in-use validation needs a real uploaded file and
            // is out of scope for this pass (as media is in postPosts.spec.js).
            // The two paths that need no upload are covered here.
            it(`Should reject a group with a non-UUID fileId`, async function() {
                await assertInvalid(owner.session, groupSubmission({ fileId: 'not-a-uuid' }))
            })
            it(`Should reject a group whose fileId references a non-existent file`, async function() {
                await assertInvalid(owner.session, groupSubmission({ fileId: crypto.randomUUID() }))
            })
        })

        describe("fields that may not be set on create", function() {
            it(`Should reject a group that sets entranceQuestions`, async function() {
                await assertInvalid(owner.session, groupSubmission({ entranceQuestions: { question: 'why?' } }))
            })
            it(`Should reject a group that sets createdDate`, async function() {
                await assertInvalid(owner.session, groupSubmission({ createdDate: '2020-01-01T00:00:00.000Z' }))
            })
            it(`Should reject a group that sets updatedDate`, async function() {
                await assertInvalid(owner.session, groupSubmission({ updatedDate: '2020-01-01T00:00:00.000Z' }))
            })
        })

        describe("type / parent consistency", function() {
            // ---- SKIPPED: possible gap ---------------------------------------
            // schema/Group.js accepts the compound types ('private-open',
            // 'hidden-open','hidden-private') for ANY group, and postGroups()
            // does not check that a compound type is only used on a subgroup (nor
            // that a subgroup's type is consistent with its parent's).  So a
            // top-level group with a compound type is currently accepted (201).
            // This asserts the arguably-correct behavior (reject a compound type
            // with no parent); skipped because it is unclear whether the current
            // permissiveness is intended.
            it(`Should reject a top-level group that carries a compound (subgroup-only) type`, async function() {
                await assertInvalid(owner.session, groupSubmission({ type: 'private-open' }))
            })
        })
    })
})
