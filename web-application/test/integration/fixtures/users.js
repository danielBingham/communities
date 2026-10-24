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

/******************************************************************************
 * User Fixtures for use in the integration test suite
 *
 * The users the tests log in as. Each test run creates them all when it
 * starts and deletes them when it ends (setup.js), through the web
 * application's test-only POST /test/user and DELETE /test/user/:id. Nothing
 * is seeded ahead of time, and no password is kept here: each run generates
 * its own.
 *
 * So each entry only describes the account. The run adds the rest, which
 * tests read with getFixture(key) from lib/fixtures.js (loginAs(key) in
 * lib/authentication.js returns it too):
 *
 *   id         from POST /test/user
 *   username   test-<run>-<key>
 *   email      communities-test-<run>-<n>@mailinator.com, n being the
 *              entry's position. The keys stay out of the address because
 *              Mailinator hard-bounced communities-test-user-site-admin@.
 *   password   random, for this run only (none for an invited user)
 *
 * Unless an entry says otherwise, each one is a confirmed account with the
 * site role 'user', email notifications off, and 'info' and 'announcement'
 * posts hidden from its feed (so we have a blank slate for post testing).
 *
 * An entry says otherwise with:
 *
 *   status          'unconfirmed', 'invited' or 'banned'
 *   siteRole        'moderator' or 'admin'
 *   siteModeration  a moderation of its profile: { status, flaggedBy }, where
 *                   flaggedBy is an earlier entry's key
 *   multifactor     'enabled'
 *
 * Every run starts from fresh accounts, so nothing a previous run did to
 * them (failed login attempts, privacy settings, profile pictures) carries
 * over.
 * ****************************************************************************/

const dictionary = {
  // ==========================================================================
  // user1 - A standard user
  // ==========================================================================
  'user1': {
    name: 'Test User1',
  },

  // ==========================================================================
  // user2 - A standard user
  // ==========================================================================
  'user2': {
    name: 'Test User2',
  },

  // ==========================================================================
  // user3 - A standard user
  // ==========================================================================
  'user3': {
    name: 'Test User3',
  },

  // ==========================================================================
  // user4 - A standard user
  // ==========================================================================
  'user4': {
    name: 'Test User4',
  },

  // ==========================================================================
  // user5 - A standard user
  //
  // Role in the GroupPost read suite: a PARENT-group moderator only -- added as
  // a moderator of top-level groups but never a member of their subgroups.
  // ==========================================================================
  'user5': {
    name: 'Test User5',
  },

  // ==========================================================================
  // user6 - A standard user
  //
  // Role in the GroupPost read suite: a PARENT-group member only -- added as a
  // plain member of top-level groups but never a member of their subgroups.
  // ==========================================================================
  'user6': {
    name: 'Test User6',
  },

  // ==========================================================================
  // user7 - A standard user
  //
  // Role in the GroupPost read suite: a NON-member of every group.  Also
  // borrowed transiently by the banned-member cases (added, banned, then
  // removed within a single test).
  // ==========================================================================
  'user7': {
    name: 'Test User7',
  },

  // ==========================================================================
  // user8 - A standard user
  //
  // Role in the GroupPost read suite: an INVITED (pending) member of a subgroup
  // who is NOT a member of the parent group.
  // ==========================================================================
  'user8': {
    name: 'Test User8',
  },

  // ==========================================================================
  // user9 - A standard user
  //
  // Role in the GroupPost read suite: an INVITED (pending) member of a subgroup
  // who IS also a member of the parent group -- the case that distinguishes the
  // "-open" subgroup types (can view via the parent) from the others.
  // ==========================================================================
  'user9': {
    name: 'Test User9',
  },

  // ==========================================================================
  // user-banned -- A dedicated *banned* user.
  // ==========================================================================
  'user-banned': {
    name: 'Test User Banned',
    status: 'banned',
  },

  // ==========================================================================
  // user-mfa -- A user with multi-factor authentication ENABLED.
  //
  // POST /test/user turns multi-factor authentication on without giving the
  // account a secret, so logging in stops at the pending step -- which is all
  // the tests that use it need.  The skipped TOTP tests in
  // patchAuthentication.spec.js would need a real secret.
  // ==========================================================================
  'user-mfa': {
    name: 'Test User MFA',
    multifactor: 'enabled',
  },

  // ==========================================================================
  // user-lockout -- A DEDICATED account for the login lockout test.
  //
  // Why a dedicated user: the lockout test intentionally exhausts the failed
  // login attempt counter (10+ failures within 15 minutes). Once locked,
  // AuthenticationService rejects *even the correct password* with a 429 for
  // the next 15 minutes -- there is no API to clear it early. Isolating this
  // to its own account keeps other users usable by every other test.
  //
  // The account is left LOCKED once the test has run.  Nothing else depends on
  // it being unlocked, and the run deletes it at the end.
  // ==========================================================================
  'user-lockout': {
    name: 'Test User Lockout',
  },

  // ==========================================================================
  // user-unconfirmed -- A user who has registered but has NOT confirmed their
  // email address, so their `status` is still 'unconfirmed'.
  //
  // Why this account exists: PermissionService.can() refuses every action for
  // any user whose status is not exactly 'confirmed'.  A *banned* user can
  // never reach that guard through the API (AuthenticationService rejects them
  // at login, so they can't get a session), but an *unconfirmed* user CAN --
  // only 'banned' is checked during authentication.  This fixture is what makes
  // the `status !== 'confirmed'` branch of can() reachable from an integration
  // test.
  //
  // It has to stay unconfirmed -- confirming it would silently turn the tests
  // that use it into duplicates of the ordinary confirmed-user cases.
  // ==========================================================================
  'user-unconfirmed': {
    name: 'Test User Unconfirmed',
    status: 'unconfirmed',
  },

  // ==========================================================================
  // user-privacy -- The PROFILE OWNER whose privacy configuration is mutated by
  // the getUserRelationships permission suite.
  //
  // Why a dedicated user: GET /user/:userId/relationships gates on the profile
  // owner's OWN `privacy__view_friends` setting.  Exercising that matrix means
  // flipping the value repeatedly, and a test that fails partway can leave the
  // account on a non-default setting.  Doing that to user1 would quietly change
  // the behaviour of every other suite that uses them, so the mutation is
  // isolated to this account instead.
  //
  // The suite restores the original value after each group; the next run
  // starts from a fresh account anyway.
  // ==========================================================================
  'user-privacy': {
    name: 'Test User Privacy',
  },

  // ==========================================================================
  // user-site-moderator -- A SITE MODERATOR.
  // ==========================================================================
  'user-site-moderator': {
    name: 'Test User Site Moderator',
    siteRole: 'moderator',
  },

  // ==========================================================================
  // user-site-admin -- A SITE ADMIN.
  //
  // Distinct from 'user-site-moderator': several endpoints separate the
  // 'moderator' site role from 'admin'/'superadmin'.  In particular
  // `GET /users?admin=true` -- the only way to look up a banned or invited
  // user -- is refused with a 403 for a mere 'moderator'.  The getUser suite
  // uses this account to resolve the ids of fixtures that cannot log in.
  // ==========================================================================
  'user-site-admin': {
    name: 'Test User Site Admin',
    siteRole: 'admin',
  },

  // ==========================================================================
  // user-invited -- A user with status 'invited' who has never accepted.
  //
  // `GET /user/:id` filters on `users.status != 'invited'`, so this account
  // must exist in the invited state permanently.  It CANNOT log in (an invited
  // user has no password set), so it is only ever a *target* in tests; its id
  // comes from POST /test/user.
  //
  // A real invited user hasn't chosen a name or username yet.  This one has
  // both, like every fixture.
  // ==========================================================================
  'user-invited': {
    name: 'Test User Invited',
    status: 'invited',
  },

  // ==========================================================================
  // user-flagged -- A user whose profile carries a FLAGGED (but not rejected)
  // SiteModeration.
  //
  // The control case for the site-moderation branch of `GET /user/:id`: only a
  // moderation with status 'rejected' hides a profile, so this account must
  // remain fully visible to everyone.
  //
  // POST /test/user creates the moderation along with the account rather
  // than the tests going through the API, because SiteModeration has no
  // DELETE endpoint (it returns 501).  Deleting the account at the end of the
  // run deletes the moderation with it.
  // ==========================================================================
  'user-flagged': {
    name: 'Test User Flagged',
    siteModeration: { status: 'flagged', flaggedBy: 'user1' },
  },

  // ==========================================================================
  // user-rejected -- A user whose profile has been REJECTED by site
  // moderators.
  //
  // `GET /user/:id` answers 403 'not-authorized' for anyone but the user
  // themselves and site moderators.  The account is still 'confirmed', so
  // unlike the banned fixture it CAN log in -- which is how the suite learns
  // its id (a rejected profile is filtered out of `GET /users` for every
  // caller, admins included, by the feat-408 clause in parseQuery()).
  //
  // Created along with the account for the same reason as 'user-flagged':
  // SiteModeration cannot be deleted through the API.
  //
  // NOTE: these tests only run when the `feat-408-flag-profiles-and-groups`
  // feature flag is enabled; they skip themselves otherwise.
  // ==========================================================================
  'user-rejected': {
    name: 'Test User Rejected',
    siteModeration: { status: 'rejected', flaggedBy: 'user1' },
  }
}

module.exports = dictionary
