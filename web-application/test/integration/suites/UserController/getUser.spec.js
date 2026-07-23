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
const { getUser, findUserIdByUsernameAsAdmin } = require('../../lib/users')
const { makeFriends, sendFriendRequest, blockUser, deleteRelationship } = require('../../lib/relationships')
const { isFeatureEnabled } = require('../../lib/system')

const userDictionary = require('../../fixtures/users')

// Flagging profiles for site moderation is gated behind this flag.  When it is
// off, UserDAO does not select `users.site_moderation_id` at all, DAO.hydrate()
// sets `siteModerationId` to null, and getUser() skips its moderation branch
// entirely -- so a rejected profile would be visible to everyone.  The site
// moderation tests below skip themselves rather than failing spuriously.
const FLAG_PROFILES_FEATURE = 'feat-408-flag-profiles-and-groups'

// Mutual friends adds the `relations.mutuals` dictionary (and the two
// `privacy__view_*` columns).  Same treatment.
const MUTUAL_FRIENDS_FEATURE = 'feat-491-mutual-friends'

// ===========================================================================
// About this suite
// ===========================================================================
// Endpoint under test: GET /user/:id  ->  UserController.getUser()
//
// The controller runs five gates in order:
//
//   1. 401 'not-authenticated' when there is no session user.
//   2. BLOCK CHECK -- skipped for a self-view and for site moderators.  It
//      loads the relationship in either direction and answers 404 only when
//      `relationship.status === 'blocked' && currentUser.id === relationship.relationId`.
//      UserRelationshipController stores the blocker as `user_id` and the
//      blocked as `friend_id`, so this gate is ONE-WAY: if A blocks B, B gets a
//      404 on A, but A can still read B.  That matches how parseQuery() filters
//      GET /users ("you can't see users who have blocked you"), so it reads as
//      deliberate rather than accidental.
//   3. FIELD SELECTION -- `fields: 'all'` is passed ONLY when
//      `currentUser.id === userId`.  Not for friends, not for site moderators,
//      not for site admins.  This is the endpoint's real privacy boundary.
//   4. LOOKUP -- `users.status != 'invited'`, and *only* 'invited'.  A 404
//      follows when nothing matches.
//   5. SITE MODERATION -- when the profile carries a SiteModeration whose
//      status is 'rejected', everyone except the user themselves and site
//      moderators gets a 403 'not-authorized' (note: 403, not 404 -- this
//      endpoint deliberately tells you the profile was removed).
//
// A note on "hidden" fields.  DAO.getSelectionString() omits SELECT.REQUEST
// columns unless `fields: 'all'` was asked for, but DAO.hydrate() still walks
// every column in the schema and assigns `null` for the ones the row does not
// carry.  So an undisclosed field is PRESENT AND NULL on the entity, not
// absent.  The assertions below check for null accordingly; the only truly
// absent values are the columns UserDAO leaves out of its schema altogether
// (the multifactor secret, the failed-attempt counters).

// Small, branch-free assertion helpers.  These only wrap the HTTP round-trip
// and the status/body checks -- they compute nothing about *who* should be
// allowed.  Each test states its own expectation by choosing which one to call,
// so the expected outcome is always visible in the test itself.
//
//   assertCanViewUser  -- 200 + the target's stable identifying fields.
//   assertNotFound     -- 404 + error.type 'not-found'.
//   assertNotAuthorized -- 403 + error.type 'not-authorized'.
async function assertCanViewUser(session, expectedUser) {
    const response = await getUser(session, expectedUser.id)
    assert.equal(response.status, 200)
    assert.equal(response.content?.entity?.id, expectedUser.id)
    assert.equal(response.content?.entity?.username, expectedUser.username)
    assert.equal(response.content?.entity?.name, expectedUser.name)
}

async function assertNotFound(session, userId) {
    const response = await getUser(session, userId)
    assert.equal(response.status, 404)
    assert.equal(response.content?.error?.type, 'not-found')
}

async function assertNotAuthorized(session, userId) {
    const response = await getUser(session, userId)
    assert.equal(response.status, 403)
    assert.equal(response.content?.error?.type, 'not-authorized')
}

// The fields UserDAO marks SELECT.ALWAYS -- the public profile.  Every caller
// who gets a 200 sees these, whoever they are.
function assertPublicFieldsPresent(entity) {
    assert.equal(typeof entity.id, 'string')
    assert.equal(typeof entity.name, 'string')
    assert.equal(typeof entity.username, 'string')
    assert.equal(typeof entity.siteRole, 'string')
    assert.ok(entity.createdDate)
    assert.ok(entity.updatedDate)
    // Present but nullable, so check for the key rather than a value.
    assert.ok('fileId' in entity)
    assert.ok('about' in entity)
}

// The fields UserDAO marks SELECT.REQUEST.  They are selected only when the
// controller asks for `fields: 'all'`, which happens only on a self-view.
// Hydration leaves them present-and-null for everybody else.
function assertPrivateFieldsHidden(entity) {
    assert.equal(entity.email, null)
    assert.equal(entity.birthdate, null)
    assert.equal(entity.status, null)
    assert.equal(entity.permissions, null)
    assert.equal(entity.settings, null)
    assert.equal(entity.notices, null)
    assert.equal(entity.location, null)
    assert.equal(entity.invitations, null)
    assert.equal(entity.lastAuthenticationAttemptDate, null)
}

// Credentials that must never reach a client, on any code path.
//
// `password` IS in UserDAO's schema but is SELECT.NEVER, so it is never
// selected and hydrates to null -- including on a self-view with
// `fields: 'all'`.  The rest are deliberately left out of the schema
// altogether, so they are absent from the entity entirely.
function assertSecretsNeverDisclosed(entity) {
    assert.equal(entity.password, null)
    assert.equal(entity.authenticationMultifactorSecret, undefined)
    assert.equal(entity.authenticationMultifactorFailedAttempts, undefined)
    assert.equal(entity.authenticationMultifactorLastAttemptDate, undefined)
    assert.equal(entity.failedAuthenticationAttempts, undefined)
}

describe('GET /user/:id', function() {

    // Detected once, up front.  The describes further down consult these and
    // skip themselves when the relevant feature is disabled.
    let flagProfilesEnabled = false
    let mutualFriendsEnabled = false

    before(async function() {
        flagProfilesEnabled = await isFeatureEnabled(FLAG_PROFILES_FEATURE)
        mutualFriendsEnabled = await isFeatureEnabled(MUTUAL_FRIENDS_FEATURE)
    })

    // ======================================================================
    // Basics: the shape of a successful read, and the non-permission
    // 401/404 paths.
    // ======================================================================

    it(`Should return the requested user`, async function() {
        const viewer = await loginAs('user1')
        const target = await loginAs('user2')
        try {
            const response = await fetchEndpoint('GET', `/user/${encodeURIComponent(target.user.id)}`, { session: viewer.session })

            if ( ! response.ok ) {
                assert.fail('Failed to retrieve the user under test.')
            }

            const entity = response.content.entity
            assert.equal(entity.id, target.user.id)
            assert.equal(entity.username, target.fixture.username)
            assert.equal(entity.name, target.fixture.name)
        } finally {
            await logout(viewer.session)
            await logout(target.session)
        }
    })

    it(`Should return a 'relations' envelope alongside the entity`, async function() {
        const viewer = await loginAs('user1')
        const target = await loginAs('user2')
        try {
            const response = await getUser(viewer.session, target.user.id)

            assert.equal(response.status, 200)
            assert.equal(typeof response.content.relations, 'object')
            assert.equal(typeof response.content.relations.files, 'object')
            assert.equal(typeof response.content.relations.mutuals, 'object')
            assert.equal(typeof response.content.relations.userRelationships, 'object')
        } finally {
            await logout(viewer.session)
            await logout(target.session)
        }
    })

    it(`Should reject an unauthenticated request`, async function() {
        // The authentication check happens before the user is even looked up,
        // so any id (even one that doesn't exist) exercises this path.
        const session = await initialize()

        const response = await getUser(session, crypto.randomUUID())

        assert.equal(response.status, 401)
        assert.equal(response.content?.error?.type, 'not-authenticated')
    })

    it(`Should reject an unauthenticated request for an existing user`, async function() {
        // Same gate, but with a real id -- confirms the 401 is not just the
        // "no such user" 404 wearing a different hat, and that an anonymous
        // caller learns nothing about whether the account exists.
        const target = await loginAs('user1')
        const anonymous = await initialize()
        try {
            const response = await getUser(anonymous, target.user.id)

            assert.equal(response.status, 401)
            assert.equal(response.content?.error?.type, 'not-authenticated')
        } finally {
            await logout(target.session)
        }
    })

    it(`Should return 404 for a user that doesn't exist`, async function() {
        const viewer = await loginAs('user1')
        try {
            await assertNotFound(viewer.session, crypto.randomUUID())
        } finally {
            await logout(viewer.session)
        }
    })

    // DISCREPANCY / UNVERIFIED -- left skipped.
    //
    // Same rough edge already flagged on POST /group/:groupId/members and
    // PATCH /group/:groupId/member/:userId.  There is no UUID validation
    // middleware on the route and getUser() does not clean `request.params.id`,
    // so a malformed id is handed straight to Postgres -- first by
    // getUserRelationshipByUserAndRelation() in the block check, then by
    // `users.id = $1` against a uuid column.  That comparison is expected to
    // raise a type error and surface as a 500 rather than a clean 4xx.  Which
    // 4xx is right is itself arguable (404 matches this endpoint's own
    // convention for "no such user"; 400 would be defensible), so this asserts
    // the 404 and stays skipped.
    it(`Should reject a malformed (non-UUID) id with 404`, async function(t) {
        t.skip(`Malformed-UUID id reaches Postgres before any validation; 500-vs-4xx behavior is unverified.`)
        return
        // eslint-disable-next-line no-unreachable
        const viewer = await loginAs('user1')
        try {
            await assertNotFound(viewer.session, 'not-a-uuid')
        } finally {
            await logout(viewer.session)
        }
    })

    // ======================================================================
    // Field disclosure.
    //
    // Gate 3 is the whole privacy story for this endpoint: `fields: 'all'` is
    // passed if and only if the caller is the target.  These describes pin
    // down each side of that line.
    // ======================================================================

    describe('Field disclosure', function() {

        describe('when viewing your own profile', function() {
            let self
            let entity = null

            before(async function() {
                self = await loginAs('user1')
                const response = await getUser(self.session, self.user.id)
                entity = response.content.entity
            })

            after(async function() {
                await logout(self.session)
            })

            it(`Should return the public profile fields`, function() {
                assertPublicFieldsPresent(entity)
            })

            it(`Should disclose your own email`, function() {
                assert.equal(entity.email, self.fixture.email)
            })

            it(`Should disclose your own account status`, function() {
                assert.equal(entity.status, 'confirmed')
            })

            it(`Should NOT save your birthdate`, function() {
                assert.equal(entity.birthdate, null)
            })

            it(`Should disclose your own settings and notices`, function() {
                assert.equal(typeof entity.settings, 'object')
                assert.notEqual(entity.settings, null)
                assert.equal(typeof entity.notices, 'object')
                assert.notEqual(entity.notices, null)
            })

            it(`Should disclose your own permissions and invitations`, function() {
                assert.equal(entity.permissions, 'user')
                assert.equal(typeof entity.invitations, 'number')
            })

            it(`Should never disclose your password or multifactor secrets`, function() {
                assertSecretsNeverDisclosed(entity)
            })
        })

        describe('when viewing another user', function() {
            // user1 and user2 are strangers here -- no relationship at all.
            // The before/after pair deletes any relationship left behind by an
            // earlier suite so this group starts and ends from a clean slate.
            let viewer, target
            let entity = null

            before(async function() {
                viewer = await loginAs('user1')
                target = await loginAs('user2')

                await deleteRelationship(viewer.session, viewer.user.id, target.user.id)

                const response = await getUser(viewer.session, target.user.id)
                entity = response.content.entity
            })

            after(async function() {
                await deleteRelationship(viewer.session, viewer.user.id, target.user.id)
                await logout(viewer.session)
                await logout(target.session)
            })

            it(`Should return the public profile fields`, function() {
                assertPublicFieldsPresent(entity)
            })

            it(`Should NOT disclose another user's email`, function() {
                assert.equal(entity.email, null)
            })

            it(`Should NOT disclose another user's account status`, function() {
                assert.equal(entity.status, null)
            })

            it(`Should NOT disclose another user's birthdate`, function() {
                assert.equal(entity.birthdate, null)
            })

            it(`Should NOT disclose another user's settings or notices`, function() {
                assert.equal(entity.settings, null)
                assert.equal(entity.notices, null)
            })

            it(`Should NOT disclose another user's location`, function() {
                assert.equal(entity.location, null)
            })

            it(`Should NOT disclose another user's permissions or invitations`, function() {
                assert.equal(entity.permissions, null)
                assert.equal(entity.invitations, null)
            })

            it(`Should NOT disclose another user's last authentication attempt`, function() {
                assert.equal(entity.lastAuthenticationAttemptDate, null)
            })

            it(`Should never disclose another user's password or multifactor secrets`, function() {
                assertSecretsNeverDisclosed(entity)
            })
        })

        describe('when viewing a friend', function() {
            // Friendship unlocks nothing on this endpoint -- `fields: 'all'` is
            // keyed strictly on identity, not on relationship.  This group
            // exists to keep that from silently regressing.
            let viewer, target
            let entity = null

            before(async function() {
                viewer = await loginAs('user1')
                target = await loginAs('user2')

                await deleteRelationship(viewer.session, viewer.user.id, target.user.id)
                await makeFriends(viewer.session, viewer.user.id, target.session, target.user.id)

                const response = await getUser(viewer.session, target.user.id)
                entity = response.content.entity
            })

            after(async function() {
                await deleteRelationship(viewer.session, viewer.user.id, target.user.id)
                await logout(viewer.session)
                await logout(target.session)
            })

            it(`Should let a friend view the user`, function() {
                assert.equal(entity.id, target.user.id)
                assertPublicFieldsPresent(entity)
            })

            it(`Should NOT disclose a friend's email`, function() {
                assert.equal(entity.email, null)
            })

            it(`Should NOT disclose a friend's private fields`, function() {
                assertPrivateFieldsHidden(entity)
            })
        })

        describe('when a site moderator views another user', function() {
            // A site moderator bypasses the BLOCK gate but not the FIELD
            // SELECTION gate -- they read the same public projection everyone
            // else does.  Worth pinning down because parseQuery() *does* widen
            // the projection for `GET /users?admin=true`, so the two endpoints
            // deliberately disagree.
            let moderator, target
            let entity = null

            before(async function() {
                moderator = await loginAs('user-site-moderator')
                target = await loginAs('user2')

                const response = await getUser(moderator.session, target.user.id)
                entity = response.content.entity
            })

            after(async function() {
                await logout(moderator.session)
                await logout(target.session)
            })

            it(`Should let a site moderator view the user`, function() {
                assert.equal(entity.id, target.user.id)
                assertPublicFieldsPresent(entity)
            })

            it(`Should NOT disclose the user's email to a site moderator`, function() {
                assert.equal(entity.email, null)
            })

            it(`Should NOT disclose the user's private fields to a site moderator`, function() {
                assertPrivateFieldsHidden(entity)
            })
        })

        describe('when a site admin views another user', function() {
            // Same again one rung up the ladder.  `GET /users?admin=true` hands
            // an admin every column; `GET /user/:id` does not.
            let admin, target
            let entity = null

            before(async function() {
                admin = await loginAs('user-site-admin')
                target = await loginAs('user2')

                const response = await getUser(admin.session, target.user.id)
                entity = response.content.entity
            })

            after(async function() {
                await logout(admin.session)
                await logout(target.session)
            })

            it(`Should let a site admin view the user`, function() {
                assert.equal(entity.id, target.user.id)
                assertPublicFieldsPresent(entity)
            })

            it(`Should NOT disclose the user's email to a site admin`, function() {
                assert.equal(entity.email, null)
            })

            it(`Should NOT disclose the user's private fields to a site admin`, function() {
                assertPrivateFieldsHidden(entity)
            })
        })
    })

    // ======================================================================
    // Blocking (gate 2).
    //
    // The gate is deliberately one-way.  Each direction gets its own test so
    // the asymmetry is visible in the test names rather than buried in a
    // comment.
    // ======================================================================

    describe('Blocking', function() {
        let blocker, blocked, thirdParty

        before(async function() {
            blocker = await loginAs('user1')
            blocked = await loginAs('user2')
            thirdParty = await loginAs('user3')

            // Defensive: clear anything an earlier suite left behind, then
            // establish the block for this whole group.
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
        })

        it(`Should NOT let a user view someone who has blocked them`, async function() {
            await assertNotFound(blocked.session, blocker.user.id)
        })

        it(`Should let the blocker still view the user they blocked`, async function() {
            // The gate only fires when the CALLER is the `relationId` (the
            // blocked party).  The blocker is the `userId`, so they pass.
            await assertCanViewUser(blocker.session, { ...blocked.fixture, id: blocked.user.id })
        })

        it(`Should still return the block in relations for the blocker`, async function() {
            const response = await getUser(blocker.session, blocked.user.id)

            assert.equal(response.status, 200)

            const relationships = Object.values(response.content.relations.userRelationships)
            assert.equal(relationships.length, 1)
            assert.equal(relationships[0].status, 'blocked')
            assert.equal(relationships[0].userId, blocker.user.id)
            assert.equal(relationships[0].relationId, blocked.user.id)
        })

        it(`Should NOT affect a third party's view of the blocker`, async function() {
            await assertCanViewUser(thirdParty.session, { ...blocker.fixture, id: blocker.user.id })
        })

        it(`Should NOT affect a third party's view of the blocked user`, async function() {
            await assertCanViewUser(thirdParty.session, { ...blocked.fixture, id: blocked.user.id })
        })

        it(`Should still let a blocked user view their own profile`, async function() {
            // Gate 2 is skipped entirely for a self-view.
            await assertCanViewUser(blocked.session, { ...blocked.fixture, id: blocked.user.id })
        })

        describe('when the blocked user is a site moderator', function() {
            // Site moderators skip gate 2 outright.  Note that nothing stops a
            // user from *creating* the block -- canCreateUserRelationship() has
            // no site-role carve-out, despite the comment in parseQuery()
            // claiming site moderators can't be blocked.  The block row exists;
            // getUser() just ignores it.
            let moderator

            before(async function() {
                moderator = await loginAs('user-site-moderator')

                await deleteRelationship(thirdParty.session, thirdParty.user.id, moderator.user.id)
                await blockUser(thirdParty.session, thirdParty.user.id, moderator.user.id)
            })

            after(async function() {
                await deleteRelationship(thirdParty.session, thirdParty.user.id, moderator.user.id)
                await logout(moderator.session)
            })

            it(`Should let a site moderator view a user who blocked them`, async function() {
                await assertCanViewUser(moderator.session, { ...thirdParty.fixture, id: thirdParty.user.id })
            })
        })
    })

    // ======================================================================
    // Account status (gate 4).
    //
    // The lookup filters `users.status != 'invited'` and nothing else.
    // ======================================================================

    describe('Account status', function() {
        let viewer, admin
        let invitedUserId = null
        let bannedUserId = null

        before(async function() {
            viewer = await loginAs('user1')
            admin = await loginAs('user-site-admin')

            // Neither of these fixtures can authenticate -- a banned user is
            // rejected by AuthenticationService and an invited user has no
            // password -- so their ids come from the admin query, which is the
            // only lookup that skips the banned/invited status filter.
            invitedUserId = await findUserIdByUsernameAsAdmin(admin.session, userDictionary['user-invited'].username)
            bannedUserId = await findUserIdByUsernameAsAdmin(admin.session, userDictionary['user-banned'].username)
        })

        after(async function() {
            await logout(viewer.session)
            await logout(admin.session)
        })

        it(`Should return 404 for an invited user`, async function() {
            await assertNotFound(viewer.session, invitedUserId)
        })

        it(`Should return 404 for an invited user even for a site moderator`, async function() {
            // Gate 4 has no moderator carve-out -- the status filter is baked
            // into the WHERE clause, not into a permission check.
            const moderator = await loginAs('user-site-moderator')
            try {
                await assertNotFound(moderator.session, invitedUserId)
            } finally {
                await logout(moderator.session)
            }
        })

        it(`Should return an unconfirmed user`, async function() {
            // 'unconfirmed' is NOT filtered -- only 'invited' is.  A registered
            // user who never clicked their confirmation link is a browsable
            // account.
            const unconfirmed = await loginAs('user-unconfirmed')
            try {
                await assertCanViewUser(viewer.session, { ...unconfirmed.fixture, id: unconfirmed.user.id })
            } finally {
                await logout(unconfirmed.session)
            }
        })

        // SUSPECTED BUG -- left skipped because the intended behavior is
        // genuinely ambiguous.
        //
        // parseQuery() hides banned users from GET /users for every non-admin
        // caller (`users.status != 'banned' AND users.status != 'invited'`),
        // but getUser()'s lookup filters ONLY 'invited'.  So a banned profile
        // is unfindable through search yet fully readable by direct id.
        //
        // Either reading is defensible: hiding them everywhere is consistent
        // with the query endpoint, while keeping them readable avoids breaking
        // the UI wherever a banned user's surviving posts or comments still
        // need an author to render.  Per "assume it's a bug, skip if unsure",
        // this asserts the 404 and stays skipped.  Current behavior is 200.
        it(`Should return 404 for a banned user`, async function(t) {
            t.skip(`getUser() filters only 'invited' while parseQuery() also filters 'banned'; intended behavior is ambiguous.`)
            return
            // eslint-disable-next-line no-unreachable
            await assertNotFound(viewer.session, bannedUserId)
        })
    })

    // ======================================================================
    // Site moderation (gate 5) -- feat-408-flag-profiles-and-groups.
    //
    // Only a moderation whose status is 'rejected' hides a profile, and it
    // hides it with a 403 rather than a 404.
    //
    // NOTE: getUser() also throws a 404 when `user.siteModerationId` is set but
    // the moderation row cannot be loaded.  That branch is unreachable --
    // schema.sql adds `users_site_moderation_id_fkey ... ON DELETE SET NULL`,
    // so the column can never dangle -- and so has no test here.
    // ======================================================================

    describe('Site moderation', function() {
        let viewer, moderator

        before(async function() {
            if ( ! flagProfilesEnabled ) return
            viewer = await loginAs('user1')
            moderator = await loginAs('user-site-moderator')
        })

        after(async function() {
            if ( ! flagProfilesEnabled ) return
            await logout(viewer.session)
            await logout(moderator.session)
        })

        it(`Should return a user whose profile is flagged but not rejected`, async function(t) {
            if ( ! flagProfilesEnabled ) { t.skip(`${FLAG_PROFILES_FEATURE} feature is not enabled`); return }
            // The control case: a 'flagged' moderation must not hide anything.
            const flagged = await loginAs('user-flagged')
            try {
                await assertCanViewUser(viewer.session, { ...flagged.fixture, id: flagged.user.id })
            } finally {
                await logout(flagged.session)
            }
        })

        it(`Should NOT let a stranger view a rejected profile`, async function(t) {
            if ( ! flagProfilesEnabled ) { t.skip(`${FLAG_PROFILES_FEATURE} feature is not enabled`); return }
            const rejected = await loginAs('user-rejected')
            try {
                await assertNotAuthorized(viewer.session, rejected.user.id)
            } finally {
                await logout(rejected.session)
            }
        })

        it(`Should let a site moderator view a rejected profile`, async function(t) {
            if ( ! flagProfilesEnabled ) { t.skip(`${FLAG_PROFILES_FEATURE} feature is not enabled`); return }
            const rejected = await loginAs('user-rejected')
            try {
                await assertCanViewUser(moderator.session, { ...rejected.fixture, id: rejected.user.id })
            } finally {
                await logout(rejected.session)
            }
        })

        it(`Should let a rejected user still view their own profile`, async function(t) {
            if ( ! flagProfilesEnabled ) { t.skip(`${FLAG_PROFILES_FEATURE} feature is not enabled`); return }
            // A rejected profile does not change `users.status`, so the account
            // can still authenticate and read itself.
            const rejected = await loginAs('user-rejected')
            try {
                await assertCanViewUser(rejected.session, { ...rejected.fixture, id: rejected.user.id })
            } finally {
                await logout(rejected.session)
            }
        })

        it(`Should still disclose a rejected user's own email to themselves`, async function(t) {
            if ( ! flagProfilesEnabled ) { t.skip(`${FLAG_PROFILES_FEATURE} feature is not enabled`); return }
            // Gate 5 passing for a self-view must not quietly downgrade the
            // field projection from gate 3.
            const rejected = await loginAs('user-rejected')
            try {
                const response = await getUser(rejected.session, rejected.user.id)

                assert.equal(response.status, 200)
                assert.equal(response.content.entity.email, rejected.fixture.email)
            } finally {
                await logout(rejected.session)
            }
        })
    })

    // ======================================================================
    // Relations.
    //
    // getRelations() returns { files, mutuals, userRelationships }.  The
    // relationship query pulls rows the caller created (any status, blocks
    // included) plus rows created by the target that are not blocks.
    // ======================================================================

    describe('Relations', function() {
        let viewer, target

        before(async function() {
            viewer = await loginAs('user1')
            target = await loginAs('user2')
            await deleteRelationship(viewer.session, viewer.user.id, target.user.id)
        })

        after(async function() {
            await deleteRelationship(viewer.session, viewer.user.id, target.user.id)
            await logout(viewer.session)
            await logout(target.session)
        })

        it(`Should return an empty userRelationships dictionary for a stranger`, async function() {
            const response = await getUser(viewer.session, target.user.id)

            assert.equal(response.status, 200)
            assert.deepEqual(response.content.relations.userRelationships, {})
        })

        it(`Should return an empty userRelationships dictionary for a self-view`, async function() {
            const response = await getUser(viewer.session, viewer.user.id)

            assert.equal(response.status, 200)
            assert.deepEqual(response.content.relations.userRelationships, {})
        })

        it(`Should return a pending friend request in relations`, async function() {
            try {
                await sendFriendRequest(viewer.session, viewer.user.id, target.user.id)

                const response = await getUser(viewer.session, target.user.id)

                assert.equal(response.status, 200)

                const relationships = Object.values(response.content.relations.userRelationships)
                assert.equal(relationships.length, 1)
                assert.equal(relationships[0].status, 'pending')
                assert.equal(relationships[0].userId, viewer.user.id)
                assert.equal(relationships[0].relationId, target.user.id)
            } finally {
                await deleteRelationship(viewer.session, viewer.user.id, target.user.id)
            }
        })

        it(`Should return a confirmed friendship in relations`, async function() {
            try {
                await makeFriends(viewer.session, viewer.user.id, target.session, target.user.id)

                const response = await getUser(viewer.session, target.user.id)

                assert.equal(response.status, 200)

                const relationships = Object.values(response.content.relations.userRelationships)
                assert.equal(relationships.length, 1)
                assert.equal(relationships[0].status, 'confirmed')
            } finally {
                await deleteRelationship(viewer.session, viewer.user.id, target.user.id)
            }
        })

        it(`Should return a confirmed friendship in relations for the recipient too`, async function() {
            // The recipient did not create the row, so they match the second
            // half of the OR in getRelations()' query.
            try {
                await makeFriends(viewer.session, viewer.user.id, target.session, target.user.id)

                const response = await getUser(target.session, viewer.user.id)

                assert.equal(response.status, 200)

                const relationships = Object.values(response.content.relations.userRelationships)
                assert.equal(relationships.length, 1)
                assert.equal(relationships[0].status, 'confirmed')
            } finally {
                await deleteRelationship(viewer.session, viewer.user.id, target.user.id)
            }
        })

        it(`Should return an empty files dictionary for a user with no profile picture`, async function() {
            const response = await getUser(viewer.session, target.user.id)

            assert.equal(response.status, 200)
            assert.deepEqual(response.content.relations.files, {})
        })

        it(`Should return a mutuals dictionary when mutual friends are enabled`, async function(t) {
            if ( ! mutualFriendsEnabled ) { t.skip(`${MUTUAL_FRIENDS_FEATURE} feature is not enabled`); return }

            const response = await getUser(viewer.session, target.user.id)

            assert.equal(response.status, 200)
            assert.equal(typeof response.content.relations.mutuals, 'object')
            assert.notEqual(response.content.relations.mutuals, null)
        })
    })
})
