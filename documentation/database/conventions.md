# Schema Conventions

How tables, columns, keys and indexes are written, for anything you add to
the schema.

**Code:** `database/initialization-scripts/schema.sql`,
`packages/backend/migrations/`

## Tables and Columns

| Convention | Example |
| ---------- | ------- |
| Tables are plural snake_case; child tables are prefixed with the parent. | `posts`, `post_comments`, `group_members` |
| Columns are snake_case. The DAO maps them to camelCase entity properties. | `shared_post_id` → `sharedPostId` |
| Related columns are grouped with a double underscore. | `privacy__view_friends`, `authentication__multifactor_state` |
| Every table has `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` (join tables excepted). | |
| Every table has `created_date timestamptz` and `updated_date timestamptz`, set by the DAO (`now()`). | |
| Fixed sets of values are enum types named for the entity (singular) and column, with kebab-case values. | `CREATE TYPE group_member_status AS ENUM('pending-invited', 'pending-requested', 'member', 'banned')` |
| Flexible, rarely queried data goes in `jsonb`, with a `NOT NULL DEFAULT '{}'`. | `users.settings`, `users.notices` |
| Locations are PostGIS `geography(POINT)`. | `users.location` |

## Keys and Deletion

Foreign keys say what happens when the row they point to is deleted:

| Relationship | `ON DELETE` | Example |
| ------------ | ----------- | ------- |
| The row can't exist without its parent. | `CASCADE`, with `NOT NULL` | A comment when its post is deleted. |
| The row is optionally linked to another. | `SET NULL`, with `DEFAULT NULL` | A post's link preview, a group's picture. |
| An optional link that should still disappear with the parent. | `CASCADE DEFAULT NULL` | A post's group. |

Uniqueness rules the application depends on are constraints, named
`<table>__<columns>_unique`, so a race between two requests fails at the
database rather than creating duplicates:
`CONSTRAINT comment_reactions__comment_id_user_id_unique UNIQUE (comment_id, user_id)`.
Controllers catch the violation (`23505`) and answer as if the earlier check
had caught it.

## Indexes

- Named `<table>__<columns>`: `post_comments__post_id`.
- Index every foreign key you query by, and every column a common query
  filters or sorts on. A unique constraint's index also covers lookups by
  its leading column.
- Text search uses trigram indexes (`pg_trgm`):
  `CREATE INDEX users__name_trgm ON users USING GIN (name gin_trgm_ops)`.

## Changing the Schema

Every change is a migration under a feature flag, and is applied to
`schema.sql` in the same change; see
[Add a Database Migration](../how-to/add-a-database-migration.md). In
migrations, write each statement so it's safe to run again
(`IF NOT EXISTS`, `IF EXISTS`), since the steps aren't in one transaction.

In `schema.sql`, keep each table in its section (the banner comments), with
its indexes right after it, and a comment for anything that isn't obvious.
