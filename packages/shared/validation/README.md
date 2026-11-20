# Validation (deprecated)

Entity validation in this directory (`entities/`, `validate.js`) is
**deprecated** in favor of the Schema classes in [`../schema`](../schema).
Don't add new entities here; write a Schema instead, and move an entity to
a Schema when its validation needs to change.

The type validators in [`types/`](types) are not deprecated.

See [Shared](../../../documentation/architecture/shared.md#validation-is-moving-to-schemas)
for how to move an entity to a Schema.
