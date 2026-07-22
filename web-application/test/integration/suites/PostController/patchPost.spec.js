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
const { patchPost, createPost, createGroupPost, deleteAllPostsForUser } = require('../../lib/posts')
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
const { makeFriends, sendFriendRequest, blockUser, deleteRelationship } = require('../../lib/relationships')
const { isFeatureEnabled } = require('../../lib/system')

const SUBGROUPS_FEATURE = 'issue-165-subgroups'
let subgroupsEnabled = false

function patchBody(postId, fields = {}) {
    return { id: postId, ...fields }
}

async function assertUpdated(session, postId, body) {
    const response = await patchPost(session, postId, body)
    assert.equal(response.status, 201, `Expected 201 but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.equal(response.content?.entity?.id, postId)

    const entity = response.content?.entity
    if ( ! entity ) {
        assert.fail('Expected post entity, but received none.')
    }

    // Ensure that our updates stuck.
    for(const [key, value] of Object.entries(body)) {
        assert.equal(entity[key], value)
    }

    return response.content.entity
}

async function assertForbidden(session, postId, body) {
    const response = await patchPost(session, postId, body)
    assert.equal(response.status, 403, `Expected 403 not-authorized but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.equal(response.content?.error?.type, 'not-authorized')
}

async function assertNotFound(session, postId, body) {
    const response = await patchPost(session, postId, body)
    assert.equal(response.status, 404, `Expected 404 not-found but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.equal(response.content?.error?.type, 'not-found')
}

async function assertInvalid(session, postId, body) {
    const response = await patchPost(session, postId, body)
    assert.equal(response.status, 400, `Expected 400 invalid but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.equal(response.content?.error?.type, 'invalid')
}

async function assertUnauthenticated(session, postId, body) {
    const response = await patchPost(session, postId, body)
    assert.equal(response.status, 401)
    assert.equal(response.content?.error?.type, 'not-authenticated')
}

describe('PATCH /post/:id', function() {

    before(async function() {
        subgroupsEnabled = await isFeatureEnabled(SUBGROUPS_FEATURE)
    })

    describe("authentication and existence", function() {
        it(`Should reject an unauthenticated request`, async function() {
            const session = await initialize()
            const id = crypto.randomUUID()
            await assertUnauthenticated(session, id, patchBody(id, { content: 'Edited.' }))
        })

        it(`Should return 404 for a post that doesn't exist`, async function() {
            const owner = await loginAs('user1')
            try {
                const id = crypto.randomUUID()
                await assertNotFound(owner.session, id, patchBody(id, { content: 'Edited.' }))
            } finally {
                await logout(owner.session)
            }
        })
    })

    describe("permission model", function() {

        describe("for feed posts", function() {
            it(`Should let the author update their own PUBLIC feed post`, async function() {
                const owner = await loginAs('user1')
                const viewer = await loginAs('user2')
                try {
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)

                    const post = await createPost(owner.session, owner.user.id, { visibility: 'public' })

                    await assertUpdated(owner.session, post.id, patchBody(post.id, { content: 'Edited.' }))
                } finally {
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await logout(owner.session)
                    await logout(viewer.session)
                }
            })

            it(`Should let the author update their own PRIVATE feed post`, async function() {
                const owner = await loginAs('user1')
                const viewer = await loginAs('user2')
                try {
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)

                    const post = await createPost(owner.session, owner.user.id, { visibility: 'private' })

                    await assertUpdated(owner.session, post.id, patchBody(post.id, { content: 'Edited.' }))
                } finally {
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await logout(owner.session)
                    await logout(viewer.session)
                }
            })

            it(`Should NOT let a stranger update another user's PUBLIC feed post (can view, not author)`, async function() {
                const owner = await loginAs('user1')
                const viewer = await loginAs('user2')
                try {
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)

                    const post = await createPost(owner.session, owner.user.id, { visibility: 'public' })

                    await assertForbidden(viewer.session, post.id, patchBody(post.id, { content: 'Edited.' }))
                } finally {
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await logout(owner.session)
                    await logout(viewer.session)
                }
            })

            it(`Should NOT let a stranger update another user's PRIVATE feed post (cannot view it)`, async function() {
                const owner = await loginAs('user1')
                const viewer = await loginAs('user2')
                try {
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)

                    const post = await createPost(owner.session, owner.user.id, { visibility: 'private' })

                    await assertNotFound(viewer.session, post.id, patchBody(post.id, { content: 'Edited.' }))
                } finally {
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await logout(owner.session)
                    await logout(viewer.session)
                }
            })

            it(`Should NOT let a confirmed friend update another user's PRIVATE feed post (can view, not author)`, async function() {
                const owner = await loginAs('user1')
                const viewer = await loginAs('user2')
                try {
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)

                    const post = await createPost(owner.session, owner.user.id, { visibility: 'private' })
                    await makeFriends(owner.session, owner.user.id, viewer.session, viewer.user.id)

                    await assertForbidden(viewer.session, post.id, patchBody(post.id, { content: 'Edited.' }))
                } finally {
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await logout(owner.session)
                    await logout(viewer.session)
                }
            })

            it(`Should NOT let a blocked user update another user's PUBLIC feed post (cannot view it)`, async function() {
                const owner = await loginAs('user1')
                const viewer = await loginAs('user2')
                try {
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)

                    const post = await createPost(owner.session, owner.user.id, { visibility: 'public' })
                    await blockUser(owner.session, owner.user.id, viewer.user.id)

                    await assertNotFound(viewer.session, post.id, patchBody(post.id, { content: 'Edited.' }))
                } finally {
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await logout(owner.session)
                    await logout(viewer.session)
                }
            })

            it(`Should NOT let a site moderator update another user's PRIVATE feed post (can view, not author)`, async function() {
                const owner = await loginAs('user1')
                const viewer = await loginAs('user-site-moderator')
                try {
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)

                    const post = await createPost(owner.session, owner.user.id, { visibility: 'private' })

                    await assertForbidden(viewer.session, post.id, patchBody(post.id, { content: 'Edited.' }))
                } finally {
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await logout(owner.session)
                    await logout(viewer.session)
                }
            })

        })

        describe("for group posts", function() {
            let owner, admin2, member, nonMember, siteModerator
            let privateGroup = null
            let openGroup = null
            let privatePost = null
            let openPost = null

            before(async function() {
                owner = await loginAs('user1')             // author + group admin
                admin2 = await loginAs('user2')            // a second group admin (non-author)
                member = await loginAs('user3')            // group member (non-author)
                nonMember = await loginAs('user7')         // member of neither group
                siteModerator = await loginAs('user-site-moderator')

                privateGroup = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })
                await addConfirmedMember(owner.session, admin2.session, privateGroup.id, admin2.user.id)
                await setGroupMemberRole(owner.session, privateGroup.id, admin2.user.id, 'admin')
                await addConfirmedMember(owner.session, member.session, privateGroup.id, member.user.id)
                privatePost = await createGroupPost(owner.session, owner.user.id, privateGroup.id, 'private')

                openGroup = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                openPost = await createGroupPost(owner.session, owner.user.id, openGroup.id, 'open')
            })

            after(async function() {
                if ( privateGroup ) await deleteGroup(owner.session, privateGroup.id)
                if ( openGroup ) await deleteGroup(owner.session, openGroup.id)
                await logout(owner.session)
                await logout(admin2.session)
                await logout(member.session)
                await logout(nonMember.session)
                await logout(siteModerator.session)
            })

            it(`Should let the author update their own group post`, async function() {
                await assertUpdated(owner.session, privatePost.id, patchBody(privatePost.id, { content: 'Edited by author.' }))
            })

            it(`Should NOT let another group ADMIN update the author's post (can view, not author)`, async function() {
                await assertForbidden(admin2.session, privatePost.id, patchBody(privatePost.id, { content: 'Edited by admin.' }))
            })

            it(`Should NOT let a group MEMBER update another's post (can view, not author)`, async function() {
                await assertForbidden(member.session, privatePost.id, patchBody(privatePost.id, { content: 'Edited by member.' }))
            })

            it(`Should NOT let a non-member update a PRIVATE group post (cannot view it)`, async function() {
                await assertNotFound(nonMember.session, privatePost.id, patchBody(privatePost.id, { content: 'Edited by non-member.' }))
            })

            it(`Should NOT let a non-member update an OPEN group post (can view, not author)`, async function() {
                await assertForbidden(nonMember.session, openPost.id, patchBody(openPost.id, { content: 'Edited by non-member.' }))
            })

            it(`Should NOT let a site moderator update another user's group post (can view, not author)`, async function() {
                await assertForbidden(siteModerator.session, privatePost.id, patchBody(privatePost.id, { content: 'Edited by site mod.' }))
            })

            it(`Should NOT let the author update their own post once they've been banned (loses view)`, async function() {
                // A member authors a post, then is banned; losing view means losing the
                // ability to edit it -> 404 rather than 403.
                let bannedPost = null
                try {
                    bannedPost = await createGroupPost(member.session, member.user.id, privateGroup.id, 'private')
                    await setGroupMemberStatus(owner.session, privateGroup.id, member.user.id, 'banned')
                    await assertNotFound(member.session, bannedPost.id, patchBody(bannedPost.id, { content: 'Edit after ban.' }))
                } finally {
                    await setGroupMemberStatus(owner.session, privateGroup.id, member.user.id, 'member')
                }
            })
        })

        describe("for subgroup posts", function() {
            let owner, parentMember, nonMember
            let parent = null
            let child = null
            let post = null

            before(async function() {
                if ( ! subgroupsEnabled ) return
                owner = await loginAs('user1')
                parentMember = await loginAs('user6')      // parent member (can view a private-open child)
                nonMember = await loginAs('user7')
                parent = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })
                await addConfirmedMember(owner.session, parentMember.session, parent.id, parentMember.user.id)
                child = await createSubgroup(owner.session, parent.id, 'private-open', { postPermissions: 'anyone' })
                post = await createGroupPost(owner.session, owner.user.id, child.id, 'private')
            })

            after(async function() {
                if ( ! subgroupsEnabled ) return
                if ( child ) await deleteGroup(owner.session, child.id)
                if ( parent ) await deleteGroup(owner.session, parent.id)
                await logout(owner.session)
                await logout(parentMember.session)
                await logout(nonMember.session)
            })

            it(`Should let the author update their own subgroup post`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertUpdated(owner.session, post.id, patchBody(post.id, { content: 'Edited subgroup post.' }))
            })

            it(`Should NOT let a parent member who can VIEW the post update it (not author)`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertForbidden(parentMember.session, post.id, patchBody(post.id, { content: 'Edited by parent member.' }))
            })

            it(`Should NOT let a non-member who cannot view the post update it`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertNotFound(nonMember.session, post.id, patchBody(post.id, { content: 'Edited by non-member.' }))
            })
        })
    })

    describe("validation model", function() {

        describe("immutable and server-only fields", function() {
            let owner, other
            let post = null

            before(async function() {
                owner = await loginAs('user1')
                other = await loginAs('user2')
                await deleteAllPostsForUser(owner.session, owner.user.id)
                post = await createPost(owner.session, owner.user.id, { visibility: 'public' })
            })

            after(async function() {
                await deleteAllPostsForUser(owner.session, owner.user.id)
                await logout(owner.session)
                await logout(other.session)
            })

            it(`Should reject changing the userId`, async function() {
                await assertInvalid(owner.session, post.id, patchBody(post.id, { userId: other.user.id }))
            })

            it(`Should reject changing the type`, async function() {
                await assertInvalid(owner.session, post.id, patchBody(post.id, { type: 'group' }))
            })

            it(`Should reject setting a groupId on a feed post`, async function() {
                await assertInvalid(owner.session, post.id, patchBody(post.id, { groupId: crypto.randomUUID() }))
            })

            it(`Should reject changing the sharedPostId`, async function() {
                await assertInvalid(owner.session, post.id, patchBody(post.id, { sharedPostId: crypto.randomUUID() }))
            })

            it(`Should reject setting siteModerationId`, async function() {
                await assertInvalid(owner.session, post.id, patchBody(post.id, { siteModerationId: crypto.randomUUID() }))
            })

            it(`Should reject setting groupModerationId`, async function() {
                await assertInvalid(owner.session, post.id, patchBody(post.id, { groupModerationId: crypto.randomUUID() }))
            })

            it(`Should reject setting activity`, async function() {
                await assertInvalid(owner.session, post.id, patchBody(post.id, { activity: 5 }))
            })

            it(`Should reject setting createdDate`, async function() {
                await assertInvalid(owner.session, post.id, patchBody(post.id, { createdDate: new Date().toISOString() }))
            })

            it(`Should reject setting updatedDate`, async function() {
                await assertInvalid(owner.session, post.id, patchBody(post.id, { updatedDate: new Date().toISOString() }))
            })

        })

        describe("mutable field validation", function() {
            let owner
            let post = null

            before(async function() {
                owner = await loginAs('user1')
                await deleteAllPostsForUser(owner.session, owner.user.id)
                post = await createPost(owner.session, owner.user.id, { visibility: 'public' })
            })

            after(async function() {
                await deleteAllPostsForUser(owner.session, owner.user.id)
                await logout(owner.session)
            })

            it(`Should reject null content`, async function() {
                await assertInvalid(owner.session, post.id, patchBody(post.id, { content: null }))
            })

            it(`Should reject content that is too long`, async function() {
                await assertInvalid(owner.session, post.id, patchBody(post.id, { content: 'a'.repeat(10001) }))
            })

            it(`Should reject null visibility`, async function() {
                await assertInvalid(owner.session, post.id, patchBody(post.id, { visibility: null }))
            })

            it(`Should reject an invalid visibility`, async function() {
                await assertInvalid(owner.session, post.id, patchBody(post.id, { visibility: 'secret' }))
            })

        })

        describe("group post visibility consistency", function() {
            let owner
            let openGroup = null
            let privateGroup = null
            let openPost = null
            let privatePost = null

            before(async function() {
                owner = await loginAs('user1')
                openGroup = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
                openPost = await createGroupPost(owner.session, owner.user.id, openGroup.id, 'open')
                privateGroup = await createGroup(owner.session, { type: 'private', postPermissions: 'members' })
                privatePost = await createGroupPost(owner.session, owner.user.id, privateGroup.id, 'private')
            })

            after(async function() {
                if ( openGroup ) await deleteGroup(owner.session, openGroup.id)
                if ( privateGroup ) await deleteGroup(owner.session, privateGroup.id)
                await logout(owner.session)
            })

            it(`Should reject changing an OPEN-group post to private visibility`, async function() {
                await assertInvalid(owner.session, openPost.id, patchBody(openPost.id, { visibility: 'private' }))
            })

            it(`Should reject changing a PRIVATE-group post to public visibility`, async function() {
                await assertInvalid(owner.session, privatePost.id, patchBody(privatePost.id, { visibility: 'public' }))
            })
        })

        describe("valid updates", function() {
            let owner
            let group = null

            before(async function() {
                owner = await loginAs('user1')
                group = await createGroup(owner.session, { type: 'open', postPermissions: 'anyone' })
            })

            after(async function() {
                if ( group ) await deleteGroup(owner.session, group.id)
                await deleteAllPostsForUser(owner.session, owner.user.id)
                await logout(owner.session)
            })

            it(`Should update the content of the author's own feed post`, async function() {
                const post = await createPost(owner.session, owner.user.id, { visibility: 'public', content: 'Original.' })
                const entity = await assertUpdated(owner.session, post.id, patchBody(post.id, { content: 'Updated content.' }))
                assert.equal(entity.content, 'Updated content.')
            })

            it(`Should update the visibility of the author's own feed post`, async function() {
                const post = await createPost(owner.session, owner.user.id, { visibility: 'public' })
                const entity = await assertUpdated(owner.session, post.id, patchBody(post.id, { visibility: 'private' }))
                assert.equal(entity.visibility, 'private')
            })

            it(`Should update the content of the author's own group post`, async function() {
                const post = await createGroupPost(owner.session, owner.user.id, group.id, 'open')
                const entity = await assertUpdated(owner.session, post.id, patchBody(post.id, { content: 'Updated group content.' }))
                assert.equal(entity.content, 'Updated group content.')
            })
        })
    })
})
