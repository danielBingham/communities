# Writing Integration Tests

How to write an integration test: the shape of a spec file, setting up
through the API, testing permissions and errors, and cleaning up. Running
them is in [Integration Tests](integration-tests.md); the helpers are in
[The Shared Test Library](test-library.md).

**Code:** `web-application/test/integration/suites/`,
`web-application/test/lib/`

## Where a Test Goes

One file per route handler, named for the controller method:
`suites/<Controller>/<method>.spec.js`. Split a handler with many cases into
a directory of files by concern (`suites/PostController/getPosts/permissions.spec.js`).
Name the top-level `describe` for the route, as the API sees it:
`describe('DELETE /post/:postId/comment/:commentId/reaction', ...)`.

## The Shape of a Spec

```javascript
const { describe, it, before, after } = require('node:test')
const assert = require('node:assert/strict')

const { initialize, logout, loginAs } = require('../../../lib/authentication')
const { getPost, deleteAllPostsForUser } = require('../../../lib/posts')

describe('GET /post/:id', function() {
    let author = null

    before(async function() {
        author = await loginAs('user1')
        await deleteAllPostsForUser(author.session, author.user.id)
    })

    after(async function() {
        await deleteAllPostsForUser(author.session, author.user.id)
        await logout(author.session)
    })

    it(`Should reject an unauthenticated request`, async function() {
        const session = await initialize()
        const response = await getPost(session, crypto.randomUUID())

        assert.equal(response.status, 401)
        assert.equal(response.content?.error?.type, 'not-authenticated')
    })
})
```

- **Log in once per file** in `before()` with `loginAs(key)`, and log out in
  `after()`. Use `initialize()` alone for an unauthenticated session.
- **Set up through the API** with the helpers in `test/lib`. If a helper you
  need doesn't exist, add it there (in the file for its entity), so the
  end-to-end tests can use it too.
- **Clean up** everything the file creates in `after()`, and start from a
  known state in `before()` (`deleteAllPostsForUser()`,
  `clearRelationship()`), since fixtures are shared across files in a run.
- **Name tests** `Should ...`, saying the behavior: `Should let a confirmed
  friend view a PRIVATE post`.

## What to Assert

Each response is `{ status, ok, content, raw }`. Check the status and the
body:

- **Success:** the entity in `content.entity`, or the list in
  `content.list` and `content.dictionary`, and any relations the client
  depends on in `content.relations`.
- **Errors:** the status and `content.error.type` (`not-authenticated`,
  `not-found`, `invalid`, and so on). See
  [Responses and Errors](../server/responses-and-errors.md).
- **The change itself:** read it back (a follow-up `GET`) when the response
  alone doesn't prove it happened, or didn't.

## Permissions

Test the permission matrix the case file describes, one `it` per role, in a
`describe` per situation (`for PRIVATE posts`, `for Open groups`). Set up a
user in each role in `before()`, and use a small assertion helper inside
the file (`assertCanView(session, post)`) so each row reads as one line.

The server answers 404 (`not-found`) when a user isn't allowed to see
something, so its existence doesn't leak, and 403 (`not-authorized`) when
they can see it but can't do what they asked. Test for exactly the status
and type it should give.

## Feature Flags

A test for a feature behind a flag checks the flag first, and skips rather
than fails when it's off:

```javascript
before(async function() {
    enabled = await isFeatureEnabled(COMMENT_REACTIONS_FEATURE)
})

it(`Should ...`, async function(t) {
    if ( ! enabled ) { t.skip(`${COMMENT_REACTIONS_FEATURE} feature is not enabled`); return }
    ...
})
```

## Finishing Up

Mark each case you automated `(covered: integration)` in its case file (see
[Writing Test Cases](writing-test-cases.md#coverage-markers)), and run the
whole suite once before you push: tests that pass alone can still interfere
through the shared fixtures.
