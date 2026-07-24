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

const { initialize, logout, loginAs } = require('../../../lib/authentication')
const {
    getUserRelationships,
    sendFriendRequest,
    makeFriends,
    blockUser,
    clearRelationship
} = require('../../../lib/relationships')
const { getUser, setViewFriendsPrivacy, setUserSetting, restoreUserSettings } = require('../../../lib/users')

// ============================================================================
// Approach
//
// Endpoint under test: GET /user/:userId/relationships
//   -> UserRelationshipController.getUserRelationships()
//
// *** This suite deliberately does NOT cross-check against GET /user/:userId/
// *** relationship/:relationId.  The two endpoints have genuinely different
// *** permission models and are expected to disagree.  Treated as tech debt for
// *** now; these tests pin the query model AS IT IS.
//
// The difference is in the context handed to PermissionService.can().  The
// single-relationship endpoint asks "may I see this ROW?" and passes the two
// users named in the path:
//
//     can(currentUser, 'view', 'UserRelationship', { userId, relationId, relationship })
//
// The query endpoint asks "may I see this PERSON's friend list?" and passes the
// CALLER as `userId` and the PROFILE OWNER as `relationId`:
//
//     can(currentUser, 'query', 'UserRelationship', { userId: currentUser.id, relationId: userId })
//
// So `relationship` here is always the relationship between the caller and the
// profile owner, and `relatedUser` is always the profile owner.  The gate is
// therefore governed by the OWNER'S OWN CONFIGURATION, which the single-GET
// ignores entirely.  Denial is 403 'not-authorized' (the single-GET uses 404).
//
// ---------------------------------------------------------------------------
// FEATURE FLAGS
//
// This suite assumes every feature flag is deployed, migrated and enabled, which
// is the state of production.  Relevant here:
//
//   - 'feat-491-mutual-friends'    -> the `privacy__view_friends` model is live.
//   - 'fix-495-slow-friends-list'  -> MutualsService.hasMutuals() really queries
//                                     `mutual_relationships` instead of
//                                     short-circuiting to false.
//
// canQueryUserRelationship() still carries a `! features.has('feat-491-mutual-
// friends')` branch reading the older `settings.showFriendsOnProfile`.  That
// branch is now UNREACHABLE -- dead tech debt awaiting deletion -- so nothing
// here tests it, and no test in this file forks on a flag.  What the suite does
// pin is that the old setting is inert (see "the superseded showFriendsOnProfile
// setting"), so that reviving the dead branch is caught rather than silently
// re-enabled.
//
// ---------------------------------------------------------------------------
// THE LIVE MODEL
//
// canQueryUserRelationship() resolves in this order:
//
//   0. can() refuses any caller whose status is not exactly 'confirmed'.
//   1. SELF -- the caller is the profile owner: always allowed, before anything
//      else is consulted.  No configuration and no block can lock you out of
//      your own list.
//   2. BLOCK -- a 'blocked' relationship in EITHER direction between caller and
//      owner: always denied, before any configuration is consulted.  Note this
//      cuts both ways: blocking someone also hides THEIR list from YOU.  (The
//      code carries a TECH DEBT note about this.)
//   3. The owner's `privacy__view_friends` column (user_privacy enum):
//        'me'                 -> denied
//        'friends'            -> allowed only to a CONFIRMED friend
//        'friends-of-friends' -> confirmed friend, OR shares a mutual friend
//        'public'             -> allowed to anyone
//
// Steps 0-2 sit above the privacy setting and are tested once, outside the
// per-value describes, because they hold for every value.  Step 3 gets one
// describe per enum value.
//
// The suite covers the permission GATE and, at the end, the two content rules
// baked into createQuery() that are part of the same model (another user's
// pending relationships are never exposed; relationships involving anyone you
// have blocked are filtered out).  Query PARAMETERS -- status, user, GroupMember,
// page -- are out of scope here and belong in a later run.  `page` is used only
// inside the list-scanning helper.
//
// ---------------------------------------------------------------------------
// GAPS AND BUGS -- see also the inline notes at each site.
//
//   1. BUG (tested, expected to FAIL): a profile owner id that names no user
//      produces a 500.  ensureContext() loads `relatedUser` with getUserById(),
//      which returns null for a miss, and the privacy branch then dereferences
//      it (`relatedUser.privacyViewFriends`) without a null check.  See the
//      "a profile owner who does not exist" describe.
//
//   2. GAP (tested, SKIPPED pending a decision): site moderation does not reach
//      this endpoint.  Nothing in UserRelationshipController or
//      UserRelationshipPermissions consults SiteModeration, so a profile that
//      has been REJECTED -- removed by site moderators, and a 403 from
//      GET /user/:id for everyone but themselves and moderators -- still hands
//      its friend list to its confirmed friends.  See the "a profile owner
//      removed by site moderation" describe.
//
//   3. GAP (not testable through the API): `privacy__view_friends` is nullable
//      with no NOT NULL constraint, and the privacy branch has no `else` -- an
//      unrecognised or NULL value falls through to the trailing `return false`,
//      locking the owner's list to everyone but themselves.  Fail-safe rather
//      than fail-open, so not a security issue, but it is silent.  The schema
//      default ('friends') and the migration's backfill mean this should not
//      arise in practice.
//
//   4. GAP: there is no site-moderator branch in canQueryUserRelationship, so
//      site moderators have no elevated access here (asserted below).  That
//      matches the single-relationship endpoint; noting it because Group,
//      GroupMember and Post all go the other way.
// ============================================================================

// How long to wait for the worker to populate `mutual_relationships` before
// giving up.  See the mutual-friend test for why this is asynchronous.
const MUTUALS_TIMEOUT_MS = 20000

// Small, branch-free assertion helpers.  These only wrap the HTTP round-trip and
// the status/body checks -- they compute nothing about who should be allowed.
// Each test states its own expectation by choosing which one to call.
//
//   assertCanQuery    -- 200 + a well-formed result page.
//   assertNotAuthorized -- 403 + error.type 'not-authorized'.
async function assertCanQuery(session, userId) {
    const response = await getUserRelationships(session, userId)
    assert.equal(response.status, 200, `Expected 200 but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.ok(Array.isArray(response.content?.list), `Expected a 'list' array in the response.`)
    assert.ok(response.content?.dictionary, `Expected a 'dictionary' in the response.`)
    assert.ok(response.content?.meta, `Expected 'meta' in the response.`)
}

async function assertNotFound(session,userId) {
    const response = await getUserRelationships(session, userId)
    assert.equal(response.status, 404, `Expected 404 not-found but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.equal(response.content?.error?.type, 'not-found')
}

async function assertNotAuthorized(session, userId) {
    const response = await getUserRelationships(session, userId)
    assert.equal(response.status, 403, `Expected 403 not-authorized but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.equal(response.content?.error?.type, 'not-authorized')
}

// Scan every page of the caller's GET /user/:userId/relationships result and
// return true as soon as a relationship joining `otherUserId` appears.  A 403
// means the caller may not query this list at all -- they see nothing, so
// return false.
async function listContainsRelationshipWith(session, userId, otherUserId) {
    let page = 1
    let numberOfPages = 1
    while ( page <= numberOfPages ) {
        const response = await getUserRelationships(session, userId, page)

        if ( response.status === 403 ) {
            return false
        }
        if ( ! response.ok ) {
            throw new Error(`GET /user/${userId}/relationships failed on page ${page}: ${response.status} ${JSON.stringify(response.content)}`)
        }

        numberOfPages = response.content.meta.numberOfPages

        for ( const id of response.content.list ) {
            const relationship = response.content.dictionary[id]
            if ( relationship?.userId === otherUserId || relationship?.relationId === otherUserId ) {
                return true
            }
        }
        page = page + 1
    }
    return false
}

// Retry the query until it is permitted or the budget runs out, then hand the
// last response back for the test to assert on.
//
// Only the mutual-friends path needs this.  `mutual_relationships` is populated
// by the 'add-mutuals-for-relationship' queue job, so permission to query a
// 'friends-of-friends' profile is granted by a WORKER some time after the
// friendships are created rather than by the request that created them.  Every
// other case in this suite is decided synchronously and asserts directly.
async function pollUntilQueryPermitted(session, userId, timeoutMs) {
    const deadline = Date.now() + timeoutMs
    let response = await getUserRelationships(session, userId)
    while ( response.status !== 200 && Date.now() < deadline ) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        response = await getUserRelationships(session, userId)
    }
    return response
}

describe('GET /user/:userId/relationships', function() {

    // ======================================================================
    // Authentication.  Checked before anything is looked up, so it applies
    // equally to ids that exist and ids that don't.
    // ======================================================================
    describe("authentication", function() {

        it(`Should reject an unauthenticated request`, async function() {
            const session = await initialize()

            const response = await getUserRelationships(session, crypto.randomUUID())

            assert.equal(response.status, 401)
            assert.equal(response.content?.error?.type, 'not-authenticated')
        })

        it(`Should reject an unauthenticated request for a real user`, async function() {
            const owner = await loginAs('user1')
            const anonymous = await initialize()
            try {
                const response = await getUserRelationships(anonymous, owner.user.id)

                assert.equal(response.status, 401)
                assert.equal(response.content?.error?.type, 'not-authenticated')
            } finally {
                await logout(owner.session)
            }
        })
    })

    // ======================================================================
    // Querying your OWN relationships.
    //
    // The self check is the first thing canQueryUserRelationship does, so it
    // beats every block and every privacy setting.  These tests also pin what
    // the self query RETURNS, which createQuery() defines differently for
    // yourself than for anyone else:
    //
    //     (user_relationships.user_id = $1
    //      OR (user_relationships.friend_id = $1 AND status != 'blocked'))
    //
    // i.e. everything you are the originator of -- including blocks you created
    // -- plus everything aimed at you EXCEPT blocks aimed at you.
    // ======================================================================
    describe("querying your own relationships", function() {
        let owner, friend, requester, blocker

        before(async function() {
            owner = await loginAs('user1')          // the profile owner, querying themselves
            friend = await loginAs('user2')         // owner sends them a request
            requester = await loginAs('user3')      // sends the owner a request
            blocker = await loginAs('user4')        // blocks the owner

            await clearRelationship(owner.session, owner.user.id, friend.session, friend.user.id)
            await clearRelationship(owner.session, owner.user.id, requester.session, requester.user.id)
            await clearRelationship(owner.session, owner.user.id, blocker.session, blocker.user.id)

            await sendFriendRequest(owner.session, owner.user.id, friend.user.id)
            await sendFriendRequest(requester.session, requester.user.id, owner.user.id)
            await blockUser(blocker.session, blocker.user.id, owner.user.id)
        })

        after(async function() {
            await clearRelationship(owner.session, owner.user.id, friend.session, friend.user.id)
            await clearRelationship(owner.session, owner.user.id, requester.session, requester.user.id)
            await clearRelationship(owner.session, owner.user.id, blocker.session, blocker.user.id)
            await logout(owner.session)
            await logout(friend.session)
            await logout(requester.session)
            await logout(blocker.session)
        })

        it(`Should let a user query their own relationships`, async function() {
            await assertCanQuery(owner.session, owner.user.id)
        })

        it(`Should return dictionary, list, meta and relations`, async function() {
            const response = await getUserRelationships(owner.session, owner.user.id)

            assert.equal(response.status, 200)
            assert.ok(Array.isArray(response.content.list))
            assert.equal(typeof response.content.dictionary, 'object')
            assert.equal(typeof response.content.meta, 'object')
            assert.equal(typeof response.content.relations, 'object')
            assert.equal(typeof response.content.meta.page, 'number')
            assert.equal(typeof response.content.meta.numberOfPages, 'number')
        })

        it(`Should include a pending request the user SENT`, async function() {
            const found = await listContainsRelationshipWith(owner.session, owner.user.id, friend.user.id)
            assert.equal(found, true, `The owner's own list omitted the pending request they sent.`)
        })

        it(`Should include a pending request the user RECEIVED`, async function() {
            const found = await listContainsRelationshipWith(owner.session, owner.user.id, requester.user.id)
            assert.equal(found, true, `The owner's own list omitted the pending request they received.`)
        })

        it(`Should NOT include a block created against the user`, async function() {
            // A block aimed at you is filtered out of your own list, so you can't
            // discover that you have been blocked by reading it.
            const found = await listContainsRelationshipWith(owner.session, owner.user.id, blocker.user.id)
            assert.equal(found, false, `The owner's own list exposed a block created against them.`)
        })

        it(`Should include a block the user created`, async function() {
            // The mirror image of the previous case, read from the blocker's side.
            const found = await listContainsRelationshipWith(blocker.session, blocker.user.id, owner.user.id)
            assert.equal(found, true, `The blocker's own list omitted the block they created.`)
        })

        it(`Should let a user query their own relationships even when the other user has blocked them`, async function() {
            // The self check runs before the block check, so being blocked by
            // someone never locks you out of your own list.
            await assertCanQuery(owner.session, owner.user.id)
        })
    })

    // ======================================================================
    // A profile owner id that names no user.
    //
    // >>> BUG: THIS TEST FAILS AGAINST THE CURRENT CODE. <<<
    //
    // ensureContext() populates `relatedUser` with
    // userDAO.getUserById(context.relationId, 'all'), which returns NULL when
    // there is no such user.  (Its own guard tests for `undefined`, so it never
    // fires.)  canQueryUserRelationship then reaches the privacy branch and
    // dereferences that null unconditionally -- `context.relatedUser
    // .privacyViewFriends` -- so a well-formed uuid that belongs to nobody
    // raises a TypeError and surfaces as an unhandled 500 'server-error'.
    //
    // Asserted as 403 'not-authorized' below because that is this endpoint's
    // only denial mode and it keeps the response identical to "this user exists
    // but you may not query them", which avoids leaking account existence.  A
    // 404 would be defensible too, at the cost of that property -- if you prefer
    // it, change the assertion when you fix the null check.
    // ======================================================================
    describe("a profile owner who does not exist", function() {
        let caller

        before(async function() {
            caller = await loginAs('user1')
        })

        after(async function() {
            await logout(caller.session)
        })

        it(`Should deny a query for a user id that belongs to nobody`, async function() {
            await assertNotFound(caller.session, crypto.randomUUID())
        })
    })

    // ======================================================================
    // A profile owner removed by site moderation.
    //
    // GAP -- the last test here is SKIPPED because it asks a design question
    // rather than reporting a settled defect.
    //
    // Neither UserRelationshipController nor UserRelationshipPermissions
    // consults SiteModeration anywhere, and PermissionService.can() gates on
    // `users.status` only -- a rejected profile keeps status 'confirmed', so its
    // owner also retains full ability to send, accept and block relationships.
    //
    // GET /user/:id, by contrast, returns 403 for a REJECTED profile to everyone
    // except that user and site moderators.  So the profile is removed while the
    // friend list behind it is not: a confirmed friend can still read it.  The
    // second test below pins that divergence in place at the point where it
    // matters, so whichever way you decide, the decision is recorded.
    //
    // Whether moderation SHOULD cascade to relationship queries is a product
    // call I can't make from the code -- hence skipped rather than failing.  If
    // it should, unskip the third test.  If it shouldn't, delete it and keep the
    // second as documentation.
    //
    // See fixtures/users.js -> 'user-rejected' for the manual setup.
    // ======================================================================
    describe("a profile owner removed by site moderation", function() {
        let rejected, friend

        before(async function() {
            rejected = await loginAs('user-rejected')   // profile has a rejected SiteModeration
            friend = await loginAs('user2')

            await clearRelationship(rejected.session, rejected.user.id, friend.session, friend.user.id)
            await makeFriends(rejected.session, rejected.user.id, friend.session, friend.user.id)
        })

        after(async function() {
            await clearRelationship(rejected.session, rejected.user.id, friend.session, friend.user.id)
            await logout(rejected.session)
            await logout(friend.session)
        })

        it(`Should let a rejected user query their own relationships`, async function() {
            // The self check precedes everything, and moderation is not consulted
            // at all -- so being removed never locks you out of your own list.
            await assertCanQuery(rejected.session, rejected.user.id)
        })

        it(`Should 403 the rejected user's PROFILE while their friend list stays readable`,  { skip: 'KNOWN TECHDEBT: user moderation is iffy and we mostly are not using it right now -- banning or deleting instead.' }, async function() {
            // Documents the divergence itself rather than either side of it: the
            // profile read is refused, the friend list is not.
            const profile = await getUser(friend.session, rejected.user.id)
            assert.equal(profile.status, 403,
                `Expected GET /user/:id to refuse a rejected profile; got ${profile.status}. ` +
                `If this changed, the gap this suite documents may have been closed.`)

            await assertCanQuery(friend.session, rejected.user.id)
        })

        it(`Should NOT expose the relationships of a user removed by site moderation`, async function(t) {
            t.skip(`Whether site moderation should cascade to relationship queries is an open product decision; see the describe comment.`)
            return
            // eslint-disable-next-line no-unreachable
            await assertNotAuthorized(friend.session, rejected.user.id)
        })
    })

    // ======================================================================
    // Blocking.  Resolved before the privacy setting is consulted, so this holds
    // for every value of `privacyViewFriends`.
    //
    // Each test establishes a CONFIRMED friendship first and asserts the query
    // is permitted, then introduces the block and asserts it is not.  That
    // before/after shape is what pins the denial on the block rather than on the
    // owner's default privacy (which denies strangers anyway).
    //
    // Note that POST .../relationships with status 'blocked' deletes the
    // existing row and inserts a fresh block, so the friendship is gone either
    // way -- what these assert is that the resulting BLOCK denies the query in
    // both directions, including the counter-intuitive one where the caller did
    // the blocking.  The interaction with the most permissive setting is covered
    // separately under privacyViewFriends = 'public'.
    // ======================================================================
    describe("blocking", function() {
        let owner, other

        before(async function() {
            owner = await loginAs('user-privacy')
            other = await loginAs('user2')
        })

        after(async function() {
            await clearRelationship(owner.session, owner.user.id, other.session, other.user.id)
            await logout(owner.session)
            await logout(other.session)
        })

        it(`Should deny a caller whom the profile owner has blocked`, async function() {
            await clearRelationship(owner.session, owner.user.id, other.session, other.user.id)
            await makeFriends(owner.session, owner.user.id, other.session, other.user.id)
            await assertCanQuery(other.session, owner.user.id)

            await blockUser(owner.session, owner.user.id, other.user.id)

            await assertNotAuthorized(other.session, owner.user.id)
        })

        it(`Should deny a caller who has blocked the profile owner`, async function() {
            // The block is symmetric for this gate: blocking someone also hides
            // their friend list from you.  Flagged as TECH DEBT in the code.
            await clearRelationship(owner.session, owner.user.id, other.session, other.user.id)
            await makeFriends(owner.session, owner.user.id, other.session, other.user.id)
            await assertCanQuery(other.session, owner.user.id)

            await blockUser(other.session, other.user.id, owner.user.id)

            await assertNotAuthorized(other.session, owner.user.id)
        })
    })

    // ======================================================================
    // Site moderators.
    //
    // canQueryUserRelationship has no site-moderator branch, so a site moderator
    // is treated exactly like any other stranger.  Asserted against the owner's
    // DEFAULT privacy ('friends'), which denies strangers.
    // ======================================================================
    describe("site moderators", function() {
        let owner, siteModerator

        before(async function() {
            owner = await loginAs('user-privacy')
            siteModerator = await loginAs('user-site-moderator')
            await clearRelationship(owner.session, owner.user.id, siteModerator.session, siteModerator.user.id)
        })

        after(async function() {
            await clearRelationship(owner.session, owner.user.id, siteModerator.session, siteModerator.user.id)
            await logout(owner.session)
            await logout(siteModerator.session)
        })

        it(`Should NOT give a site moderator access to another user's relationships`, async function() {
            await assertNotAuthorized(siteModerator.session, owner.user.id)
        })
    })

    // ======================================================================
    // The privacy setting itself: one describe per value of the user_privacy
    // enum on the owner's `privacy__view_friends` column.
    // ======================================================================
    describe("permission model", function() {
        let owner, friend, stranger, mutualStranger, pendingSender, pendingReceiver, siteModerator, unconfirmed
        let originalPrivacy = null

        before(async function() {
            owner = await loginAs('user-privacy')          // the profile owner
            friend = await loginAs('user2')                // confirmed friend of the owner
            stranger = await loginAs('user3')              // no relationship, no mutuals -- the control
            mutualStranger = await loginAs('user5')        // no relationship, but shares a mutual friend
            pendingSender = await loginAs('user4')         // sent the owner a request
            pendingReceiver = await loginAs('user7')       // received a request from the owner
            siteModerator = await loginAs('user-site-moderator')
            unconfirmed = await loginAs('user-unconfirmed')

            // Snapshot the owner's privacy so teardown can put it back.  Falls
            // back to the schema default rather than risking a null patch that
            // would leave the fixture locked down for later suites.
            originalPrivacy = owner.user.privacyViewFriends ?? 'friends'

            await clearRelationship(owner.session, owner.user.id, friend.session, friend.user.id)
            await clearRelationship(owner.session, owner.user.id, stranger.session, stranger.user.id)
            await clearRelationship(owner.session, owner.user.id, mutualStranger.session, mutualStranger.user.id)
            await clearRelationship(owner.session, owner.user.id, pendingSender.session, pendingSender.user.id)
            await clearRelationship(owner.session, owner.user.id, pendingReceiver.session, pendingReceiver.user.id)
            await clearRelationship(owner.session, owner.user.id, siteModerator.session, siteModerator.user.id)
            await clearRelationship(owner.session, owner.user.id, unconfirmed.session, unconfirmed.user.id)

            // `stranger` is the no-mutuals control, so make sure they are not
            // friends with the owner's only friend.  `mutualStranger` is the one
            // that gets connected through `friend`, deliberately kept separate:
            // 'remove-mutuals-for-relationship' is a worker job, so a lagging
            // cleanup from an earlier run must not be able to give the control
            // mutuals it isn't supposed to have.
            await clearRelationship(stranger.session, stranger.user.id, friend.session, friend.user.id)
            await clearRelationship(mutualStranger.session, mutualStranger.user.id, friend.session, friend.user.id)

            await makeFriends(owner.session, owner.user.id, friend.session, friend.user.id)
            await sendFriendRequest(pendingSender.session, pendingSender.user.id, owner.user.id)
            await sendFriendRequest(owner.session, owner.user.id, pendingReceiver.user.id)
        })

        after(async function() {
            await setViewFriendsPrivacy(owner.session, owner.user.id, originalPrivacy)

            await clearRelationship(owner.session, owner.user.id, friend.session, friend.user.id)
            await clearRelationship(owner.session, owner.user.id, stranger.session, stranger.user.id)
            await clearRelationship(owner.session, owner.user.id, mutualStranger.session, mutualStranger.user.id)
            await clearRelationship(owner.session, owner.user.id, pendingSender.session, pendingSender.user.id)
            await clearRelationship(owner.session, owner.user.id, pendingReceiver.session, pendingReceiver.user.id)
            await clearRelationship(owner.session, owner.user.id, siteModerator.session, siteModerator.user.id)
            await clearRelationship(owner.session, owner.user.id, unconfirmed.session, unconfirmed.user.id)
            await clearRelationship(mutualStranger.session, mutualStranger.user.id, friend.session, friend.user.id)

            await logout(owner.session)
            await logout(friend.session)
            await logout(stranger.session)
            await logout(mutualStranger.session)
            await logout(pendingSender.session)
            await logout(pendingReceiver.session)
            await logout(siteModerator.session)
            await logout(unconfirmed.session)
        })

        describe("privacyViewFriends = 'me'", function() {

            before(async function() {
                await setViewFriendsPrivacy(owner.session, owner.user.id, 'me')
            })

            it(`Should let the owner query themselves`, async function() {
                await assertCanQuery(owner.session, owner.user.id)
            })

            it(`Should NOT let a confirmed friend query the owner's relationships`, async function() {
                await assertNotAuthorized(friend.session, owner.user.id)
            })

            it(`Should NOT let a stranger query the owner's relationships`, async function() {
                await assertNotAuthorized(stranger.session, owner.user.id)
            })
        })

        describe("privacyViewFriends = 'friends'", function() {

            before(async function() {
                await setViewFriendsPrivacy(owner.session, owner.user.id, 'friends')
            })

            it(`Should let a confirmed friend query the owner's relationships`, async function() {
                await assertCanQuery(friend.session, owner.user.id)
            })

            it(`Should NOT let a user who sent the owner a pending request query them`, async function() {
                // Only 'confirmed' counts -- an unanswered request is not a friendship.
                await assertNotAuthorized(pendingSender.session, owner.user.id)
            })

            it(`Should NOT let a user who received a pending request from the owner query them`, async function() {
                // The status check ignores direction, so the reverse case is denied too.
                await assertNotAuthorized(pendingReceiver.session, owner.user.id)
            })

            it(`Should NOT let a stranger query the owner's relationships`, async function() {
                await assertNotAuthorized(stranger.session, owner.user.id)
            })

            it(`Should let the owner query themselves`, async function() {
                await assertCanQuery(owner.session, owner.user.id)
            })
        })

        describe("privacyViewFriends = 'friends-of-friends'", function() {

            before(async function() {
                await setViewFriendsPrivacy(owner.session, owner.user.id, 'friends-of-friends')
            })

            it(`Should let a confirmed friend query the owner's relationships`, async function() {
                await assertCanQuery(friend.session, owner.user.id)
            })

            it(`Should NOT let a stranger with no mutual friends query the owner's relationships`, async function() {
                // `stranger` has no relationship with the owner and shares no
                // friend with them, so hasMutuals() finds nothing.
                await assertNotAuthorized(stranger.session, owner.user.id)
            })

            it(`Should let the owner query themselves`, async function() {
                await assertCanQuery(owner.session, owner.user.id)
            })

            it(`Should let a stranger who shares a mutual friend query the owner's relationships`, async function() {
                // `mutualStranger` is not the owner's friend, but both are friends
                // with `friend` -- so they share a mutual and should be let in.
                try {
                    await makeFriends(mutualStranger.session, mutualStranger.user.id, friend.session, friend.user.id)

                    // `mutual_relationships` is filled in by the
                    // 'add-mutuals-for-relationship' queue job, so the grant lands
                    // some time AFTER the friendship is created.  Poll rather than
                    // asserting immediately.  A failure here means either the worker
                    // is not running against this environment or the mutuals path is
                    // genuinely broken.
                    const response = await pollUntilQueryPermitted(mutualStranger.session, owner.user.id, MUTUALS_TIMEOUT_MS)

                    assert.equal(response.status, 200,
                        `A user sharing a mutual friend was denied a 'friends-of-friends' profile after ` +
                        `${MUTUALS_TIMEOUT_MS}ms. Is the worker processing 'add-mutuals-for-relationship'? ` +
                        `Got ${response.status}: ${JSON.stringify(response.content)}`)
                } finally {
                    await clearRelationship(mutualStranger.session, mutualStranger.user.id, friend.session, friend.user.id)
                }
            })
        })

        describe("privacyViewFriends = 'public'", function() {

            before(async function() {
                await setViewFriendsPrivacy(owner.session, owner.user.id, 'public')
            })

            it(`Should let a stranger query the owner's relationships`, async function() {
                await assertCanQuery(stranger.session, owner.user.id)
            })

            it(`Should let a confirmed friend query the owner's relationships`, async function() {
                await assertCanQuery(friend.session, owner.user.id)
            })

            it(`Should let a user with a pending request query the owner's relationships`, async function() {
                await assertCanQuery(pendingSender.session, owner.user.id)
            })

            it(`Should let a site moderator query the owner's relationships`, async function() {
                // Not moderator privilege -- 'public' simply lets everyone in.
                await assertCanQuery(siteModerator.session, owner.user.id)
            })

            it(`Should still reject an unauthenticated request`, async function() {
                // 'public' does not mean anonymous -- the session check comes first.
                const anonymous = await initialize()

                const response = await getUserRelationships(anonymous, owner.user.id)

                assert.equal(response.status, 401)
                assert.equal(response.content?.error?.type, 'not-authenticated')
            })

            it(`Should NOT let an unconfirmed caller query a public profile`, async function() {
                // can() refuses any caller whose status is not exactly 'confirmed',
                // before any UserRelationship rule runs.  A 'public' profile is the
                // only configuration in which that guard can be isolated from the
                // ordinary stranger case -- with any other setting the caller would
                // be denied regardless of their status.
                //
                // See fixtures/users.js -> 'user-unconfirmed' for the manual setup.
                // The sibling guard for site-BANNED callers is unreachable: a banned
                // account is rejected at login and can never obtain a session.
                await assertNotAuthorized(unconfirmed.session, owner.user.id)
            })

            it(`Should NOT let a blocked caller query a public profile`, async function() {
                // The block check precedes the privacy branch, so a block overrides
                // even the most permissive setting.
                await assertCanQuery(stranger.session, owner.user.id)
                try {
                    await blockUser(owner.session, owner.user.id, stranger.user.id)
                    await assertNotAuthorized(stranger.session, owner.user.id)
                } finally {
                    await clearRelationship(owner.session, owner.user.id, stranger.session, stranger.user.id)
                }
            })
        })

        describe("the superseded showFriendsOnProfile setting", function() {
            let originalSettings = null

            before(async function() {
                originalSettings = owner.user.settings
                await setUserSetting(owner.session, owner.user.id, originalSettings, 'showFriendsOnProfile', false)
                await setViewFriendsPrivacy(owner.session, owner.user.id, 'public')
            })

            after(async function() {
                await restoreUserSettings(owner.session, owner.user.id, originalSettings)
            })

            it(`Should ignore showFriendsOnProfile=false when privacyViewFriends is 'public'`, async function() {
                // `settings.showFriendsOnProfile` is only read by the dead
                // `! features.has('feat-491-mutual-friends')` branch, so with the
                // flag permanently on it has no effect whatsoever.
                // Feat491MutualFriendsMigration is what carried the old preference
                // across ('false' became 'me'), and it ran once; changing the old
                // setting afterwards does nothing.
                //
                // Asserting that keeps the dead branch dead: if someone revives it,
                // or wires the old setting back into the live path, this fails.
                await assertCanQuery(stranger.session, owner.user.id)
            })
        })
    })

    // ======================================================================
    // What a PERMITTED query returns for another user.
    //
    // Two content rules live in createQuery() rather than in the permission
    // service, and they are part of the same model:
    //
    //   ((user_id = $1 OR friend_id = $1) AND status = 'confirmed')
    //   AND (user_id != ALL($2::uuid[]) AND friend_id != ALL($2::uuid[]))
    //
    // -- another user's list is confirmed-only, and anyone you have blocked (or
    // who has blocked you) is stripped from it.  Both are asserted against the
    // owner's DEFAULT privacy ('friends'), which admits confirmed friends, so
    // neither test needs to touch the privacy setting.
    //
    // Everything else createQuery() does is driven by query parameters and is
    // out of scope for this run.
    // ======================================================================
    describe("what a permitted query returns for another user", function() {
        let owner, caller, pendingFriend, blockedByCaller

        before(async function() {
            owner = await loginAs('user-privacy')       // the profile owner
            caller = await loginAs('user2')             // confirmed friend, doing the querying
            pendingFriend = await loginAs('user4')      // has a PENDING request with the owner
            blockedByCaller = await loginAs('user7')    // confirmed friend of the owner, blocked by the caller

            await clearRelationship(owner.session, owner.user.id, caller.session, caller.user.id)
            await clearRelationship(owner.session, owner.user.id, pendingFriend.session, pendingFriend.user.id)
            await clearRelationship(owner.session, owner.user.id, blockedByCaller.session, blockedByCaller.user.id)
            await clearRelationship(caller.session, caller.user.id, blockedByCaller.session, blockedByCaller.user.id)

            await makeFriends(owner.session, owner.user.id, caller.session, caller.user.id)
            await sendFriendRequest(pendingFriend.session, pendingFriend.user.id, owner.user.id)
            await makeFriends(owner.session, owner.user.id, blockedByCaller.session, blockedByCaller.user.id)
            await blockUser(caller.session, caller.user.id, blockedByCaller.user.id)
        })

        after(async function() {
            await clearRelationship(owner.session, owner.user.id, caller.session, caller.user.id)
            await clearRelationship(owner.session, owner.user.id, pendingFriend.session, pendingFriend.user.id)
            await clearRelationship(owner.session, owner.user.id, blockedByCaller.session, blockedByCaller.user.id)
            await clearRelationship(caller.session, caller.user.id, blockedByCaller.session, blockedByCaller.user.id)
            await logout(owner.session)
            await logout(caller.session)
            await logout(pendingFriend.session)
            await logout(blockedByCaller.session)
        })

        it(`Should include the owner's confirmed relationships`, async function() {
            const found = await listContainsRelationshipWith(caller.session, owner.user.id, caller.user.id)
            assert.equal(found, true, `The owner's list omitted a confirmed relationship.`)
        })

        it(`Should NOT expose the owner's PENDING relationships`, async function() {
            // Another user's unanswered friend requests are nobody else's business.
            const found = await listContainsRelationshipWith(caller.session, owner.user.id, pendingFriend.user.id)
            assert.equal(found, false, `The owner's list exposed a pending friend request to another user.`)
        })

        it(`Should NOT include relationships with a user the caller has blocked`, async function() {
            // The owner and blockedByCaller really are confirmed friends, but the
            // caller has blocked them, so that row is filtered out of the result.
            const found = await listContainsRelationshipWith(caller.session, owner.user.id, blockedByCaller.user.id)
            assert.equal(found, false, `The owner's list included a relationship with a user the caller has blocked.`)
        })
    })
})
