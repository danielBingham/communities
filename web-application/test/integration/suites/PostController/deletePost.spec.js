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
const { getPost, createPost, createGroupPost, deleteAllPostsForUser } = require('../../lib/posts')
const {
    createGroup,
    createSubgroup,
    deleteGroup,
    addConfirmedMember,
    setGroupMemberStatus,
    setGroupMemberRole
} = require('../../lib/groups')
const { makeFriends, blockUser, deleteRelationship } = require('../../lib/relationships')
const { isFeatureEnabled } = require('../../lib/system')

const SUBGROUPS_FEATURE = 'issue-165-subgroups'
let subgroupsEnabled = false

// Raw DELETE that returns the response without throwing, so callers can assert
// on the status.  (lib/posts.deletePost throws on non-2xx and is for cleanup.)
async function sendDelete(session, postId) {
    return await fetchEndpoint('DELETE', `/post/${encodeURIComponent(postId)}`, { session: session })
}

async function assertDeleted(session, postId) {
    const response = await sendDelete(session, postId)
    assert.equal(response.status, 201, `Expected 201 but got ${response.status}: ${JSON.stringify(response.content)}`)
}

// Deletes and then confirms the post is actually gone (the delete side effect).
async function assertDeletedAndGone(session, postId) {
    await assertDeleted(session, postId)
    const check = await getPost(session, postId)
    assert.equal(check.status, 404, `Post ${postId} was still retrievable after being deleted.`)
    assert.equal(check.content?.error?.type, 'not-found')
}

async function assertForbidden(session, postId) {
    const response = await sendDelete(session, postId)
    assert.equal(response.status, 403, `Expected 403 not-authorized but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.equal(response.content?.error?.type, 'not-authorized')
}

async function assertNotFound(session, postId) {
    const response = await sendDelete(session, postId)
    assert.equal(response.status, 404, `Expected 404 not-found but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.equal(response.content?.error?.type, 'not-found')
}

async function assertUnauthenticated(session, postId) {
    const response = await sendDelete(session, postId)
    assert.equal(response.status, 401)
    assert.equal(response.content?.error?.type, 'not-authenticated')
}

describe('DELETE /post/:id', function() {

    before(async function() {
        subgroupsEnabled = await isFeatureEnabled(SUBGROUPS_FEATURE)
    })

    describe("authentication and existence", function() {
        it(`Should reject an unauthenticated request`, async function() {
            const session = await initialize()
            await assertUnauthenticated(session, crypto.randomUUID())
        })

        it(`Should return 404 for a post that doesn't exist`, async function() {
            const owner = await loginAs('user1')
            try {
                await assertNotFound(owner.session, crypto.randomUUID())
            } finally {
                await logout(owner.session)
            }
        })
    })

    describe("permission model", function() {
        describe("for feed posts", function() {
            it(`Should let the author delete their own PUBLIC feed post`, async function() {
                const owner = await loginAs('user1')
                const viewer = await loginAs('user2')
                try {
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)

                    const post = await createPost(owner.session, owner.user.id, { visibility: 'public' })

                    await assertDeletedAndGone(owner.session, post.id)
                } finally {
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await logout(owner.session)
                    await logout(viewer.session)
                }
            })

            it(`Should let the author delete their own PRIVATE feed post`, async function() {
                const owner = await loginAs('user1')
                const viewer = await loginAs('user2')
                try {
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)

                    const post = await createPost(owner.session, owner.user.id, { visibility: 'private' })

                    await assertDeletedAndGone(owner.session, post.id)
                } finally {
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await logout(owner.session)
                    await logout(viewer.session)
                }
            })

            it(`Should NOT let a stranger delete another user's PUBLIC feed post (can view, not author)`, async function() {
                const owner = await loginAs('user1')
                const viewer = await loginAs('user2')
                try {
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)

                    const post = await createPost(owner.session, owner.user.id, { visibility: 'public' })

                    await assertForbidden(viewer.session, post.id)
                } finally {
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await logout(owner.session)
                    await logout(viewer.session)
                }
            })

            it(`Should NOT let a stranger delete another user's PRIVATE feed post (cannot view it)`, async function() {
                const owner = await loginAs('user1')
                const viewer = await loginAs('user2')
                try {
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)

                    const post = await createPost(owner.session, owner.user.id, { visibility: 'private' })

                    await assertNotFound(viewer.session, post.id)
                } finally {
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await logout(owner.session)
                    await logout(viewer.session)
                }
            })

            it(`Should NOT let a confirmed friend delete another user's PRIVATE feed post (can view, not author)`, async function() {
                const owner = await loginAs('user1')
                const viewer = await loginAs('user2')
                try {
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)

                    const post = await createPost(owner.session, owner.user.id, { visibility: 'private' })
                    await makeFriends(owner.session, owner.user.id, viewer.session, viewer.user.id)

                    await assertForbidden(viewer.session, post.id)
                } finally {
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await logout(owner.session)
                    await logout(viewer.session)
                }
            })

            it(`Should NOT let a blocked user delete another user's PUBLIC feed post (cannot view it)`, async function() {
                const owner = await loginAs('user1')
                const viewer = await loginAs('user2')
                try {
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)

                    const post = await createPost(owner.session, owner.user.id, { visibility: 'public' })
                    await blockUser(owner.session, owner.user.id, viewer.user.id)

                    await assertNotFound(viewer.session, post.id)
                } finally {
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await logout(owner.session)
                    await logout(viewer.session)
                }
            })

            it(`Should NOT let a site moderator delete another user's PRIVATE feed post (can view, not author)`, async function() {
                const owner = await loginAs('user1')
                const viewer = await loginAs('user-site-moderator')
                try {
                    await deleteAllPostsForUser(owner.session, owner.user.id)
                    await deleteRelationship(owner.session, owner.user.id, viewer.user.id)

                    const post = await createPost(owner.session, owner.user.id, { visibility: 'private' })

                    await assertForbidden(viewer.session, post.id)
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

            it(`Should let the author delete their own group post`, async function() {
                // Use a dedicated post so the shared privatePost survives for the
                // permission-denied cases below.
                const post = await createGroupPost(owner.session, owner.user.id, privateGroup.id, 'private')
                await assertDeletedAndGone(owner.session, post.id)
            })

            it(`Should NOT let another group ADMIN delete the author's post (can view, not author)`, async function() {
                await assertForbidden(admin2.session, privatePost.id)
            })

            it(`Should NOT let a group MEMBER delete another's post (can view, not author)`, async function() {
                await assertForbidden(member.session, privatePost.id)
            })

            it(`Should NOT let a non-member delete a PRIVATE group post (cannot view it)`, async function() {
                await assertNotFound(nonMember.session, privatePost.id)
            })

            it(`Should NOT let a non-member delete an OPEN group post (can view, not author)`, async function() {
                await assertForbidden(nonMember.session, openPost.id)
            })

            it(`Should NOT let a site moderator delete another user's group post (can view, not author)`, async function() {
                await assertForbidden(siteModerator.session, privatePost.id)
            })

            it(`Should NOT let the author delete their own post once they've been banned (loses view)`, async function() {
                let bannedPost = null
                try {
                    bannedPost = await createGroupPost(member.session, member.user.id, privateGroup.id, 'private')
                    await setGroupMemberStatus(owner.session, privateGroup.id, member.user.id, 'banned')
                    await assertNotFound(member.session, bannedPost.id)
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

            it(`Should NOT let a parent member who can VIEW the post delete it (not author)`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertForbidden(parentMember.session, post.id)
            })

            it(`Should NOT let a non-member who cannot view the post delete it`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                await assertNotFound(nonMember.session, post.id)
            })

            it(`Should let the author delete their own subgroup post`, async function(t) {
                if ( ! subgroupsEnabled ) { t.skip(`${SUBGROUPS_FEATURE} feature is not enabled`); return }
                // Deleted last so the shared post survives the cases above.
                await assertDeletedAndGone(owner.session, post.id)
            })
        })
    })

    describe("delete side effect", function() {
        it(`Should return 404 when deleting a post that was already deleted`, async function() {
            const owner = await loginAs('user1')
            try {
                await deleteAllPostsForUser(owner.session, owner.user.id)
                const post = await createPost(owner.session, owner.user.id, { visibility: 'public' })
                await assertDeleted(owner.session, post.id)
                await assertNotFound(owner.session, post.id)
            } finally {
                await deleteAllPostsForUser(owner.session, owner.user.id)
                await logout(owner.session)
            }
        })
    })
})
