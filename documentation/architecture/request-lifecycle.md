# Request Lifecycle

One API request from end to end, from the component that needs data to the
re-render that shows it. Each step links to the doc for its layer.

## The Path of a Request

```
Component ──► entity hook ──► useRequest ──► thunk ──► makeRequest ──► fetch
                                                                         │
                                                       Express middleware ◄┘
                                                              │
                                     router ──► controller ──► services, DAOs ──► PostgreSQL
                                                              │
                                                    { entity, relations } JSON
                                                              │
       re-render ◄── selectors ◄── slices ◄── onSuccess ◄─────┘
```

## In the Client

1. **A component asks a hook.** `usePost(postId)` selects the post from the
   `Post` slice and, if it isn't there, requests it. See
   [Hooks](../client/hooks.md).
2. **`useRequest` dispatches the thunk** and tracks the request's state
   (`pending`, `fulfilled`, `failed`) for the component, aborting it if the
   component unmounts. See [Requests](../client/requests.md).
3. **The thunk** (`getPost(id)` in `state/Post/thunks.js`) names the
   endpoint and what to do with the response, and calls `makeRequest()`.
4. **`makeRequest()`** builds the request:
   - `X-Communities-Platform`: `web`, `ios` or `android`.
   - `X-Communities-CSRF-Token`, on everything but `GET`.
   - On the apps, `X-Communities-Auth`, the session ID from secure storage.

## On the Server

5. **Express middleware** runs in order: body parsing, security headers,
   CORS, `no-store`, the session, request logging, the feature flags,
   and the CSRF check. See [Request Pipeline](../server/request-pipeline.md).
6. **The router** matches the route under `/api/0.0.0`, applies its rate
   limit, and calls the controller method. See
   [Routing and Rate Limits](../server/routing-and-rate-limits.md).
7. **The controller** authenticates, cleans and validates the input, loads
   what it needs through DAOs, checks permissions with `PermissionService`,
   does the work through services and DAOs, and responds. See
   [Controllers](../server/controllers.md).
8. **The response** is the entity or query result, plus the related
   entities the client will need. See
   [Responses and Errors](../server/responses-and-errors.md).

## Back in the Client

9. **`makeRequest()` handles the response.** On a 401 it sends the user to
   `/` to log in again. On the apps, it saves a new `X-Communities-Auth`
   header to secure storage. Then it calls the thunk's `onSuccess` or
   `onFailure`.
10. **`onSuccess` updates the slices:** the entity or dictionary into its
    slice, a query's `meta` and `list` under the query's name, and every
    relation into its own slice (`setRelationsInState()`). See
    [State](../client/state.md).
11. **Components re-render** from the selectors.

## Errors Along the Way

| Where | What the client gets |
| ----- | -------------------- |
| No session, or it expired | 401: `not-authenticated` or `session-expired`. |
| Bad or missing CSRF token | 403: `invalid-csrf`. |
| Rate limit | 429: `too-many-requests`. |
| Invalid input | 400: `invalid`, with every problem in `error.all`. |
| Not allowed to see it, or it doesn't exist | 404: `not-found`. |
| Can see it, not allowed to do it | 403: `not-authorized`. |
| A bug | 500: `server-error`, with the details only in the server's log. |

The request's state in `useRequest` carries the error's `type` and its list
of problems (`error.all`), which forms use to show messages beside fields.
