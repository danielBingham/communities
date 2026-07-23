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
const {
    getUserRelationship,
    sendFriendRequest,
    makeFriends,
    blockUser,
    clearRelationship
} = require('../../lib/relationships')

// ===========================================================================
// About this suite
// ===========================================================================
// Endpoint under test: GET /user/:userId/relationship/:relationId
//   -> UserRelationshipController.getUserRelationship()
//
// The controller does three things in order:
//   1. Requires a session.  No session -> 401 'not-authenticated'.
//   2. Looks the relationship up with a SYMMETRIC query:
//        (user_id = :userId AND friend_id = :relationId)
//     OR (user_id = :relationId AND friend_id = :userId)
//      No row -> 404 'not-found'.
//   3. Runs can(currentUser, 'view', 'UserRelationship', { ..., relationship }).
//      Denied -> 404 'not-found'.
//
// Two consequences shape this whole suite:
//
//   *** The path parameters are INTERCHANGEABLE. ***
//   Because the lookup matches either direction, GET /user/A/relationship/B and
//   GET /user/B/relationship/A return the same row.  The route reads as though
//   it were directional and it is not, so every permission case below is
//   exercised in BOTH path orderings rather than just the "natural" one.
//
//   *** A denied read and a missing row are both 404 'not-found'. ***
//   That is deliberate -- it is what stops the endpoint leaking the existence
//   of a relationship the caller may not see.  See the "existence information
//   leaks" describe at the bottom, which probes that property directly (and
//   currently fails; see the BUG note there).
//
// The permission rule itself (UserRelationshipPermissions.canViewUserRelationship)
// is short, and the matrix below covers it exhaustively:
//
//   - can() first refuses ANY user whose status is not exactly 'confirmed'.
//   - A 'blocked' relationship is visible ONLY to the blocker
//     (relationship.userId).  Not to the person they blocked.
//   - Any other relationship ('pending', 'confirmed') is visible to BOTH
//     participants -- relationship.userId and relationship.relationId.
//   - Nobody else.  Note in particular that there is NO site-moderator branch
//     here, unlike Group/GroupMember/Post: a site moderator is just a third
//     party to other people's relationships.  That is asserted explicitly below
//     so a future change that grants moderators access is caught.
//
// Statuses come from the user_relationship_status enum: 'pending', 'confirmed',
// 'blocked'.  All three are covered.
//
// NOT COVERABLE HERE: the can() guard for site-BANNED users.  A banned account
// is rejected by AuthenticationService at login and can never obtain a session,
// so that branch is unreachable through the API.  The sibling guard for
// non-confirmed users IS reachable (only 'banned' is checked at login), and is
// covered via the 'user-unconfirmed' fixture.

// Small, branch-free assertion helpers.  These only wrap the HTTP round-trip
// and the status/body checks -- they compute nothing about *who* should be
// allowed.  Each test states its own expectation by choosing which one to call,
// so the expected outcome is always visible in the test itself.
//
//   assertCanView    -- 200 + a relationship entity joining the two given users
//                       (in whichever stored direction), with the given status.
//   assertCannotView -- 404 + error.type 'not-found' (denied, or absent).
async function assertCanView(session, pathUserId, pathRelationId, expectedStatus) {
    const response = await getUserRelationship(session, pathUserId, pathRelationId)
    assert.equal(response.status, 200, `Expected 200 but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.equal(response.content?.entity?.status, expectedStatus)

    // The entity joins exactly the two users named in the path, in one order or
    // the other.  Sorting both pairs keeps this a single assertion rather than
    // a branch on which direction the row happens to be stored in.
    const entityPair = [ response.content.entity.userId, response.content.entity.relationId ].sort()
    const requestedPair = [ pathUserId, pathRelationId ].sort()
    assert.deepEqual(entityPair, requestedPair)
}

async function assertCannotView(session, pathUserId, pathRelationId) {
    const response = await getUserRelationship(session, pathUserId, pathRelationId)
    assert.equal(response.status, 404, `Expected 404 not-found but got ${response.status}: ${JSON.stringify(response.content)}`)
    assert.equal(response.content?.error?.type, 'not-found')
}

describe('GET /user/:userId/relationship/:relationId', function() {

    // ======================================================================
    // Shape of a successful read.
    //
    // Covers the 200 body: the entity's fields, the direction it reports, and
    // the `relations` sidecar.  Permission cases live further down; these tests
    // are all read by a participant who is plainly allowed to see the row.
    // ======================================================================
    describe("the successful response", function() {
        let requester, recipient

        before(async function() {
            requester = await loginAs('user1')
            recipient = await loginAs('user2')
            // Normalize any relationship an earlier suite may have left behind.
            await clearRelationship(requester.session, requester.user.id, recipient.session, recipient.user.id)
            await sendFriendRequest(requester.session, requester.user.id, recipient.user.id)
        })

        after(async function() {
            await clearRelationship(requester.session, requester.user.id, recipient.session, recipient.user.id)
            await logout(requester.session)
            await logout(recipient.session)
        })

        it(`Should return the requested relationship`, async function() {
            const response = await getUserRelationship(requester.session, requester.user.id, recipient.user.id)

            assert.equal(response.status, 200)

            const entity = response.content.entity
            assert.equal(entity.userId, requester.user.id)
            assert.equal(entity.relationId, recipient.user.id)
            assert.equal(entity.status, 'pending')
            assert.equal(typeof entity.id, 'string')
            assert.ok(entity.createdDate)
            assert.ok(entity.updatedDate)
        })

        it(`Should report the direction of the request regardless of the path order`, async function() {
            // userId is always the sender of the friend request and relationId
            // always the receiver -- that is how a client decides whether to
            // show "Cancel Request" or "Accept / Reject".  Reversing the path
            // parameters must NOT reverse the reported direction.
            const response = await getUserRelationship(requester.session, recipient.user.id, requester.user.id)

            assert.equal(response.status, 200)
            assert.equal(response.content.entity.userId, requester.user.id)
            assert.equal(response.content.entity.relationId, recipient.user.id)
        })

        it(`Should return the same entity to both participants`, async function() {
            const asRequester = await getUserRelationship(requester.session, requester.user.id, recipient.user.id)
            const asRecipient = await getUserRelationship(recipient.session, requester.user.id, recipient.user.id)

            assert.equal(asRequester.status, 200)
            assert.equal(asRecipient.status, 200)
            assert.deepEqual(asRecipient.content.entity, asRequester.content.entity)
        })

        it(`Should include both participants in relations.users`, async function() {
            const response = await getUserRelationship(requester.session, requester.user.id, recipient.user.id)

            assert.equal(response.status, 200)

            const users = response.content.relations.users
            assert.ok(users[requester.user.id], `relations.users is missing the requester.`)
            assert.ok(users[recipient.user.id], `relations.users is missing the recipient.`)
            assert.equal(users[requester.user.id].username, requester.fixture.username)
            assert.equal(users[recipient.user.id].username, recipient.fixture.username)
        })

        it(`Should never include a password in relations.users`, async function() {
            const response = await getUserRelationship(requester.session, requester.user.id, recipient.user.id)

            assert.equal(response.status, 200)
            assert.equal(response.content.relations.users[requester.user.id].password, null)
            assert.equal(response.content.relations.users[recipient.user.id].password, null)
        })
    })

    // ======================================================================
    // Authentication.  The session check runs before anything is looked up, so
    // it applies equally to ids that exist and ids that don't.
    // ======================================================================
    describe("authentication", function() {

        it(`Should reject an unauthenticated request`, async function() {
            const session = await initialize()

            const response = await getUserRelationship(session, crypto.randomUUID(), crypto.randomUUID())

            assert.equal(response.status, 401)
            assert.equal(response.content?.error?.type, 'not-authenticated')
        })

        it(`Should reject an unauthenticated request for a relationship that exists`, async function() {
            // The 401 must not depend on whether the relationship is real --
            // otherwise an anonymous caller could probe for relationships by
            // watching the status code change.
            const requester = await loginAs('user1')
            const recipient = await loginAs('user2')
            const anonymous = await initialize()
            try {
                await clearRelationship(requester.session, requester.user.id, recipient.session, recipient.user.id)
                await makeFriends(requester.session, requester.user.id, recipient.session, recipient.user.id)

                const response = await getUserRelationship(anonymous, requester.user.id, recipient.user.id)

                assert.equal(response.status, 401)
                assert.equal(response.content?.error?.type, 'not-authenticated')
            } finally {
                await clearRelationship(requester.session, requester.user.id, recipient.session, recipient.user.id)
                await logout(requester.session)
                await logout(recipient.session)
            }
        })
    })

    // ======================================================================
    // Cases where there is simply no row to return.  All of these are 404
    // 'not-found' -- the same response a denied read produces.
    // ======================================================================
    describe("when there is no relationship to return", function() {
        let user, other

        before(async function() {
            user = await loginAs('user1')
            other = await loginAs('user2')
            await clearRelationship(user.session, user.user.id, other.session, other.user.id)
        })

        after(async function() {
            await logout(user.session)
            await logout(other.session)
        })

        it(`Should return 404 for two real users with no relationship`, async function() {
            await assertCannotView(user.session, user.user.id, other.user.id)
        })

        it(`Should return 404 when both ids belong to no user`, async function() {
            await assertCannotView(user.session, crypto.randomUUID(), crypto.randomUUID())
        })

        it(`Should return 404 when the relation id belongs to no user`, async function() {
            await assertCannotView(user.session, user.user.id, crypto.randomUUID())
        })

        it(`Should return 404 when the user id belongs to no user`, async function() {
            await assertCannotView(user.session, crypto.randomUUID(), user.user.id)
        })

        it(`Should return 404 for a user and themselves`, async function() {
            // A user may not create a relationship with themselves, so this pair
            // can never match a row.
            await assertCannotView(user.session, user.user.id, user.user.id)
        })

        it(`Should return 404 once the relationship has been deleted`, async function() {
            await makeFriends(user.session, user.user.id, other.session, other.user.id)
            await assertCanView(user.session, user.user.id, other.user.id, 'confirmed')

            await clearRelationship(user.session, user.user.id, other.session, other.user.id)

            await assertCannotView(user.session, user.user.id, other.user.id)
        })

        // DISCREPANCY / UNCERTAIN BEHAVIOR -- left skipped.
        //
        // getUserRelationship() runs selectUserRelationships() -- `WHERE user_id
        // = $1` against a uuid column -- as its very first action, before any
        // validation of the route parameters.  A non-UUID passed into that
        // comparison is expected to raise a Postgres type error and surface as
        // an unhandled 500 'server-error' rather than the 404 a caller should
        // get for an id that cannot possibly name a relationship.  That would be
        // a (minor) bug, but the actual behavior is unverified, so this asserts
        // the presumed-correct 404 and stays skipped rather than baking in
        // either answer.  Same shape as the skipped malformed-userId case in
        // postGroupMembers.spec.js.
        it(`Should return 404 for a malformed (non-UUID) id`, async function(t) {
            t.skip(`Malformed-UUID ids hit the DB lookup before any validation; 500-vs-404 behavior is unverified.`)
            return
            // eslint-disable-next-line no-unreachable
            await assertCannotView(user.session, user.user.id, 'not-a-uuid')
        })
    })

    // ======================================================================
    // Permission model.
    //
    // One describe per relationship status.  Within each, every case is run in
    // both path orderings, because the lookup is symmetric and a permission
    // regression could easily show up in only one of them.
    // ======================================================================
    describe("permission model", function() {

        // ------------------------------------------------------------------
        // PENDING: an unanswered friend request.  Visible to both the sender
        // and the receiver, and to nobody else.
        // ------------------------------------------------------------------
        describe("for a PENDING relationship", function() {
            let requester, recipient, thirdParty, siteModerator

            before(async function() {
                requester = await loginAs('user1')       // sent the request
                recipient = await loginAs('user2')       // received the request
                thirdParty = await loginAs('user3')      // not involved
                siteModerator = await loginAs('user-site-moderator')

                await clearRelationship(requester.session, requester.user.id, recipient.session, recipient.user.id)
                await sendFriendRequest(requester.session, requester.user.id, recipient.user.id)
            })

            after(async function() {
                await clearRelationship(requester.session, requester.user.id, recipient.session, recipient.user.id)
                await logout(requester.session)
                await logout(recipient.session)
                await logout(thirdParty.session)
                await logout(siteModerator.session)
            })

            it(`Should let the requester view it`, async function() {
                await assertCanView(requester.session, requester.user.id, recipient.user.id, 'pending')
            })

            it(`Should let the requester view it with the path parameters reversed`, async function() {
                await assertCanView(requester.session, recipient.user.id, requester.user.id, 'pending')
            })

            it(`Should let the recipient view it`, async function() {
                await assertCanView(recipient.session, requester.user.id, recipient.user.id, 'pending')
            })

            it(`Should let the recipient view it with the path parameters reversed`, async function() {
                await assertCanView(recipient.session, recipient.user.id, requester.user.id, 'pending')
            })

            it(`Should NOT let a third party view it`, async function() {
                await assertCannotView(thirdParty.session, requester.user.id, recipient.user.id)
            })

            it(`Should NOT let a third party view it with the path parameters reversed`, async function() {
                await assertCannotView(thirdParty.session, recipient.user.id, requester.user.id)
            })

            it(`Should NOT let a site moderator view it`, async function() {
                // Unlike Group, GroupMember and Post, canViewUserRelationship has
                // no site-moderator branch -- relationships are private even from
                // site moderation.  If moderator access is ever added, this test
                // is the one that should be updated deliberately.
                await assertCannotView(siteModerator.session, requester.user.id, recipient.user.id)
            })

            it(`Should NOT let a site moderator view it with the path parameters reversed`, async function() {
                await assertCannotView(siteModerator.session, recipient.user.id, requester.user.id)
            })
        })

        // ------------------------------------------------------------------
        // CONFIRMED: an accepted friendship.  Same visibility as pending --
        // both participants, nobody else.  Confirmed friendships are the ones
        // shown publicly on profiles, but that is the *query* endpoint's job;
        // reading the relationship row itself stays private.
        // ------------------------------------------------------------------
        describe("for a CONFIRMED relationship", function() {
            let requester, recipient, thirdParty, siteModerator

            before(async function() {
                requester = await loginAs('user1')       // sent the request
                recipient = await loginAs('user2')       // accepted it
                thirdParty = await loginAs('user3')
                siteModerator = await loginAs('user-site-moderator')

                await clearRelationship(requester.session, requester.user.id, recipient.session, recipient.user.id)
                await makeFriends(requester.session, requester.user.id, recipient.session, recipient.user.id)
            })

            after(async function() {
                await clearRelationship(requester.session, requester.user.id, recipient.session, recipient.user.id)
                await logout(requester.session)
                await logout(recipient.session)
                await logout(thirdParty.session)
                await logout(siteModerator.session)
            })

            it(`Should let the requester view it`, async function() {
                await assertCanView(requester.session, requester.user.id, recipient.user.id, 'confirmed')
            })

            it(`Should let the requester view it with the path parameters reversed`, async function() {
                await assertCanView(requester.session, recipient.user.id, requester.user.id, 'confirmed')
            })

            it(`Should let the accepter view it`, async function() {
                await assertCanView(recipient.session, requester.user.id, recipient.user.id, 'confirmed')
            })

            it(`Should let the accepter view it with the path parameters reversed`, async function() {
                await assertCanView(recipient.session, recipient.user.id, requester.user.id, 'confirmed')
            })

            it(`Should NOT let a third party view it`, async function() {
                await assertCannotView(thirdParty.session, requester.user.id, recipient.user.id)
            })

            it(`Should NOT let a third party view it with the path parameters reversed`, async function() {
                await assertCannotView(thirdParty.session, recipient.user.id, requester.user.id)
            })

            it(`Should NOT let a friend of one participant view it`, async function() {
                // Being friends with a participant grants no access to that
                // participant's other relationships.
                try {
                    await clearRelationship(requester.session, requester.user.id, thirdParty.session, thirdParty.user.id)
                    await makeFriends(requester.session, requester.user.id, thirdParty.session, thirdParty.user.id)
                    await assertCannotView(thirdParty.session, requester.user.id, recipient.user.id)
                } finally {
                    await clearRelationship(requester.session, requester.user.id, thirdParty.session, thirdParty.user.id)
                }
            })

            it(`Should NOT let a site moderator view it`, async function() {
                await assertCannotView(siteModerator.session, requester.user.id, recipient.user.id)
            })

            it(`Should NOT let a site moderator view it with the path parameters reversed`, async function() {
                await assertCannotView(siteModerator.session, recipient.user.id, requester.user.id)
            })
        })

        // ------------------------------------------------------------------
        // BLOCKED: the one asymmetric case.  A block is stored with the blocker
        // as relationship.userId, and only the blocker may read it.  The person
        // who was blocked is treated exactly like a stranger -- which is the
        // whole point: blocking is supposed to be invisible to its target.
        // ------------------------------------------------------------------
        describe("for a BLOCKED relationship", function() {
            let blocker, blocked, thirdParty, siteModerator

            before(async function() {
                blocker = await loginAs('user1')         // does the blocking
                blocked = await loginAs('user2')         // gets blocked
                thirdParty = await loginAs('user3')
                siteModerator = await loginAs('user-site-moderator')

                await clearRelationship(blocker.session, blocker.user.id, blocked.session, blocked.user.id)
                await blockUser(blocker.session, blocker.user.id, blocked.user.id)
            })

            after(async function() {
                await clearRelationship(blocker.session, blocker.user.id, blocked.session, blocked.user.id)
                await logout(blocker.session)
                await logout(blocked.session)
                await logout(thirdParty.session)
                await logout(siteModerator.session)
            })

            it(`Should store the blocker as the relationship's userId`, async function() {
                const response = await getUserRelationship(blocker.session, blocker.user.id, blocked.user.id)

                assert.equal(response.status, 200)
                assert.equal(response.content.entity.userId, blocker.user.id)
                assert.equal(response.content.entity.relationId, blocked.user.id)
                assert.equal(response.content.entity.status, 'blocked')
            })

            it(`Should let the blocker view it`, async function() {
                await assertCanView(blocker.session, blocker.user.id, blocked.user.id, 'blocked')
            })

            it(`Should let the blocker view it with the path parameters reversed`, async function() {
                await assertCanView(blocker.session, blocked.user.id, blocker.user.id, 'blocked')
            })

            it(`Should NOT let the blocked user view it`, async function() {
                await assertCannotView(blocked.session, blocker.user.id, blocked.user.id)
            })

            it(`Should NOT let the blocked user view it with the path parameters reversed`, async function() {
                await assertCannotView(blocked.session, blocked.user.id, blocker.user.id)
            })

            it(`Should NOT let a third party view it`, async function() {
                await assertCannotView(thirdParty.session, blocker.user.id, blocked.user.id)
            })

            it(`Should NOT let a third party view it with the path parameters reversed`, async function() {
                await assertCannotView(thirdParty.session, blocked.user.id, blocker.user.id)
            })

            it(`Should NOT let a site moderator view it`, async function() {
                await assertCannotView(siteModerator.session, blocker.user.id, blocked.user.id)
            })

            it(`Should NOT let a site moderator view it with the path parameters reversed`, async function() {
                await assertCannotView(siteModerator.session, blocked.user.id, blocker.user.id)
            })
        })

        // ------------------------------------------------------------------
        // A previously confirmed friendship that is then blocked.
        //
        // POST /user/:userId/relationships with status 'blocked' DELETES the
        // existing row and inserts a fresh block, so the formerly-visible
        // friendship must become invisible to the person who was blocked.
        // ------------------------------------------------------------------
        describe("when a confirmed friendship is replaced by a block", function() {
            let blocker, blocked

            before(async function() {
                blocker = await loginAs('user1')
                blocked = await loginAs('user2')

                await clearRelationship(blocker.session, blocker.user.id, blocked.session, blocked.user.id)
                await makeFriends(blocker.session, blocker.user.id, blocked.session, blocked.user.id)
                await blockUser(blocker.session, blocker.user.id, blocked.user.id)
            })

            after(async function() {
                await clearRelationship(blocker.session, blocker.user.id, blocked.session, blocked.user.id)
                await logout(blocker.session)
                await logout(blocked.session)
            })

            it(`Should show the blocker a 'blocked' relationship, not the old friendship`, async function() {
                await assertCanView(blocker.session, blocker.user.id, blocked.user.id, 'blocked')
            })

            it(`Should hide the relationship from the user who was blocked`, async function() {
                await assertCannotView(blocked.session, blocker.user.id, blocked.user.id)
            })
        })

        // ------------------------------------------------------------------
        // Users whose account status is not 'confirmed'.
        //
        // PermissionService.can() rejects them before any UserRelationship rule
        // runs, so they cannot read even a relationship they are a participant
        // in.  The control case immediately below pins the difference to the
        // account status and nothing else.
        //
        // See fixtures/users.js -> 'user-unconfirmed' for the manual setup.
        // ------------------------------------------------------------------
        describe("for a user who has not confirmed their email", function() {
            let requester, unconfirmed, confirmedControl

            before(async function() {
                requester = await loginAs('user1')                  // sends both requests
                unconfirmed = await loginAs('user-unconfirmed')     // status 'unconfirmed'
                confirmedControl = await loginAs('user2')           // status 'confirmed'

                await clearRelationship(requester.session, requester.user.id, unconfirmed.session, unconfirmed.user.id)
                await clearRelationship(requester.session, requester.user.id, confirmedControl.session, confirmedControl.user.id)

                await sendFriendRequest(requester.session, requester.user.id, unconfirmed.user.id)
                await sendFriendRequest(requester.session, requester.user.id, confirmedControl.user.id)
            })

            after(async function() {
                await clearRelationship(requester.session, requester.user.id, unconfirmed.session, unconfirmed.user.id)
                await clearRelationship(requester.session, requester.user.id, confirmedControl.session, confirmedControl.user.id)
                await logout(requester.session)
                await logout(unconfirmed.session)
                await logout(confirmedControl.session)
            })

            it(`Should let a CONFIRMED recipient view the request sent to them (control)`, async function() {
                await assertCanView(confirmedControl.session, requester.user.id, confirmedControl.user.id, 'pending')
            })

            it(`Should NOT let an UNCONFIRMED recipient view the request sent to them`, async function() {
                await assertCannotView(unconfirmed.session, requester.user.id, unconfirmed.user.id)
            })

            it(`Should NOT let an UNCONFIRMED recipient view it with the path parameters reversed`, async function() {
                await assertCannotView(unconfirmed.session, unconfirmed.user.id, requester.user.id)
            })

            it(`Should still let the confirmed requester view the request they sent`, async function() {
                // The unconfirmed account is blind to the row; the other side of
                // the same row is unaffected.
                await assertCanView(requester.session, requester.user.id, unconfirmed.user.id, 'pending')
            })
        })
    })

    // ======================================================================
    // Existence information leaks.
    //
    // Denied reads and missing rows are both 404 'not-found' so that a caller
    // cannot tell them apart.  These tests probe that directly.
    //
    // The technique matters: each test issues TWO requests for the SAME pair of
    // user ids, once with no relationship between them and once with one, and
    // compares the responses.  Holding the ids fixed is what makes the
    // comparison meaningful -- the 404 messages echo the ids back, so probing
    // two DIFFERENT pairs would differ for a harmless reason and prove nothing.
    //
    // >>> BUG: THE FIRST TWO TESTS BELOW FAIL AGAINST THE CURRENT CODE. <<<
    //
    // getUserRelationship() throws two DIFFERENT ControllerErrors, and the
    // public message of each is returned to the caller verbatim:
    //
    //   no row found      -> "No relationship found for User(x) and User(y)."
    //   permission denied -> "Either that UserRelationship doesn't exist or you
    //                        don't have permission to view it."
    //
    // The status (404) and error.type ('not-found') match, so the leak is
    // invisible to anything that only checks those -- but the message does not,
    // and it is the message that gives the game away.  Any authenticated user
    // can therefore ask "do these two people have a relationship?" about any two
    // accounts on the site and get a reliable yes/no.  The second test is the
    // sharper version of the same defect: it lets someone find out they have
    // been blocked, which blocking is specifically designed not to reveal.
    //
    // The fix is to make the permission-denied branch throw the same message as
    // the not-found branch (the not-found wording is the safer of the two, since
    // it only echoes ids the caller already supplied).  Once that lands, both
    // tests should pass unchanged.
    // ======================================================================
    describe("existence information leaks", function() {

        it(`Should give a third party the same 404 whether or not the relationship exists`, async function() {
            const userA = await loginAs('user1')
            const userB = await loginAs('user2')
            const thirdParty = await loginAs('user3')
            try {
                await clearRelationship(userA.session, userA.user.id, userB.session, userB.user.id)

                // Probe 1: this exact pair of ids, with NO relationship.
                const absent = await getUserRelationship(thirdParty.session, userA.user.id, userB.user.id)

                await makeFriends(userA.session, userA.user.id, userB.session, userB.user.id)

                // Probe 2: the SAME pair of ids, now WITH a confirmed friendship.
                const present = await getUserRelationship(thirdParty.session, userA.user.id, userB.user.id)

                assert.equal(absent.status, 404)
                assert.equal(present.status, 404)
                assert.equal(absent.content?.error?.type, 'not-found')
                assert.equal(present.content?.error?.type, 'not-found')

                // Same ids in, so the two bodies must be indistinguishable.
                assert.deepEqual(present.content, absent.content,
                    `A third party can detect that the relationship exists: the 404 body changes once it does. ` +
                    `Without a relationship: ${JSON.stringify(absent.content)} -- ` +
                    `with one: ${JSON.stringify(present.content)}`)
            } finally {
                await clearRelationship(userA.session, userA.user.id, userB.session, userB.user.id)
                await logout(userA.session)
                await logout(userB.session)
                await logout(thirdParty.session)
            }
        })

        it(`Should not reveal to a blocked user that they have been blocked`, async function() {
            const blocker = await loginAs('user1')
            const blocked = await loginAs('user2')
            try {
                await clearRelationship(blocker.session, blocker.user.id, blocked.session, blocked.user.id)

                // Probe 1: as the soon-to-be-blocked user, with no relationship.
                const absent = await getUserRelationship(blocked.session, blocker.user.id, blocked.user.id)

                await blockUser(blocker.session, blocker.user.id, blocked.user.id)

                // Probe 2: same user, same ids, now blocked.
                const afterBlock = await getUserRelationship(blocked.session, blocker.user.id, blocked.user.id)

                assert.equal(absent.status, 404)
                assert.equal(afterBlock.status, 404)
                assert.equal(absent.content?.error?.type, 'not-found')
                assert.equal(afterBlock.content?.error?.type, 'not-found')

                assert.deepEqual(afterBlock.content, absent.content,
                    `A blocked user can detect that they have been blocked: the 404 body changes once the block exists. ` +
                    `Before the block: ${JSON.stringify(absent.content)} -- ` +
                    `after: ${JSON.stringify(afterBlock.content)}`)
            } finally {
                await clearRelationship(blocker.session, blocker.user.id, blocked.session, blocked.user.id)
                await logout(blocker.session)
                await logout(blocked.session)
            }
        })

        it(`Should give a third party the same 404 for every relationship status`, async function() {
            // A third party must not be able to tell a pending request from a
            // confirmed friendship from a block.  All three are denied by the
            // same branch, so all three responses should be identical.
            const userA = await loginAs('user1')
            const userB = await loginAs('user2')
            const thirdParty = await loginAs('user3')
            try {
                await clearRelationship(userA.session, userA.user.id, userB.session, userB.user.id)

                await sendFriendRequest(userA.session, userA.user.id, userB.user.id)
                const whilePending = await getUserRelationship(thirdParty.session, userA.user.id, userB.user.id)

                await clearRelationship(userA.session, userA.user.id, userB.session, userB.user.id)
                await makeFriends(userA.session, userA.user.id, userB.session, userB.user.id)
                const whileConfirmed = await getUserRelationship(thirdParty.session, userA.user.id, userB.user.id)

                await blockUser(userA.session, userA.user.id, userB.user.id)
                const whileBlocked = await getUserRelationship(thirdParty.session, userA.user.id, userB.user.id)

                assert.equal(whilePending.status, 404)
                assert.deepEqual(whileConfirmed.content, whilePending.content,
                    `A third party can distinguish a confirmed friendship from a pending request.`)
                assert.deepEqual(whileBlocked.content, whilePending.content,
                    `A third party can distinguish a block from a pending request.`)
            } finally {
                await clearRelationship(userA.session, userA.user.id, userB.session, userB.user.id)
                await logout(userA.session)
                await logout(userB.session)
                await logout(thirdParty.session)
            }
        })

        it(`Should not reveal whether the named users exist`, async function() {
            // Probing a pair of ids that name no accounts at all must look like
            // probing two real accounts with no relationship.  (The messages
            // echo the supplied ids, so only the status and type can be compared
            // here -- the ids necessarily differ between the two probes.)
            const user = await loginAs('user1')
            const other = await loginAs('user2')
            try {
                await clearRelationship(user.session, user.user.id, other.session, other.user.id)

                const realUsers = await getUserRelationship(user.session, user.user.id, other.user.id)
                const fakeUsers = await getUserRelationship(user.session, crypto.randomUUID(), crypto.randomUUID())

                assert.equal(fakeUsers.status, realUsers.status)
                assert.equal(fakeUsers.content?.error?.type, realUsers.content?.error?.type)
            } finally {
                await logout(user.session)
                await logout(other.session)
            }
        })
    })
})
