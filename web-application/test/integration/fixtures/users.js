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
 * ****************************************************************************/

const dictionary = {
  // ==========================================================================
  // user1 - A standard user
  //
  // Manual setup (run once before running the tests)
  //   1. Register "Test User1" (test-user1 /
  //   communities-test-user1@mailinator.com) through the app.  Set the
  //   account's password to match `password` below. Confirm the account's
  //   email using `mailinator.com`. Once confirmed, make sure to turn email
  //   notifications off (so we don't spam mailinator) and also turn off 'info'
  //   and 'announcement' posts in preferences (so we have a blank slate for
  //   post testing).
  // ==========================================================================
  'user1': {
    name: 'Test User1',
    username: 'test-user1',
    email: 'communities-test-user1@mailinator.com',
    password: 'PasswordPassword',
  },

  // ==========================================================================
  // user2 - A standard user
  //
  // Manual setup (run once before running the tests)
  //   1. Register "Test User2" (test-user2 /
  //   communities-test-user2@mailinator.com) through the app.  Set the
  //   account's password to match `password` below. Confirm the account's
  //   email using `mailinator.com`. Once confirmed, make sure to turn email
  //   notifications off (so we don't spam mailinator) and also turn off 'info'
  //   and 'announcement' posts in preferences (so we have a blank slate for
  //   post testing).
  // ==========================================================================
  'user2': {
    name: 'Test User',
    username: 'test-user2',
    email: 'communities-test-user2@mailinator.com',
    password: 'PasswordPassword',
  },

  // ==========================================================================
  // user3 - A standard user
  //
  // Manual setup (run once before running the tests)
  //   1. Register "Test User3" (test-user3 /
  //   communities-test-user3@mailinator.com) through the app.  Set the
  //   account's password to match `password` below. Confirm the account's
  //   email using `mailinator.com`. Once confirmed, make sure to turn email
  //   notifications off (so we don't spam mailinator) and also turn off 'info'
  //   and 'announcement' posts in preferences (so we have a blank slate for
  //   post testing).
  // ==========================================================================
  'user3': {
    name: 'Test User3',
    username: 'test-user3',
    email: 'communities-test-user3@mailinator.com',
    password: 'PasswordPassword',
  },

  // ==========================================================================
  // user4 - A standard user
  //
  // Manual setup (run once before running the tests)
  //   1. Register "Test User4" (test-user4 /
  //   communities-test-user4@mailinator.com) through the app.  Set the
  //   account's password to match `password` below. Confirm the account's
  //   email using `mailinator.com`. Once confirmed, make sure to turn email
  //   notifications off (so we don't spam mailinator) and also turn off 'info'
  //   and 'announcement' posts in preferences (so we have a blank slate for
  //   post testing).
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
  // Manual setup (run once before running the tests)
  //   1. Register "Test User5" (test-user5 /
  //   communities-test-user5@mailinator.com) through the app.  Set the
  //   account's password to match `password` below. Confirm the account's
  //   email using `mailinator.com`. Once confirmed, make sure to turn email
  //   notifications off (so we don't spam mailinator) and also turn off 'info'
  //   and 'announcement' posts in preferences (so we have a blank slate for
  //   post testing).
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
  // Manual setup (run once before running the tests)
  //   1. Register "Test User6" (test-user6 /
  //   communities-test-user6@mailinator.com) through the app.  Set the
  //   account's password to match `password` below. Confirm the account's
  //   email using `mailinator.com`. Once confirmed, make sure to turn email
  //   notifications off (so we don't spam mailinator) and also turn off 'info'
  //   and 'announcement' posts in preferences (so we have a blank slate for
  //   post testing).
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
  // Manual setup (run once before running the tests)
  //   1. Register "Test User7" (test-user7 /
  //   communities-test-user7@mailinator.com) through the app.  Set the
  //   account's password to match `password` below. Confirm the account's
  //   email using `mailinator.com`. Once confirmed, make sure to turn email
  //   notifications off (so we don't spam mailinator) and also turn off 'info'
  //   and 'announcement' posts in preferences (so we have a blank slate for
  //   post testing).
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
  // Manual setup (run once before running the tests)
  //   1. Register "Test User8" (test-user8 /
  //   communities-test-user8@mailinator.com) through the app.  Set the
  //   account's password to match `password` below. Confirm the account's
  //   email using `mailinator.com`. Once confirmed, make sure to turn email
  //   notifications off (so we don't spam mailinator) and also turn off 'info'
  //   and 'announcement' posts in preferences (so we have a blank slate for
  //   post testing).
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
  // Manual setup (run once before running the tests)
  //   1. Register "Test User9" (test-user9 /
  //   communities-test-user9@mailinator.com) through the app.  Set the
  //   account's password to match `password` below. Confirm the account's
  //   email using `mailinator.com`. Once confirmed, make sure to turn email
  //   notifications off (so we don't spam mailinator) and also turn off 'info'
  //   and 'announcement' posts in preferences (so we have a blank slate for
  //   post testing).
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

  // ==========================================================================
  // user-banned -- A dedicated *banned* user.
  //
  // Manual setup (run once before running the tests):
  //   1. Register "Test User Banned" (test-user-banned /
  //   communities-test-user-banned@mailinator.com) through the app exactly the way
  //   user1 was created, and confirm the account. Set the password to match
  //   `password` below. Once confirmed, make sure to turn email notifications
  //   off (so we don't spam mailinator) and also turn off 'info' and
  //   'announcement' posts in preferences (so we have a blank slate for post
  //   testing).
  //   2. Ban the account by setting its status to 'banned' directly in the
  //   database:
  //
  //        UPDATE users
  //           SET status = 'banned'
  //         WHERE email = 'communities-test-user-banned@mailinator.com';
  // ==========================================================================
  'user-banned': {
    name: 'Test User Banned',
    username: 'test-user-banned',
    email: 'communities-test-user-banned@mailinator.com',
    password: 'PasswordPassword',
  },

  // ==========================================================================
  // user-mfa -- A user with multi-factor authentication ENABLED.
  //
  // Manual setup (only if enabling the skipped MFA tests):
  //   1. Register "Test User MFA" (test-user-mfa /
  //   communities-test-user-mfa@mailinator.com) and confirm the account. Set the
  //   password to match `password` below. Once confirmed, make sure to turn
  //   email notifications off (so we don't spam mailinator) and also turn off
  //   'info' and 'announcement' posts in preferences (so we have a blank slate
  //   for post testing).
  //   2. Log in and enroll multi-factor authentication using an authenticator
  //   app so that `authentication__multifactor_state` becomes 'enabled'.
  // ==========================================================================
  'user-mfa': {
    name: 'Test User MFA',
    username: 'test-user-mfa',
    email: 'communities-test-user-mfa@mailinator.com',
    password: 'PasswordPassword',
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
  // Nothing else depends on user4 being unlocked. If you ever want it unlocked
  // manually:
  //
  //     UPDATE users
  //        SET failed_authentication_attempts = 0,
  //            last_authentication_attempt_date = NULL
  //      WHERE email = 'communities-test-user4@mailinator.com';
  //
  // Manual setup (run once before the suite):
  //   1. Register "Test User Lockout" (test-user-lockout /
  //   communities-test-user-lockout@mailinator.com) and confirm the account. Set the
  //   password to match `password` below. Once confirmed, make sure to turn
  //   email notifications off (so we don't spam mailinator) and also turn off
  //   'info' and 'announcement' posts in preferences (so we have a blank slate
  //   for post testing).
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
  // Manual setup (run once before running the tests):
  //   1. Register "Test User Unconfirmed" (test-user-unconfirmed /
  //   communities-test-user-unconfirmed@mailinator.com) through the app and set
  //   the account's password to match `password` below.
  //   2. Do NOT confirm the email address.  Newly registered accounts default to
  //   status 'unconfirmed', which is exactly what this fixture needs.
  //   3. Verify (or force) the status directly in the database:
  //
  //        UPDATE users
  //           SET status = 'unconfirmed'
  //         WHERE email = 'communities-test-user-unconfirmed@mailinator.com';
  //
  //   Leave the account unconfirmed permanently -- nothing else depends on it,
  //   and confirming it would silently turn the tests that use it into
  //   duplicates of the ordinary confirmed-user cases.
  // ==========================================================================
  'user-unconfirmed': {
    name: 'Test User Unconfirmed',
    username: 'test-user-unconfirmed',
    email: 'communities-test-user-unconfirmed@mailinator.com',
    password: 'PasswordPassword',
  },

  // ==========================================================================
  // user-site-moderator -- A SITE MODERATOR.
  //
  // Manual setup (run once before running the tests):
  //   1. Register "Test User Site Moderator" (test-user-site-moderator /
  //   communities-test-user-site-moderator@mailinator.com) and confirm the account. Set the
  //   password to match `password` below. Once confirmed, make sure to turn
  //   email notifications off (so we don't spam mailinator) and also turn off
  //   'info' and 'announcement' posts in preferences (so we have a blank slate
  //   for post testing).
  //   2. Grant the account the site 'moderator' role directly in the database:
  //
  //        UPDATE users
  //           SET site_role = 'moderator'
  //         WHERE email = 'communities-test-user-site-moderator@mailinator.com';
  // ==========================================================================
  'user-site-moderator': {
    name: 'Test User Site Moderator',
    username: 'test-user-site-moderator',
    email: 'communities-test-user-site-moderator@mailinator.com',
    password: 'PasswordPassword',
  }
}

module.exports = dictionary
