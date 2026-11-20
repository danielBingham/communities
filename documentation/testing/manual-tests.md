# Running Manual Tests

How to run a manual test run, for a feature or a release. The cases
themselves are in `test-cases/`, and their format is in
[Writing Test Cases](writing-test-cases.md). Which suite to run when is in
[Testing Strategy](strategy.md).

**Code:** `documentation/testing/test-index.md`,
`documentation/testing/test-cases/`, `documentation/testing/test-runs/`

## Setting Up a Run

1. Create the run's directory under `test-runs/`:
   - For a feature: `test-runs/features/<branch name>/`, for example
     `test-runs/features/test-548-integration-tests/`.
   - For a release: `test-runs/releases/version-<version>/`, for example
     `test-runs/releases/version-0.22.0/`.
2. Copy `test-index.md` into the run's directory once for each target the
   suite covers (see [The Suites](#the-suites)), at the path given there.
3. In each copy, under each heading, paste the linked case file's sections
   for the suite you're running. Each suite builds on the one before it, so
   a Manual Regression includes the Smoke Test cases, and a Full Regression
   includes both.

## Marking Results

| Mark | Meaning |
| ---- | ------- |
| `- [x]` | Completed. |
| `- [/]` | Partially completed. |
| `- [-]` | Skipped. |

Where a case isn't completed, say why next to it.

## Migrations

If you migrated your local database during development, roll those
migrations back before you start. Then, as an administrator, from the admin
dashboard's Features page:

- [ ] Run any migrations that belong to the release or feature.
- [ ] Create content that depends on them. Confirm it's created.
- [ ] Roll the migrations back. Confirm they roll back cleanly.
- [ ] Run them forward again. Confirm they succeed.

For a Smoke Test or Manual Regression, test only the code the migration
directly affects, before and after it runs.

## The Suites

| Suite | Targets (copies of `test-index.md`) |
| ----- | ----------------------------------- |
| Smoke Test | `desktop/chrome.md`, `mobile/ios/app.md`, `mobile/android/app.md` |
| Manual Regression | `desktop/chrome.md`, `desktop/firefox.md`, `desktop/safari.md`, `mobile/ios/app.md`, `mobile/android/app.md` |
| Full Regression | `desktop/chrome.md`, `desktop/firefox.md`, `desktop/safari.md`, `mobile/ios/app.md`, `mobile/ios/safari.md`, `mobile/android/app.md`, `mobile/android/chrome.md` |

The Full Regression's targets are every browser and app we support.

Some case files have no Manual Regression section, because their cases are
automated (so far, Post's). From those, run the Smoke Test cases, and the
Full Regression cases that aren't marked as covered.

## Full Regressions with Migrations

If the release includes feature flags or migrations, a Full Regression
runs twice:

1. **Pre-migration.** Roll back the release's migrations and run a Full
   Regression on every target, to confirm the code works with the flags
   off.
2. **Post-migration.** Run the migrations and run a Full Regression on every
   target again, to confirm the features work.

A Full Regression takes a long time; only run one when there's a good
reason.
