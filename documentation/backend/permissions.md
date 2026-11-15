# Permissions

How the server decides what a user may do: `PermissionService.can()`, the
per-entity permission classes, and the rules they share with the client.

**Code:** `packages/backend/services/PermissionService.js`,
`packages/backend/services/permission/`, `packages/shared/permissions/`

## Asking

```javascript
const canView = await this.permissionService.can(currentUser, 'view', 'Post', { post })
```

| Argument | |
| -------- | - |
| `user` | The current user, from the session. |
| `action` | `query`, `create`, `view`, `update`, `delete`, `moderate`, `admin` or `sudo` (`PermissionService.ACTIONS`). |
| `entity` | The entity name: `Post`, `PostComment`, `Group`, `GroupMember`, `GroupPost`, `CommentReaction`, `File`, `User`, `UserRelationship`, `Notification`, `Site`, ... |
| `context` | What the decision depends on: the entity itself, its parent, the user's membership. Pass what you've already loaded; the permission class loads anything missing. |

It returns `true` or `false`. A missing user, a user whose status isn't
`confirmed`, and a banned user are refused everything before any entity's
rules run.

`Site` has its own actions: `moderate` (site moderators and up), `admin`
(admins and up) and `sudo` (superadmins).

## How a Check Works

`can()` dispatches to the entity's class in `services/permission/`
(`PostPermissions`, `GroupMemberPermissions`, ...), which:

1. **Ensures its context** (`ensureContext()`): loads what's required and
   missing (the post from `postId`, the user's relationship to its author),
   and throws `ServiceError('missing-context')` if something required can't
   be found.
2. **Works out derived facts**, often by asking `can()` about other
   entities: whether the user moderates the site, whether they can view the
   post's group.
3. **Decides.** For Group, GroupMember, GroupPost and Post, the decision
   itself is a pure function in `packages/shared/permissions/`
   (`permissions.Post.canViewPost(user, context)`), so the client can run
   the same rule. The other entities decide in the class itself.

## The Rules Are Shared

The client imports the same functions from `@communities/shared` to decide
what to show (an Edit button, a Join link). See
[Shared Permissions](../shared/permissions.md). The server never trusts the
client's answer: every endpoint checks again.

## Queries

`can(user, 'query', 'Post')` only says whether the user may query posts at
all. Which rows they may see is decided by the SQL the controller's
`createQuery()` builds, which has to implement the same rules as the
entity's `view` permission. See [Controllers](../server/controllers.md#query-methods).

## Adding or Changing a Rule

1. Change the permission class, or the shared rule if the entity has one.
2. If it changes who can see what, change the controller's `createQuery()`
   (and `getRelations()`) to match.
3. Add unit tests in
   `packages/backend/test/services/PermissionService/<Entity>Permissions/`,
   one file per action, covering every role.
4. Add or update the integration tests for the endpoints, and the
   permission cases in the manual test cases.

To add permissions for a new entity: create `<Entity>Permissions.js` with
`ensureContext()` and a `can<Action><Entity>()` per action, construct it in
`PermissionService`'s constructor, and add a branch for the entity in
`can()`.
