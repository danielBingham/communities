# Database

The PostgreSQL database: what's in it, how the schema is written, how it's
set up, and the helper image that sets it up on staging. Migrations live
in the backend package; see
[Feature Flags and Migrations](../backend/feature-flags-and-migrations.md).

**Code:** `database/`

| File | Read it when |
| ---- | ------------ |
| [data-model.md](data-model.md) | Finding the table for something, or how tables relate. |
| [conventions.md](conventions.md) | Adding or changing a table, column, key or index. |
| [initialization.md](initialization.md) | Setting up a database, changing the initialization scripts, or updating `schema.sql`. |
| [helper-image.md](helper-image.md) | Changing the database helper image or its scripts. |
