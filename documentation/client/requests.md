# Requests

How the client calls the API: `makeRequest()` builds and sends the
request, thunks decide what to do with the response, and `useRequest()`
tracks the request for a component. The server side is in
[Request Lifecycle](../architecture/request-lifecycle.md).

**Code:** `web-application/client/state/lib/makeRequest.js`,
`web-application/client/lib/hooks/useRequest.js`,
`web-application/client/lib/hooks/useRetries.js`,
`web-application/client/lib/request/Requests.js`

## makeRequest

```javascript
makeRequest(method, endpoint, body, onSuccess, onFailure, options)
```

Thunks call it; components don't. It:

1. **Builds the request:** `Accept: application/json`,
   `X-Communities-Platform` (`web`, `ios` or `android`), `no-store`, the
   body as JSON (or `FormData` for uploads), the CSRF token on everything
   but `GET`, and in the apps the session ID from secure storage in
   `X-Communities-Auth`.
2. **Resolves the endpoint** against the API root from `state.system.api`
   (`/posts` → `https://<host>/api/0.0.0/posts`).
3. **Handles what comes back:**
   - 401: clears the apps' stored session and sends the user to `/`.
   - In the apps, saves any new `X-Communities-Auth` header.
   - Parses the JSON body (or a blob, with `options.isFile`).
   - Calls `onSuccess(body)` or `onFailure(status, body)`.
4. **Returns** `[promise, abortController]`. The promise resolves to a
   result, never rejects:

```javascript
{
    success: true,
    request: { endpoint, method },
    response: { status, body },
    error: null    // or { type, message, all: [ { type, message, context } ] }
}
```

## useRequest

Components make requests through `useRequest()`:

```javascript
const [request, makeRequest, resetRequest] = useRequest()

const onSubmit = function() {
    makeRequest(patchPost(post))
}

if ( request?.state === 'failed' ) { ... }
```

`request` is `null` until a request is made, then
`{ state, request, response, error }` with `state` `pending`, `fulfilled`
or `failed`. If the component unmounts while the request is pending, it's
aborted.

Use one `useRequest()` per request a component makes. To wait on several
at once, `Requests` (`lib/request/Requests.js`) combines their states.

## Retrying

`useRetries(name, makeRequest, request)` retries a failed request with
growing delays, and resets once it succeeds. `App` uses it for
initialization; use it for requests the page can't work without.

## Showing Errors

`components/errors/RequestError/` shows a failed request's errors: a 404
page for 404s, and each message in `error.all` for other 4xx errors. Forms
show the messages from `request.error` themselves. Error types are in
[Responses and Errors](../server/responses-and-errors.md).

## Writing a Thunk

Put it in the entity's `state/<Entity>/thunks.js`, name it after the
controller method (`patchPost`), and in `onSuccess` set the entity or
dictionary, any query results, and the relations. See [State](state.md).
