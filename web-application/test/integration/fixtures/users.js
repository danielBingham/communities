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
 * Create these accounts, or put them back the way they're described here, by
 * running the seed before the tests (see ../README.md):
 *
 *   npm run test:integration:seed
 *
 * The seed (../seed.js) writes them straight to the database. Unless a fixture
 * says otherwise, each one is a confirmed account with the site role 'user',
 * the password below, email notifications off, and 'info' and 'announcement'
 * posts hidden from its feed (so we have a blank slate for post testing).
 *
 * A fixture says otherwise with:
 *
 *   status          'unconfirmed', 'invited' or 'banned'
 *   siteRole        'moderator' or 'admin'
 *   siteModeration  a moderation of its profile: { status, flaggedBy }
 *   multifactor     'enabled'
 *
 * Seeding again also undoes anything a test run left behind on these
 * accounts: failed login attempts, privacy settings, other settings and
 * profile pictures.
 * ****************************************************************************/

const dictionary = {
  // ==========================================================================
  // user1 - A standard user
  // ==========================================================================
  'user1': {
    name: 'Test User1',
    username: 'test-user1',
    email: 'communities-test-user1@mailinator.com',
    password: 'PasswordPassword',
  },

  // ==========================================================================
  // user2 - A standard user
  // ==========================================================================
  'user2': {
    name: 'Test User2',
    username: 'test-user2',
    email: 'communities-test-user2@mailinator.com',
    password: 'PasswordPassword',
  },

  // ==========================================================================
  // user3 - A standard user
  // ==========================================================================
  'user3': {
    name: 'Test User3',
    username: 'test-user3',
    email: 'communities-test-user3@mailinator.com',
    password: 'PasswordPassword',
  },

  // ==========================================================================
  // user4 - A standard user
  // ==========================================================================
  'user4': {
    name: 'Test User4',
    username: 'test-user4',
    email: 'communities-test-user4@mailinator.com',
    password: 'PasswordPassword',
  },

  // ==========================================================================
  // user5 - A standard user
  //
  // Role in the GroupPost read suite: a PARENT-group moderator only -- added as
  // a moderator of top-level groups but never a member of their subgroups.
  // ==========================================================================
  'user5': {
    name: 'Test User5',
    username: 'test-user5',
    email: 'communities-test-user5@mailinator.com',
    password: 'PasswordPassword',
  },

  // ==========================================================================
  // user6 - A standard user
  //
  // Role in the GroupPost read suite: a PARENT-group member only -- added as a
  // plain member of top-level groups but never a member of their subgroups.
  // ==========================================================================
  'user6': {
    name: 'Test User6',
    username: 'test-user6',
    email: 'communities-test-user6@mailinator.com',
    password: 'PasswordPassword',
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
    username: 'test-user7',
    email: 'communities-test-user7@mailinator.com',
    password: 'PasswordPassword',
  },

  // ==========================================================================
  // user8 - A standard user
  //
  // Role in the GroupPost read suite: an INVITED (pending) member of a subgroup
  // who is NOT a member of the parent group.
  // ==========================================================================
  'user8': {
    name: 'Test User8',
    username: 'test-user8',
    email: 'communities-test-user8@mailinator.com',
    password: 'PasswordPassword',
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
    username: 'test-user9',
    email: 'communities-test-user9@mailinator.com',
    password: 'PasswordPassword',
  },

  // NOTE: user10 -- communities-test-user10@mailiantor.com is actually
  // user-site-admin below.  Mailinator would not accept
  // `communities-test-user-site-admin@mailinator.com` and returned a hard
  // bounce to any email sent to that address.  So we used this one instead.

  // ==========================================================================
  // user-banned -- A dedicated *banned* user.
  // ==========================================================================
  'user-banned': {
    name: 'Test User Banned',
    username: 'test-user-banned',
    email: 'communities-test-user-banned@mailinator.com',
    password: 'PasswordPassword',
    status: 'banned',
  },

  // ==========================================================================
  // user-mfa -- A user with multi-factor authentication ENABLED.
  //
  // The seed turns multi-factor authentication on without giving the account
  // a secret, so logging in stops at the pending step -- which is all the
  // tests that use it need.  The skipped TOTP tests in
  // patchAuthentication.spec.js would need a real secret.  If the account
  // already has one (from enrolling an authenticator app by hand), the seed
  // leaves it alone.
  // ==========================================================================
  'user-mfa': {
    name: 'Test User MFA',
    username: 'test-user-mfa',
    email: 'communities-test-user-mfa@mailinator.com',
    password: 'PasswordPassword',
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
  // This account will normally be left in a LOCKED state after the suite runs.
  // That is expected and self-healing:
  //   - Re-running the suite within 15 minutes still passes (the test tolerates
  //     an already-locked account).
  //   - After 15 minutes the counter resets on the next attempt and the test
  //     locks it again.
  // Nothing else depends on this account being unlocked. Seeding again unlocks
  // it.
  // ==========================================================================
  'user-lockout': {
    name: 'Test User Lockout',
    username: 'test-user-lockout',
    email: 'communities-test-user-lockout@mailinator.com',
    password: 'PasswordPassword',
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
    username: 'test-user-unconfirmed',
    email: 'communities-test-user-unconfirmed@mailinator.com',
    password: 'PasswordPassword',
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
  // The suite restores the original value after each group, so this account
  // should normally be found at its defaults.  If a run dies mid-way, seeding
  // again puts them back.
  // ==========================================================================
  'user-privacy': {
    name: 'Test User Privacy',
    username: 'test-user-privacy',
    email: 'communities-test-user-privacy@mailinator.com',
    password: 'PasswordPassword',
  },

  // ==========================================================================
  // user-site-moderator -- A SITE MODERATOR.
  // ==========================================================================
  'user-site-moderator': {
    name: 'Test User Site Moderator',
    username: 'test-user-site-moderator',
    email: 'communities-test-user-site-moderator@mailinator.com',
    password: 'PasswordPassword',
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
    username: 'test-user-site-admin',
    email: 'communities-test-user10@mailinator.com', // Mailinator would not accept `communities-test-user-site-admin`
    password: 'PasswordPassword',
    siteRole: 'admin',
  },

  // ==========================================================================
  // user-invited -- A user with status 'invited' who has never accepted.
  //
  // `GET /user/:id` filters on `users.status != 'invited'`, so this account
  // must exist in the invited state permanently.  It CANNOT log in (an invited
  // user has no password set), so it is only ever a *target* in tests; its id
  // is resolved through the 'user-site-admin' fixture.
  //
  // A real invited user hasn't chosen a name or username yet.  The seed gives
  // this one both, so the suite can find it by username.
  // ==========================================================================
  'user-invited': {
    name: 'Test User Invited',
    username: 'test-user-invited',
    email: 'communities-test-user-invited@mailinator.com',
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
  // Set up directly in the database rather than through the API because
  // SiteModeration has no DELETE endpoint (it returns 501), so an
  // API-created flag could not be torn down and the suite would not be
  // re-runnable.
  // ==========================================================================
  'user-flagged': {
    name: 'Test User Flagged',
    username: 'test-user-flagged',
    email: 'communities-test-user-flagged@mailinator.com',
    password: 'PasswordPassword',
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
  // Set up directly in the database for the same reason as 'user-flagged':
  // SiteModeration cannot be deleted through the API.
  //
  // NOTE: these tests only run when the `feat-408-flag-profiles-and-groups`
  // feature flag is enabled; they skip themselves otherwise.
  // ==========================================================================
  'user-rejected': {
    name: 'Test User Rejected',
    username: 'test-user-rejected',
    email: 'communities-test-user-rejected@mailinator.com',
    password: 'PasswordPassword',
    siteModeration: { status: 'rejected', flaggedBy: 'user1' },
  }
}

module.exports = dictionary
