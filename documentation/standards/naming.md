# Naming

Names follow the entity through every layer, so you can find an entity's
code anywhere by its name.

## An Entity Across the Layers

For an entity named `Group` (table `groups`):

| Layer | Name | Path |
| ----- | ---- | ---- |
| Table | `groups` | `database/initialization-scripts/schema.sql` |
| DAO | `GroupDAO` | `packages/backend/daos/GroupDAO.js` |
| Schema (shared) | `GroupSchema` | `packages/shared/schema/Group.js` |
| Validation | `GroupValidation` | `packages/backend/services/validation/GroupValidation.js` |
| Permissions | `GroupPermissions` | `packages/backend/services/permission/GroupPermissions.js` |
| Shared permissions | | `packages/shared/permissions/Group/` |
| Service (when there's logic beyond data access) | `GroupService` | `packages/backend/services/GroupService.js` |
| Controller | `GroupController` | `web-application/server/controllers/GroupController.js` |
| Client slice and thunks | `Group` | `web-application/client/state/Group/` |
| Client hooks | `useGroup`, `useGroupQuery` | `web-application/client/lib/hooks/Group/` |
| Components | | `web-application/client/components/groups/` |
| Integration tests | | `web-application/test/integration/suites/GroupController/` |
| Manual test cases | | `documentation/testing/test-cases/Group/` |

Not every entity has every layer (`Post` has no service or Schema yet, for
instance). Entity names are singular PascalCase; a child entity is prefixed
with its parent (`PostComment`, `GroupMember`, `CommentReaction`).

## Data

| What | Convention | Example |
| ---- | ---------- | ------- |
| Tables | Plural snake_case. | `post_comments` |
| Columns | snake_case. | `created_date`, `user_id` |
| Entity properties | camelCase; the DAO maps columns to them. | `createdDate`, `userId` |
| Enum values | kebab-case strings. | `'pending-invited'` |
| Indexes | `<table>__<columns>`. | `blocklist__domain` |

## API and Client

| What | Convention | Example |
| ---- | ---------- | ------- |
| Routes | Plural to query or create, singular with an id for one; children nested under the parent. | `GET /posts`, `PATCH /post/:id`, `POST /post/:postId/comments` |
| Controller methods | HTTP verb plus the route's resource. | `getPosts`, `postPosts`, `getPost`, `patchPost`, `deletePost` |
| Thunks | The same as the controller method they call. | `getPosts(name, params)`, `patchPost(post)` |
| Slice actions | Verb plus entity. | `setPostsInDictionary`, `setPostQueryResults`, `clearPostQuery` |
| Hooks | `use` plus what they return. | `useGroup`, `usePostQuery`, `useRequest` |
| Components | PascalCase; the folder and file share the name. | `components/posts/Post/Post.js` |
| Error types | kebab-case. | `not-found`, `invalid-csrf` |
| Notification types | `Entity:action:audience`, matching the definition's path. | `PostComment:create:author` in `definitions/PostComment/create/author.js` |

## Branches, Flags and Migrations

Work is named after its GitHub issue: a type, the issue number, and a short
description.

| What | Convention | Example |
| ---- | ---------- | ------- |
| Branch | `{feat,fix,test,doc}-NNN-short-name` | `feat-268-comment-reactions` |
| Feature flag | The branch name. | `feat-268-comment-reactions` |
| Migration class and file | The flag in PascalCase, plus `Migration`. | `Feat268CommentReactionsMigration` |
| Manual test run | `test-runs/features/<branch>`, or `test-runs/releases/version-<version>`. | `test-runs/releases/version-0.22.0` |

Older flags and migrations use `issue-NNN` (`issue-165-subgroups`); new
ones use the branch's type.
