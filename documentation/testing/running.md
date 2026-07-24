# Running Manual Tests

This document describes the process for running manual regression tests.  The
full process depends on the context: feature testing vs release testing, smoke
test vs manual regression vs full regression.

## Setting up the Run

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

## Usage

When running the test cases in a suite, you can use different markings to
indicate the status of an individual case:

- **Completed Test Case**: mark checkbox with `x`
- **Partially Completed Test Case**: mark checkbox with `/`
- **Skipped Test Case**: mark checkbox `-`

Where applicable explain the state of the item and the reasoning for leaving it
in that state.

## Migrations

If you migrated your database as part of development, rollback those migrations
prior to completing this step.

- [ ] As Administrator, run any migrations associated with this release or feature.
- [ ] As Administrator, create content associated with those migrations. Confirm content creates.
- [ ] As Administrator, rollback the migrations. Confirm migrations rollback cleanly.
- [ ] As Administrator, run migrations forward again. Confirm migrations successfully run forwards.

## Test Suites

The three test suites we maintain have different processes, from least involved
to most involved.

### Smoke Test

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

### Manual Regression

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

### Full Regression

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

#### Pre-Migration

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

#### Post-migration

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

