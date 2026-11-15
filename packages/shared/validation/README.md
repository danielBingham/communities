# Validation (deprecated)

Entity validation in this directory (`entities/`, `validate.js`) is
**deprecated** in favor of the Schema classes in [`../schema`](../schema).
Don't add new entities here; write a Schema instead, and move an entity to
a Schema when its validation needs to change.

The type validators in [`types/`](types) are not deprecated.

See [Validation and Cleaning](../../../documentation/shared/validation-and-cleaning.md)
and [Move Validation to a Schema](../../../documentation/how-to/move-validation-to-a-schema.md).
