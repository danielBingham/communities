# Shared Permissions

The permission rules the server and client share, so the client can decide
what to show using exactly the rules the server enforces.

**Code:** `packages/shared/permissions/`,
`web-application/client/lib/permission/index.js`,
`packages/backend/services/permission/`

## The Rules

`packages/shared/permissions/` has a module per entity: `Group`,
`GroupMember`, `GroupPost` and `Post`. Each exports a pure function per
action:

```javascript
permissions.Post.canViewPost(user, context)
permissions.Group.canModerateGroup(user, context)
```

They're synchronous and load nothing. Everything a rule depends on is in
`context`: the entity (`post`, `group`), the user's membership in it
(`userMember`, `parentMember` for subgroups), and facts worked out by the
caller (`canModerateSite`, `canViewGroupPost`).

## On the Server

The backend's permission classes (`PostPermissions`, `GroupPermissions`,
...) load the context the rule needs, work out the derived facts, then call
the shared rule. See [Permissions](../backend/permissions.md).

## On the Client

`can(currentUser, action, entity, context)` in
`web-application/client/lib/permission/` does the same with what's already
in the client's state:

```javascript
import can, { Actions, Entities } from '/lib/permission'

const canModerate = can(currentUser, Actions.moderate, Entities.Group, { group, userMember })
```

It covers `Group`, `GroupMember`, `GroupPost`, `Post` and `Site`. Hooks like
`useGroupPermissionContext()` assemble the context for a group.

**The client's answer only shapes the UI**: whether a button shows, whether
a page offers a form. The server checks every request itself.

## Changing a Rule

A change to a shared rule changes both sides at once, which is the point.
Make it in `packages/shared/permissions/`, then:

1. Check every caller passes the context the rule now needs, on the server
   (the permission class's `ensureContext()`) and the client (the hooks that
   build context).
2. If it changes what users can see, change the matching SQL in the
   controllers' `createQuery()` and `getRelations()`.
3. Update the unit tests in
   `packages/backend/test/services/PermissionService/`, the integration
   tests, and the permission cases in the manual test cases.

Rules for other entities live only in the backend's permission classes. If
the client needs one, move its decision into a shared module the same way.
