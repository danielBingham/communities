# Manual Testing

## `test-runs`:  Running Manual Tests

This document describes the process for running manual regression tests.  The
full process depends on the context: feature testing vs release testing, smoke
test vs manual regression vs full regression.

### Setting up the Run

To set up a test run, first you will create a directory under `test-runs/`
where you will create the scaffold for the run.

If you are testing a feature, create a directory under `test-runs/features/`
named for the feature, eg. `test-runs/features/test-548-integration-tests/`.

If you are testing a release, create a directory under `test-runs/releases/`
named for the release, eg. `test-runs/releases/release-0.22.0/`.

All processes rely on the `test-index.md` as the guide for cases.  In all
processes, you will make one copy of the `test-index.md` for each target under
test into the run's directory.

You will then use the `test-index.md` as a scaffold to copy the test cases
belonging to the suite you are running (Smoke Test, Manual Regression, or Full
Regression) into.

### Usage

When running the test cases in a suite, you can use different markings to
indicate the status of an individual case:

- **Completed Test Case**: mark checkbox with `x`
- **Partially Completed Test Case**: mark checkbox with `/`
- **Skipped Test Case**: mark checkbox `-`

Where applicable explain the state of the item and the reasoning for leaving it
in that state.

### Migrations

If you migrated your database as part of development, rollback those migrations
prior to completing this step.

- [ ] As Administrator, run any migrations associated with this release or feature.
- [ ] As Administrator, create content associated with those migrations. Confirm content creates.
- [ ] As Administrator, rollback the migrations. Confirm migrations rollback cleanly.
- [ ] As Administrator, run migrations forward again. Confirm migrations successfully run forwards.

### Test Suites

The three test suites we maintain have different processes, from least involved
to most involved.

#### Smoke Test

The Smoke Test suite is the least involved test suite, and should be suitable
for most releases or features (with additional testing targeting the specific
changes going out in a release or feature).

To create the scaffold for a smoke test, copy the `test-index.md` file to the
following places:

- `desktop/chrome.md`
- `mobile/ios/app.md`
- `mobile/android/app.md`

For migrations during a smoke test, test only the code directly affected by the
migration, before and after.

#### Manual Regression

The manual regression is more complete than the smoke test, but still less
involved than the Full Regression. It should be run before major version
releases.

To create the scaffold for a Manual Regression, copy the `test-index.md` file
to the following places in your run directory:

- `desktop/chrome.md`
- `desktop/firefox.md`
- `desktop/safari.md`
- `mobile/ios/app.md`
- `mobile/android/app.md`

For migrations, test only the code directly affected by the migration, before
and after.

#### Full Regression

A full regression test involves running every single test case on every single
environment we support.  This is extremely time consuming and should only be
under taken when there's a very good reason.  Most of the time it will be
overkill.

To create the scaffold for a full regression, copy the `test-index.md` file to
the following places:

- `desktop/chrome.md`
- `desktop/firefox.md`
- `desktop/safari.md`
- `mobile/ios/app.md`
- `mobile/ios/safari.md`
- `mobile/android/app.md`
- `mobile/android/chrome.md`

This is the full list of browsers and apps we support.  Each context we support
gets its own copy of the test index.

##### Pre-Migration

If this release includes any feature flags or migrations, rollback your
database to a pre-migration state and run a full regression to confirm the
feature flags work.

- [ ] Rollback any migrations associated with this release.

- [ ] Run a full regression.
    - [ ] Run a full regression on each of the major Desktop browsers:
        - [ ] On desktop [Chrome](desktop/chrome.md)
        - [ ] On desktop [Firefox](desktop/firefox.md)
        - [ ] On desktop [Safari](desktop/safari.md)
    - [ ] Run a full regression on each of the major Mobile contexts:
        - [ ] On IOS [App](mobile/ios/app.md)
        - [ ] On IOS [Safari](mobile/ios/safari.md)
        - [ ] On Android [App](mobile/android/app.md)
        - [ ] On Android [Chrome](mobile/android/chrome.md)

##### Post-migration

- [ ] Run any migrations associated with this release.

- [ ] Run a full regression post-migration (if applicable) to confirm feature
    works.
    - [ ] Run a full regression on each of the major Desktop browsers:
        - [ ] On desktop [Chrome](desktop/chrome.md)
        - [ ] On desktop [Firefox](desktop/firefox.md)
        - [ ] On desktop [Safari](desktop/safari.md)
    - [ ] Run a full regression on each of the major Mobile browsers:
        - [ ] On IOS [App](mobile/ios/app.md)
        - [ ] On IOS [Safari](mobile/ios/safari.md)
        - [ ] On Android [App](mobile/android/app.md)
        - [ ] On Android [Chrome](mobile/android/chrome.md)


## `test-cases`: Manual Test Case Definitions

This directory includes definitions for our manual test cases.  The test cases
are organized primarily by Entity (Controller/Model) and Action (CRUD action).
For certain Entities, the Action isn't the organizing priciple of the test
cases, and some other grouping is used.  Or else, other groupings are
introduced beneath the action.

Each file describes the tests covered with in, contains any pre-requisites for
them, and then has three sections of test cases: "Smoke Test", "Manual
Regression", and "Full Regression".

### Test Case Definition File

The Test Case Definition file defines all of the test cases that involve
performing `Action` on `Entity` (or other groupings defined as necessary).

The header names the file by `Entity` and `Action` and links back to the file
(so that it can be copied and pased into a smoke test or regression file).

The file contains three primary sections that define the different overarching
suites of tests.

The remaining three sections, **Smoke Test**, **Manual Regression**, **Full
Regression** define the test cases for each of the three suites we might choose
to run.

Tests are only defined in one of the three suites, never duplicated, and each
suite builds on its predecessor.  So a true Full Regression test requires
running all the tests in Smoke Test, all the tests in Manual Regression, and
all the tests in Full Regression.

- **Smoke Test**: These are the core interface and security tests covering the
    most heavily used and critical parts of the app.  The full Smoke Test suite
    is designed to be completed in a day or less of testing and to cover the
    most critical parts of the app.
- **Manual Regression**: The manual regression suite covers all of the
    regression tests not in Smoke Test and not covered by our automated Integration (API) testing.
    These are either UI tests that the Integration tests cannot cover or they are
    tests that we haven't automated in the Integration suite.  The Smoke Test + Manual
    Regression + the Integration suite makes for a Full Regression
    of the platform.
- **Full Regression**: These are the manual versions of the tests that have
    been automated in our Integration (API) testing suite.  They are defined here
    for cases where we want to run a full manual regression to manually validate
    that our Integration testing suite is correct.  To run a rull manual
    regression, all cases from all three sections (Smoke Test, Manual Regression,
    and Full Regression) must be run.

The `Pre-requisites` section of each suite defines any necessary pre-reqs, such
as ensuring users have been created for each role that will be required by the
test cases.

Test cases under the suites can be organized into subsections based on their logical
groupings (the features they touch on).


Individual test cases are defined as a checkbox list `- [ ]` and come in two flavors.

#### Feature cases

Test cases that test a particular feature are defined as a user story (`As a
user, I can...`).

Beneath the case is a bulleted list of instructions describing which User
(defined in the `Pre-requisites` section) to act as, what actions to take, and
what the expected outcomes of those actions are.  Each layer of that list
should be further intented with the `User to act as` being the outer most
intented, the `action to take` being the next, and `the expected outcome` being
the intermost (and bolded).

**Example Case Definition**:
```
- [ ] As a user, I can do the action this test case describes.
    - As user who should execute the action:
        - Perform an action.
            - **Confirm the expected outcome of the acton.**
        - Perform a second action.
            - **Confirm the expected outcome of the second action.**
    - As a different user who should execute additional actions:
        - Perform an action.
            - **Confirm the expected outcome of the action.**
```

#### Permission Cases

Test cases that define the permission matrix for a feature are defined very
simply, describing only the user type and the action they are or are not
allowed to take, with the action bolded.  This is to allow permission matrices
to be defined quickly and succinctly.

**Example Case Definition**:
```
- [ ] A user **can** view a public post.
- [ ] A friend of user **can** view user's private post.
- [ ] A non-friend of user **cannot** view user's private post.
```

#### Noting Coverage

If tests have additional coverage in our automated tests suites, they are
marked as such parenthetically, eg. `(covered: e2e, integration)`.

#### Example Test Case Definitions

Here is an example (truncated) test file giving an idea of how it is organized.

```
## [Authentication](documentation/testing/test-cases/Authentication/authentication.md)

Cases covering the authentication system, logging in, logging out, reset
password flow, etc.

### Smoke Test

#### Pre-requisites

- [ ] User1 has been registered.

#### Log in

- [ ] As a user, I can log in through the splash page.
    - As unauthenticated user:
        - Go to the root `/` page.
        - Enter User1's email and password into the login form.
            - **Confirm authentication by navigating, posting, viewing some posts.**
        - Log out.

### Manual Regression

#### Pre-requisites

- [ ] User1 has been registered.

#### Log in

- [ ] As a user, I can log in through the Login page.
    - As unauthenticated user:
        - Go to the `/login` page.
        - Enter User1's email and password.
            - **Confirm authentication by navigating, posting, viewing some posts.**
        - Log out.

### Full Regression

#### Pre-requisites

- [ ] User1 has been registered.

#### Log in

- [ ] As a user, I get temporarily locked out after too many attempts. (covered: integration)
    - As User1:
        - Attempt to login with the wrong pasword 10 times.
        - Confirm locked out.
        - Wait 15 minutes.
        - Login with correct password.
        - Confirm logged in.

- [ ] As a user, I can only log in with the correct password. (covered: integration)
    - As unauthenticated user:
        - Attempt to log in with User1's email and incorrect password.
            - **Confirm login fails.**

- [ ] As a user, log in doesn't reveal whether an account with that email exists. (covered: integration)
    - As unauthenticated user:
        - Attempt to log in with an email not associated to an account.
        - Attempt to log in with User1's email and incorrect password.
            - **Confirm both failures give same message.**

```
