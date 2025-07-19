# Full Regression Test

This document contains a checklist of test cases to be run during a full
regression of the platform. 

Create a directory under `releases/` named for the release, eg. `release-0.5.0`
and copy the `full-regression` directory into it. 

## Usage

- **Completed Test Case**: mark checkbox with `x` 
- **Partially Completed Test Case**: mark checkbox with `/`
- **Skipped Test Case**: mark checkbox `-`

Where applicable explain the state of the item and the reasoning for leaving it
in that state.

## Migrations

If you migrated your database as part of development, rollback those migrations
prior to completing this step. 

- [x] As Administrator, run any migrations associated with this release.
- [x] As Administrator, create content associated with those migrations. Confirm content creates.
- [x] As Administrator, rollback the migrations. Confirm migrations rollback cleanly.
- [x] As Administrator, run migrations forward again. Confirm migrations successfully run forwards.

## Full Regression

### Pre-Migration

If this release includes any feature flags or migrations, rollback your
database to a pre-migration state and run a full regression to confirm the
feature flags work.

- [-] Rollback any migrations associated with this release.

- [-] Run a full regression.
    - [-] Run a full regression on each of the major Desktop browsers:
        - [-] On desktop [Chrome](desktop/chrome.md)
        - [-] On desktop [Firefox](desktop/firefox.md)
        - [-] On desktop [Safari](desktop/safari.md)
    - [-] Run a full regression on each of the major Mobile browsers:
        - [-] On IOS [Safari](mobile/ios/safari.md)
        - [-] On Android [Chrome](mobile/android/chrome.md)

### Post-migration

- [x] Run any migrations associated with this release.

- [/] Run a full regression post-migration (if applicable) to confirm feature
    works.
    - [/] Run a full regression on each of the major Desktop browsers:
        - [x] On desktop [Chrome](desktop/chrome.md)
        - [x] On desktop [Firefox](desktop/firefox.md)
        - [ ] On desktop [Safari](desktop/safari.md)
    - [ ] Run a full regression on each of the major Mobile browsers:
        - [ ] On IOS [Safari](mobile/ios/safari.md)
        - [ ] On Android [Chrome](mobile/android/chrome.md)

