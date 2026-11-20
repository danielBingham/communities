# Database

How the PostgreSQL database is set up: locally, and on staging by the
helper image. The schema itself is `database/initialization-scripts/schema.sql`;
schema and data changes are migrations, which live in the backend package
(see [Add a Database Migration](../how-to/add-a-database-migration.md)).

**Code:** `database/`

| File | Read it when |
| ---- | ------------ |
| [initialization.md](initialization.md) | Setting up a database, changing the initialization scripts, or updating `schema.sql`. |
| [helper-image.md](helper-image.md) | Changing the database helper image or its scripts. |
