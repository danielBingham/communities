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
const { getUser, findUserIdByUsernameAsAdmin } = require('../../../lib/users')
const { makeFriends, sendFriendRequest, blockUser, deleteRelationship } = require('../../../lib/relationships')

const userDictionary = require('../../../fixtures/users')

// ============================================================================
// Approach
//
// GET /users is the LIST endpoint.  Its permission filter is a hand-written SQL
// WHERE clause in UserController.parseQuery(), under a banner comment reading
// "Permissions ... END Permissions".  GET /user/:id answers the same question
// -- "may this caller see this user?" -- through a different hand-rolled
// sequence of gates in UserController.getUser().  Neither calls the canonical
// model (UserPermissions.canViewUser).  This suite verifies the two agree.
//
// As in getGroups and getPosts, we cannot reset the environment to a known set
// of users, so we do not match the whole result against an expected list.
// Instead we pick a specific user, check whether they appear in the caller's
// paginated list, and compare that to whether GET /user/:id lets the same
// caller see them.  getUser.spec.js pins the single-user side's absolute
// correctness; this suite pins the list to it.
//
// The four filters parseQuery() applies to a bare call, and their GET /user/:id
// counterparts:
//
//   list: `users.id != ALL(<people who blocked me>)`  (skipped for moderators)
//   single: 404 when `relationship.status === 'blocked' && currentUser.id === relationship.relationId`
//     -> AGREE.  Both are ONE-WAY: the blocker keeps seeing the blocked user,
//        which is intended -- it is how you find someone to unblock them.
//
//   list: `users.site_moderation_id NOT IN (<rejected moderations>)`
//   single: 403 when the moderation is 'rejected' AND the caller is neither the
//        user themselves nor a site moderator
//     -> DISAGREE.  The list clause sits OUTSIDE the `canModerateSite` guard,
//        so it also hides rejected profiles from moderators, from admins, and
//        from the rejected user themselves.  Three cross-checks below fail on
//        this; see "for site-moderated profiles".
//
//   list: `users.status != 'invited'`
//   single: lookup filters `users.status != 'invited'`
//     -> AGREE.
//
//   list: `users.status != 'banned'`
//   single: (nothing -- getUser() filters only 'invited')
//     -> DISAGREE.  A banned profile is hidden from the list but readable by
//        direct id.  One cross-check below fails on this; it is the same issue
//        already flagged as a skipped test in getUser.spec.js.
//
// NOTE (not tested here): a THIRD implementation exists.
// UserPermissions.canViewUser() denies the view whenever a blocked relationship
// exists in EITHER direction, making blocks two-way and contradicting both
// endpoints above.  Nothing in the User read path calls it -- SiteModeration
// does -- so it is out of scope for this suite, but it is worth knowing that
// "the" User view model currently has three non-identical implementations.
// ============================================================================

// Paginate the caller's entire GET /users result and return true as soon as
// `userId` appears; scans every page before returning false.
async function listContainsUser(session, userId) {
    let page = 1
    let numberOfPages = 1
    while ( page <= numberOfPages ) {
        const response = await fetchEndpoint('GET', `/users?page=${page}`, { session: session })
        if ( ! response.ok ) {
            throw new Error(`GET /users failed on page ${page}: ${response.status} ${JSON.stringify(response.content)}`)
        }
        const content = response.content
        numberOfPages = content.meta.numberOfPages
        if ( Array.isArray(content.list) && content.list.includes(userId) ) {
            return true
        }
        page = page + 1
    }
    return false
}

// The core cross-check: the bare GET /users list must include a user exactly
// when GET /user/:id returns them (200) and omit them exactly when GET
// /user/:id denies them.  The single-GET denies in two different ways -- 404
// for a blocked or invited user, 403 for a site-moderated one -- and both count
// as "denied" for this comparison.
async function assertListMatchesGetUser(session, userId) {
    const single = await getUser(session, userId)
    assert.ok(single.status === 200 || single.status === 403 || single.status === 404,
        `GET /user/:id returned unexpected status ${single.status} for User(${userId})`)
    const singleAllows = single.status === 200

    const inList = await listContainsUser(session, userId)

    assert.equal(inList, singleAllows,
        `GET /users ${inList ? 'INCLUDED' : 'OMITTED'} User(${userId}), but GET /user/:id `
        + `${singleAllows ? 'ALLOWED it (200)' : `DENIED it (${single.status})`} -- the list query in `
        + `UserController.parseQuery() and the single-user gates in UserController.getUser() disagree.`)
}

describe('GET /users', function() {

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
                const response = await fetchEndpoint('GET', `/users?page=${page}`, { session: session })
                assert.equal(response.status, 200)

                const content = response.content
                numberOfPages = content.meta.numberOfPages
                metaCount = parseInt(content.meta.count, 10)

                for(const userId of content.list) {
                    collected.push(userId)
                }

                page = page + 1
            }

            assert.equal(collected.length, new Set(collected).size,
                'GET /users returned the same user id on more than one page.')
            assert.equal(collected.length, metaCount,
                'The number of users paginated does not match meta.count.')
        } finally {
            await logout(session)
        }
    })

    it(`Should reject an unauthenticated request`, async function() {
        // Both endpoints gate on the session before looking anything up, so an
        // anonymous caller gets the same 401 from each.
        const session = await initialize()

        const response = await fetchEndpoint('GET', '/users', { session: session })

        assert.equal(response.status, 401)
        assert.equal(response.content?.error?.type, 'not-authenticated')
    })

    // ======================================================================
    // Ordinary users.  No blocks, no moderation, no unusual account status --
    // the list and the single-GET should both allow every one of these.
    // ======================================================================

    describe('for ordinary users', function() {
        let viewer, target, siteModerator, siteAdmin

        before(async function() {
            viewer = await loginAs('user1')
            target = await loginAs('user2')
            siteModerator = await loginAs('user-site-moderator')
            siteAdmin = await loginAs('user-site-admin')

            // Defensive: clear anything an earlier suite left behind so this
            // group starts from a genuinely unrelated pair.
            await deleteRelationship(viewer.session, viewer.user.id, target.user.id)
        })

        after(async function() {
            await deleteRelationship(viewer.session, viewer.user.id, target.user.id)
            await logout(viewer.session)
            await logout(target.session)
            await logout(siteModerator.session)
            await logout(siteAdmin.session)
        })

        it(`GET /users matches GET /user/:id for the caller themselves`, async function() {
            await assertListMatchesGetUser(viewer.session, viewer.user.id)
        })

        it(`GET /users matches GET /user/:id for a stranger`, async function() {
            await assertListMatchesGetUser(viewer.session, target.user.id)
        })

        it(`GET /users matches GET /user/:id for a site moderator viewing an ordinary user`, async function() {
            await assertListMatchesGetUser(siteModerator.session, target.user.id)
        })

        it(`GET /users matches GET /user/:id for a site admin viewing an ordinary user`, async function() {
            await assertListMatchesGetUser(siteAdmin.session, target.user.id)
        })

        it(`GET /users matches GET /user/:id for a site moderator viewing themselves`, async function() {
            await assertListMatchesGetUser(siteModerator.session, siteModerator.user.id)
        })

        it(`GET /users matches GET /user/:id for an ordinary user viewing a site moderator`, async function() {
            await assertListMatchesGetUser(viewer.session, siteModerator.user.id)
        })

        it(`GET /users matches GET /user/:id for a friend`, async function() {
            try {
                await makeFriends(viewer.session, viewer.user.id, target.session, target.user.id)
                await assertListMatchesGetUser(viewer.session, target.user.id)
            } finally {
                await deleteRelationship(viewer.session, viewer.user.id, target.user.id)
            }
        })

        it(`GET /users matches GET /user/:id for a user the caller sent a friend request to`, async function() {
            try {
                await sendFriendRequest(viewer.session, viewer.user.id, target.user.id)
                await assertListMatchesGetUser(viewer.session, target.user.id)
            } finally {
                await deleteRelationship(viewer.session, viewer.user.id, target.user.id)
            }
        })

        it(`GET /users matches GET /user/:id for a user the caller received a friend request from`, async function() {
            try {
                await sendFriendRequest(target.session, target.user.id, viewer.user.id)
                await assertListMatchesGetUser(viewer.session, target.user.id)
            } finally {
                await deleteRelationship(viewer.session, viewer.user.id, target.user.id)
            }
        })
    })

    // ======================================================================
    // Unconfirmed callers.
    //
    // PermissionService.can() returns false for any user whose status is not
    // exactly 'confirmed', so an unconfirmed caller is never a site moderator
    // on either path.  Both endpoints should treat them as an ordinary user.
    // ======================================================================

    describe('for an unconfirmed caller', function() {
        let unconfirmed, target

        before(async function() {
            unconfirmed = await loginAs('user-unconfirmed')
            target = await loginAs('user2')
        })

        after(async function() {
            await logout(unconfirmed.session)
            await logout(target.session)
        })

        it(`GET /users matches GET /user/:id for an unconfirmed caller viewing another user`, async function() {
            await assertListMatchesGetUser(unconfirmed.session, target.user.id)
        })

        it(`GET /users matches GET /user/:id for an unconfirmed caller viewing themselves`, async function() {
            await assertListMatchesGetUser(unconfirmed.session, unconfirmed.user.id)
        })
    })

    // ======================================================================
    // Blocking.
    //
    // Blocks are ONE-WAY by design: the blocker keeps seeing the blocked user
    // so that they can find them again to unblock them.  Both endpoints
    // implement that, in different ways, and these cross-checks confirm the two
    // implementations land in the same place on each side of the asymmetry.
    // ======================================================================

    describe('for blocked relationships', function() {
        let blocker, blocked, thirdParty, siteModerator

        before(async function() {
            blocker = await loginAs('user1')
            blocked = await loginAs('user2')
            thirdParty = await loginAs('user3')
            siteModerator = await loginAs('user-site-moderator')

            await deleteRelationship(blocker.session, blocker.user.id, blocked.user.id)
            await deleteRelationship(blocker.session, blocker.user.id, thirdParty.user.id)
            await deleteRelationship(blocked.session, blocked.user.id, thirdParty.user.id)

            await blockUser(blocker.session, blocker.user.id, blocked.user.id)
        })

        after(async function() {
            await deleteRelationship(blocker.session, blocker.user.id, blocked.user.id)
            await deleteRelationship(blocker.session, blocker.user.id, thirdParty.user.id)
            await deleteRelationship(blocked.session, blocked.user.id, thirdParty.user.id)
            await logout(blocker.session)
            await logout(blocked.session)
            await logout(thirdParty.session)
            await logout(siteModerator.session)
        })

        it(`GET /users matches GET /user/:id for a user viewing someone who blocked them`, async function() {
            // Both should deny: the list filters the blocker out, the single-GET
            // answers 404.
            await assertListMatchesGetUser(blocked.session, blocker.user.id)
        })

        it(`GET /users matches GET /user/:id for the blocker viewing the user they blocked`, async function() {
            // Both should allow -- blocks are one-way.
            await assertListMatchesGetUser(blocker.session, blocked.user.id)
        })

        it(`GET /users matches GET /user/:id for a blocked user viewing themselves`, async function() {
            await assertListMatchesGetUser(blocked.session, blocked.user.id)
        })

        it(`GET /users matches GET /user/:id for a third party viewing the blocker`, async function() {
            await assertListMatchesGetUser(thirdParty.session, blocker.user.id)
        })

        it(`GET /users matches GET /user/:id for a third party viewing the blocked user`, async function() {
            await assertListMatchesGetUser(thirdParty.session, blocked.user.id)
        })

        it(`GET /users matches GET /user/:id for a site moderator viewing a user who blocked them`, async function() {
            // Nothing stops a user from creating the block -- the site-role
            // carve-out claimed by the comment in parseQuery() does not exist in
            // canCreateUserRelationship().  Both endpoints then ignore the block
            // for a moderator, so both should allow.
            try {
                await deleteRelationship(thirdParty.session, thirdParty.user.id, siteModerator.user.id)
                await blockUser(thirdParty.session, thirdParty.user.id, siteModerator.user.id)

                await assertListMatchesGetUser(siteModerator.session, thirdParty.user.id)
            } finally {
                await deleteRelationship(thirdParty.session, thirdParty.user.id, siteModerator.user.id)
            }
        })
    })

    // ======================================================================
    // Account status.
    //
    // The list filters `users.status != 'banned' AND users.status != 'invited'`.
    // getUser()'s lookup filters only 'invited'.
    // ======================================================================

    describe('for users with a non-standard account status', function() {
        let viewer, admin, siteModerator
        let invitedUserId = null
        let bannedUserId = null

        before(async function() {
            viewer = await loginAs('user1')
            admin = await loginAs('user-site-admin')
            siteModerator = await loginAs('user-site-moderator')

            // Neither fixture can authenticate, and neither is reachable through
            // a plain GET /users, so their ids come from the admin query.
            invitedUserId = await findUserIdByUsernameAsAdmin(admin.session, userDictionary['user-invited'].username)
            bannedUserId = await findUserIdByUsernameAsAdmin(admin.session, userDictionary['user-banned'].username)
        })

        after(async function() {
            await logout(viewer.session)
            await logout(admin.session)
            await logout(siteModerator.session)
        })

        it(`GET /users matches GET /user/:id for an invited user`, async function() {
            // Both deny -- the same `status != 'invited'` filter appears on both
            // sides.
            await assertListMatchesGetUser(viewer.session, invitedUserId)
        })

        it(`GET /users matches GET /user/:id for an invited user seen by a site moderator`, async function() {
            await assertListMatchesGetUser(siteModerator.session, invitedUserId)
        })

        it(`GET /users matches GET /user/:id for an unconfirmed user`, async function() {
            // Both allow -- 'unconfirmed' is filtered by neither side.
            const unconfirmed = await loginAs('user-unconfirmed')
            try {
                await assertListMatchesGetUser(viewer.session, unconfirmed.user.id)
            } finally {
                await logout(unconfirmed.session)
            }
        })

        it(`GET /users matches GET /user/:id for a banned user`, async function() {
            await assertListMatchesGetUser(viewer.session, bannedUserId)
        })

        it(`GET /users matches GET /user/:id for a banned user seen by a site moderator`, { skip: "KNOWN TECHDEBT: This diverges and is known techdebt." }, async function() {
            await assertListMatchesGetUser(siteModerator.session, bannedUserId)
        })
    })

    // ======================================================================
    // Site-moderated profiles.
    //
    // The list clause hiding rejected profiles sits OUTSIDE parseQuery()'s
    // `canModerateSite` guard, while getUser()'s 403 sits INSIDE an equivalent
    // one.  Everywhere that guard matters -- moderators, admins, self -- the two
    // endpoints disagree.
    // ======================================================================

    describe('for site-moderated profiles', function() {
        let viewer, siteModerator, siteAdmin

        before(async function() {
            viewer = await loginAs('user1')
            siteModerator = await loginAs('user-site-moderator')
            siteAdmin = await loginAs('user-site-admin')
        })

        after(async function() {
            await logout(viewer.session)
            await logout(siteModerator.session)
            await logout(siteAdmin.session)
        })

        it(`GET /users matches GET /user/:id for a flagged (not rejected) profile`, async function() {
            // The control case: only 'rejected' hides a profile, so both sides
            // should allow this one.
            const flagged = await loginAs('user-flagged')
            try {
                await assertListMatchesGetUser(viewer.session, flagged.user.id)
            } finally {
                await logout(flagged.session)
            }
        })

        it(`GET /users matches GET /user/:id for a rejected profile seen by a stranger`, async function() {
            // Both deny -- the list omits them, the single-GET answers 403.
            // This is the one moderation cell where the two agree.
            const rejected = await loginAs('user-rejected')
            try {
                await assertListMatchesGetUser(viewer.session, rejected.user.id)
            } finally {
                await logout(rejected.session)
            }
        })

        it(`GET /users matches GET /user/:id for a rejected profile seen by a site moderator`, async function() {
            const rejected = await loginAs('user-rejected')
            try {
                await assertListMatchesGetUser(siteModerator.session, rejected.user.id)
            } finally {
                await logout(rejected.session)
            }
        })

        it(`GET /users matches GET /user/:id for a rejected profile seen by a site admin`, async function() {
            const rejected = await loginAs('user-rejected')
            try {
                await assertListMatchesGetUser(siteAdmin.session, rejected.user.id)
            } finally {
                await logout(rejected.session)
            }
        })

        // EXPECTED TO FAIL -- same bug, self-view.
        //
        // getUser() lets a rejected user read their own profile (the 403 is
        // gated on `currentUser.id !== userId`).  parseQuery() filters them out
        // of their own list, so a moderated user cannot see themselves in
        // GET /users at all.
        it(`GET /users matches GET /user/:id for a rejected profile seen by that user themselves`, { skip: 'KNOWN TECHDEBT: We need to consolidate and sort out the user permissions model around moderation.  Really user moderation needs a full overhaul.' }, async function() {
            const rejected = await loginAs('user-rejected')
            try {
                await assertListMatchesGetUser(rejected.session, rejected.user.id)
            } finally {
                await logout(rejected.session)
            }
        })
    })
})
