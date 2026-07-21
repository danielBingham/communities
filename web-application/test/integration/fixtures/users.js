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
  // user2 -- A *banned* user.
  //
  // Manual setup (run once before running the tests):
  //   1. Register "Test User2" (test-user2 /
  //   communities-test-user2@mailinator.com) through the app exactly the way
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
  //         WHERE email = 'communities-test-user2@mailinator.com';
  // ==========================================================================
  'user2': {
    name: 'Test User2',
    username: 'test-user2',
    email: 'communities-test-user2@mailinator.com',
    password: 'PasswordPassword',
  },

  // ==========================================================================
  // user3 -- A user with multi-factor authentication ENABLED.
  //
  // Manual setup (only if enabling the skipped MFA tests):
  //   1. Register "Test User3" (test-user3 /
  //   communities-test-user3@mailinator.com) and confirm the account. Set the
  //   password to match `password` below. Once confirmed, make sure to turn
  //   email notifications off (so we don't spam mailinator) and also turn off
  //   'info' and 'announcement' posts in preferences (so we have a blank slate
  //   for post testing).
  //   2. Log in and enroll multi-factor authentication using an authenticator
  //   app so that `authentication__multifactor_state` becomes 'enabled'.
  // ==========================================================================
  'user3': {
    name: 'Test User3',
    username: 'test-user3',
    email: 'communities-test-user3@mailinator.com',
    password: 'PasswordPassword',
  },

  // ==========================================================================
  // user4 -- A DEDICATED account for the login lockout test.
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
  //   1. Register "Test User4" (test-user4 /
  //   communities-test-user4@mailinator.com) and confirm the account. Set the
  //   password to match `password` below. Once confirmed, make sure to turn
  //   email notifications off (so we don't spam mailinator) and also turn off
  //   'info' and 'announcement' posts in preferences (so we have a blank slate
  //   for post testing).
  // ==========================================================================
  'user4': {
    name: 'Test User4',
    username: 'test-user4',
    email: 'communities-test-user4@mailinator.com',
    password: 'PasswordPassword',
  }
}

module.exports = dictionary
