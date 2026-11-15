# Glossary

Terms used across the code and these docs.

## Data and Requests

| Term | Meaning |
| ---- | ------- |
| **Entity** | A kind of thing the platform stores and serves: `User`, `Post`, `PostComment`, `Group`, `GroupMember` and so on. Each has a table, a DAO, usually a controller, and a slice in the client. Names are singular PascalCase. |
| **DAO** | A data access object (`PostDAO`): the class that reads and writes one entity's tables. See [DAOs](backend/daos.md). |
| **Dictionary** | Entities keyed by id: `{ [id]: entity }`. DAOs return them, the API sends them, and client slices store them. |
| **List** | An ordered array of ids, the result of a query, pointing into a dictionary. |
| **Meta** | Paging information for a query: `count`, `page`, `pageSize`, `numberOfPages`. |
| **Relations** | Other entities a response includes because the client will need them (a post's author, its comments), keyed by slice name: `{ users: { [id]: user } }`. |
| **Query** | In the client, a named result stored in a slice's `queries`, with its `meta` and `list`; usually named for the URL of the request that made it. |
| **Core** | The object holding the logger, database, Redis, queues, events, config and feature flags, passed to every controller, service and job. See [Core](backend/core.md). |
| **Driver** | A pluggable implementation of email, storage or push, chosen by configuration (`log`, `filesystem`, `s3`, `postmark`, ...). |

## Users and Roles

| Term | Meaning |
| ---- | ------- |
| **Status** (user) | `invited` (invited, hasn't registered), `unconfirmed` (registered, email not confirmed), `confirmed`, or `banned`. |
| **Site role** | A user's role on the whole platform: `user`, `moderator`, `admin` or `superadmin`. |
| **Group role** | A member's role in a group: `member`, `moderator` or `admin`. |
| **Group member status** | `pending-invited`, `pending-requested`, `member` or `banned`. |
| **Relationship** | A `UserRelationship` between two users: `pending` (a friend request), `confirmed` (friends) or `blocked`. |
| **Mutuals** | Friends two users have in common, kept up to date by worker jobs. |
| **Privacy** | Who can see a user's profile and friends: `me`, `friends`, `friends-of-friends` or `public`. |

## Content

| Term | Meaning |
| ---- | ------- |
| **Post type** | Where a post lives: `feed`, `group`, `event`, `announcement` (from admins, shown to everyone) or `info`. |
| **Visibility** | `public` or `private` (friends, or group members). |
| **Group type** | `open`, `private` or `hidden`. A subgroup can also be `private-open`, `hidden-open` or `hidden-private`: the first word says how it treats everyone, the second how it treats members of its parent group. |
| **Post permissions** (group) | Who can post in a group: `anyone`, `members`, `approval` or `restricted`. |
| **Shared post** | A post that shares another post, which it embeds. |
| **Link preview** | A card for a link in a post, made by the server fetching the linked page. |
| **File state** | An upload's progress: `pending`, `processing`, `ready` or `error`. |
| **Site moderation**, **group moderation** | A flag on a post, comment, profile or group, and what moderators decided: `flagged`, `pending`, `approved` or `rejected`. |

## Platform

| Term | Meaning |
| ---- | ------- |
| **Feature flag** | A named feature (`feat-268-comment-reactions`) with a status, which code checks before using it. Its status moves through `created`, `initialized`, `migrated`, `enabled` and `disabled`, and back. See [Feature Flags and Migrations](backend/feature-flags-and-migrations.md). |
| **Migration** | The data and schema changes that go with a feature flag, run forward and back from the admin dashboard. |
| **Queue**, **job** | Bull queues in Redis, and the units of work the worker takes from them (`resize-image`, `send-notifications`, ...). |
| **Platform header** | `X-Communities-Platform`: `web`, `ios`, `android` or `test`. Decides whether the session ID travels in a cookie or the `X-Communities-Auth` header. |
| **Live update** | A new web bundle the mobile apps download without a store release. |

## Testing

| Term | Meaning |
| ---- | ------- |
| **Case file** | A file of manual test cases for one entity and action, in `documentation/testing/test-cases/`. |
| **Smoke Test**, **Manual Regression**, **Full Regression** | The test suites, from quickest to most thorough. See [Testing Strategy](testing/strategy.md). |
| **Covered** | A case automated by the integration (`covered: integration`) or end-to-end (`covered: e2e`) tests. |
| **Fixture user** | An account the integration and end-to-end tests create for a run and delete after (`user1`, `user-site-admin`, ...). |
| **Test run** | A record of a manual run in `documentation/testing/test-runs/`. |
