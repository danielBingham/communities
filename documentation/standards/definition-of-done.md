# Definition of Done

What a complete change includes before it's ready for review. Not every
item applies to every change; go through them all and skip the ones that
don't.

## Code

- [ ] Follows the [code style](code-style.md) and [naming](naming.md)
      conventions, and the patterns of the layer it's in.
- [ ] New source files have the license header.
- [ ] Passes the [security checklist](security.md).
- [ ] Errors follow [Errors and Logging](errors-and-logging.md).
- [ ] Behind a feature flag if it needs a migration or should be turned on
      separately from the release. See
      [Add a Feature Flag](../how-to/add-a-feature-flag.md).

## Database

- [ ] Schema or data changes are a migration, registered under the change's
      feature flag, that runs forward and back cleanly. See
      [Add a Database Migration](../how-to/add-a-database-migration.md).
- [ ] `database/initialization-scripts/schema.sql` matches the schema with
      the migration applied, and inserts the flag as `enabled`.

## Tests

- [ ] Unit tests for new logic in `packages/shared` and `packages/backend`,
      especially permissions and validation.
- [ ] Integration tests for new or changed endpoints, including their
      permissions and errors.
- [ ] End-to-end tests for UI cases that can be automated.
- [ ] Manual test cases added or updated for the behavior, and automated
      cases marked `(covered: ...)`.
- [ ] `npm test` and `npm run check:lockfile` pass, and the integration and
      end-to-end tests touching the change pass locally.

See [Testing Strategy](../testing/strategy.md) for which tests a change
needs.

## Documentation

- [ ] Documentation that describes what changed is updated: a pattern, a
      convention, a configuration value, a command, a feature's behavior.
- [ ] New pieces (an entity, a job, a driver, a notification type) are added
      to the tables that list them.
- [ ] New configuration values are in every configuration file and
      `.env.local.example`.

See [Documentation](documentation.md).

## Dependencies

- [ ] New dependencies are pinned exactly, in the package that uses them,
      and the lockfile check passes. See [Dependencies](dependencies.md).
