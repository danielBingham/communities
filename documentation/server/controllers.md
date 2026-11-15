# Controllers

The controller pattern: one class per entity, one method per route, and the
standard sequence each method follows.

**Code:** `web-application/server/controllers/`,
`web-application/server/controllers/BaseController.js`

## The Class

```javascript
module.exports = class CommentReactionController {
    constructor(core) {
        this.core = core
        this.commentReactionDAO = new CommentReactionDAO(core)
        this.postDAO = new PostDAO(core)
        this.permissionService = new PermissionService(core)
        this.validationService = new ValidationService(core)
        this.commentReactionSchema = new schema.CommentReactionSchema()
    }
    ...
}
```

- **Constructed once**, in `router.js`, at startup. It creates the DAOs and
  services it needs from `core`, and keeps no per-request state.
- **One method per route**, named for the verb and resource
  (`postCommentReactions`, `deleteCommentReaction`). Each is
  `async (request, response)` and either sends a response or throws.
- **Helpers shared by its methods**: `getRelations()` (what to send with
  the result), `createQuery()` (turning a query string into a DAO query),
  and `ensure...()` checks used by several methods.
- **Some extend `BaseController`** for `sendUserErrors()`, which sends a
  list of validation errors as one 4xx response.

## The Standard Sequence

Every method follows the same order. Each step either continues or throws
a `ControllerError`.

1. **Feature check**, if the code is behind a flag:
   `if ( ! this.core.features.has('feat-268-comment-reactions') )` → 503.
2. **Authenticate:** `const currentUser = request.session.user`; none → 401
   `not-authenticated`.
3. **Clean and validate the input:** route parameters, query string and
   body, with the entity's Schema where there is one. Problems → 400
   `invalid`, with every problem.
4. **Load** what the request is about, through DAOs. Missing → 404
   `not-found`.
5. **Check permission to see it:**
   `permissionService.can(currentUser, 'view', 'Post', { post })`. No →
   404 `not-found`, the same as missing.
6. **Check permission to act:** `can(currentUser, 'update', ...)`. No → 403
   `not-authorized`.
7. **Build the entity** from the cleaned body plus what the server decides
   (ids, the user, dates from the route and session, never from the body),
   and **validate it** with `ValidationService`. Problems → 400.
8. **Write** through the DAO (or a service, for anything beyond one write).
   Queue any jobs or notifications.
9. **Read it back** through the DAO, so the response has exactly what's
   stored.
10. **Respond** with the entity and its relations. See
    [Responses and Errors](responses-and-errors.md).

`CommentReactionController.js` is a compact, recent example of every step.

## Query Methods

`get<Entities>` methods work differently, because there are many entities
and permission checks per row would be too slow:

1. Authenticate, and check `can(currentUser, 'query', 'Post')`.
2. **`createQuery(request)`** builds the DAO query from the query string
   *and* the visibility rules: it looks up the user's friends, blocks and
   memberships and writes them into the `WHERE` clause, so the database
   only returns rows the user may see.
3. `selectPosts(query)`, then the page meta and the relations.

So for queries, the visibility rules live in SQL in `createQuery()`, and
must match the entity's permission class. Change them together.

## Relations

`getRelations(currentUser, results)` gathers what the client needs to show
the results without asking again: a post's author, its comments,
reactions, files and link previews, shared posts. Every relation is loaded
with the same visibility rules (blocked users' content left out, shared
posts only if still public), so relations never leak what a direct request
wouldn't return.

## Admin Controllers

`controllers/admin/` holds the controllers behind the admin dashboard
(`StatsController`, `SiteModerationController`, `BlocklistController`,
`AdminPostCommentsController`), at `/admin/...` routes. They follow the same
sequence, with `can(currentUser, 'moderate', 'Site')` or
`can(currentUser, 'admin', 'Site')` as the permission check.

## Writing One

See [Add an API Endpoint](../how-to/add-an-api-endpoint.md).
