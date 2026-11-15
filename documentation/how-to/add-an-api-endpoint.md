# Add an API Endpoint

How to add a route and its controller method. The patterns are in
[Controllers](../server/controllers.md) and
[Routing and Rate Limits](../server/routing-and-rate-limits.md).

## 1. The Route

In `web-application/server/router.js`, in the controller's group:

```javascript
router.patch('/post/:postId/comment/:id', rateLimit(core, 60), function(request, response, next) {
    postCommentController.patchPostComment(request, response).catch(function(error) {
        next(error)
    })
})
```

- [ ] Shape the path like the others: plural to query or create, singular
      with an id for one, children under their parent.
- [ ] Name the method for the verb and resource.
- [ ] Choose a rate limit from a similar existing route.
- [ ] For uploads, add the upload middleware after the rate limit.

## 2. The Method

In the controller, following the standard sequence:

```javascript
async patchPostComment(request, response) {
    // 1. Feature flag, if it's behind one.
    // 2. Authenticate.
    const currentUser = request.session.user
    if ( ! currentUser ) {
        throw new ControllerError(401, 'not-authenticated',
            `User must be authenticated to edit a comment.`,
            `You must be authenticated to edit a comment.`)
    }
    // 3. Clean and validate route parameters, query and body.
    // 4. Load what it's about.            Missing → 404.
    // 5. Can they see it?                 No → 404.
    // 6. Can they do this to it?          No → 403.
    // 7. Build the entity from the cleaned body and the server's own
    //    values, and validate it.          Invalid → 400.
    // 8. Write. Queue jobs and notifications.
    // 9. Read it back.
    // 10. Respond with the entity and relations.
    response.status(200).json({ entity, relations })
}
```

- [ ] Every error is a `ControllerError` with a log message and a public
      message. See [Errors and Logging](../standards/errors-and-logging.md).
- [ ] Ids, the user and dates come from the route and session, never the
      body.
- [ ] Go through the [security checklist](../standards/security.md).

For a query endpoint (`GET /<entities>`), build the visibility rules into
`createQuery()` and return `{ dictionary, list, meta, relations }`. See
[Responses and Errors](../server/responses-and-errors.md).

## 3. The Client

- [ ] A thunk in `web-application/client/state/<Entity>/thunks.js`, named
      like the method, updating the slice and relations on success. See
      [State](../client/state.md).
- [ ] Use it from a hook or a component with `useRequest()`. See
      [Requests](../client/requests.md).

## 4. Tests

- [ ] An integration test file,
      `web-application/test/integration/suites/<Controller>/<method>.spec.js`:
      success, each error, and the permission matrix. See
      [Writing Integration Tests](../testing/writing-integration-tests.md).
- [ ] An API helper for it in `web-application/test/lib/` if other tests
      will set things up with it.
- [ ] The manual test cases updated and marked covered.
