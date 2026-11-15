# Responses and Errors

The general shapes of API responses and error bodies. These are the
conventions every endpoint follows; the reference for each endpoint is in
[the API documentation](../api/README.md).

**Code:** `web-application/server/controllers/`,
`web-application/server/errors.js`,
`web-application/server/controllers/BaseController.js`

## One Entity

`GET /post/:id`, `POST /posts`, `PATCH /post/:id`, `DELETE /post/:id` and
the like respond with:

```json
{
    "entity": { "id": "…", "userId": "…", "content": "…", "createdDate": "…" },
    "relations": {
        "users": { "<id>": { "id": "…", "name": "…" } },
        "postComments": { "<id>": { … } }
    }
}
```

- `entity` is the entity as stored, after the change. A `DELETE` returns
  the deleted entity, so the client knows what to remove.
- `relations` holds other entities the client needs, as dictionaries keyed
  by id, under the slice's name in camelCase plural (`users`,
  `postComments`, `files`, `linkPreviews`). It can be empty.

Creating answers 201; everything else 200.

## A Query

`GET /posts?...` and the like respond with:

```json
{
    "dictionary": { "<id>": { … }, "<id>": { … } },
    "list": [ "<id>", "<id>" ],
    "meta": { "count": 135, "page": 1, "pageSize": 20, "numberOfPages": 7 },
    "relations": { … }
}
```

- `dictionary` holds the results by id, and `list` their ids in order.
- `meta` is for paging. Pages start at 1; `pageSize` is set per DAO
  (usually 20). Ask for another page with `?page=2`.
- Filters and sorting go in the query string, encoded with `qs` (nested
  objects and arrays allowed).

## Errors

Every error is JSON with an `error` object and a 4xx or 5xx status.

**A single error:**

```json
{ "error": { "type": "not-found", "message": "That resource doesn't exist." } }
```

**Validation errors**, where there can be several, come as a list in
`all`. Each one's `type` names the field and the problem, and some carry a
`context` with more detail:

```json
{
    "error": {
        "type": "invalid",
        "all": [
            { "type": "content:too-long", "message": "…" },
            { "type": "visibility:invalid", "message": "…" }
        ]
    }
}
```

The client shows each `message` (see `RequestErrorContent` in
`web-application/client/components/errors/`).

`message` is always safe to show the user; the details are in the server's
log.

## Error Types

| Status | Type | Meaning |
| ------ | ---- | ------- |
| 400 | `invalid` | Input failed cleaning or validation. |
| 400 | `upload-error`, `upload-error:file-size` | An upload was refused by the upload middleware. |
| 401 | `not-authenticated` | Needs a logged-in user. |
| 401 | `session-expired` | The session has no CSRF token any more: reload and log in again. |
| 403 | `not-authorized` | Logged in, can see it, can't do this. |
| 403 | `invalid-csrf` | Missing or wrong CSRF token. |
| 403 | `authentication-failed` | Wrong email, password or code. Doesn't say which. |
| 404 | `not-found` | Doesn't exist, or the user can't see it. |
| 409 | `conflict` | Conflicts with what exists. |
| 429 | `too-many-requests` | A rate limit. |
| 429 | `authentication-timeout`, `too-many-attempts` | Login lockout. |
| 430 | `underage` | Registration refused for age. |
| 500 | `server-error` | A bug; the details are only in the log. |
| 503 | `unsupported`, `not-implemented` | The feature is off, or the endpoint isn't built. |

Some endpoints use more specific types (`invalid-email`, `invalid-status`,
`no-resource`); search the controller for its `ControllerError`s.

## How Errors Become Responses

Controllers throw `ControllerError(status, type, logMessage, publicMessage)`.
The error middleware in `errors.js` logs the log message (at `info` for
4xx, `error` for 5xx) and sends `{ error: { type, message: publicMessage } }`.
Multer's errors become `upload-error`s. Anything else is logged in full and
sent as a 500 `server-error`. See [Errors and Logging](../standards/errors-and-logging.md).
