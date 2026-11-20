# Client

Orientation for the React and Redux client in `web-application/client/`.
The same bundle runs in browsers and, wrapped by Capacitor, as the iOS and
Android apps (see [Mobile](mobile.md)). For anything more, read the code it
points to.

## Where Things Are

| Path | What's there |
| ---- | ------------ |
| `index.js` | The entry point: loads entities the server preloaded into the page, sets up logging, renders `App`. |
| `App.js` | Initialization (`GET /system/initialization`, then `GET /authentication`), and every route. |
| `layouts/`, `pages/` | The layouts routes render inside, and one component per route or group of routes, by area. |
| `components/` | Everything else that renders, by domain (`posts/`, `groups/`, ...), plus the `ui/` kit and `generic/` building blocks. Each component's CSS file sits beside it. |
| `state/` | The Redux store: a slice and thunks per entity (`state/Post/`), system slices, and `state/lib/` (`makeRequest`, relations, reset). |
| `lib/hooks/` | A folder of hooks per entity (`lib/hooks/Post/`), and general hooks (`useRequest`, `useFeature`, `useSocket`, ...). |
| `lib/permission/` | `can()`, using the rules in `packages/shared`. |
| `lib/native/` | Wrappers around Capacitor's native features. |
| `app.css` | Global styles and the palette's CSS variables. |
| `migrations/` | Local storage migrations. |

Imports from the client's root start with `/`
(`import { usePost } from '/lib/hooks/Post'`). Webpack resolves them with
`resolve.roots` in `web-application/webpack.config.js`, and Jest with
`moduleNameMapper` in `web-application/package.json`; change both together.

## How Data Gets to a Component

1. **A component calls an entity hook**: `usePost(id)` selects the post
   from the `Post` slice, and requests it if it isn't there.
   `usePostQuery(params)` does the same for a list, stored under the
   query's name (its params, as JSON).
2. **The hook runs a thunk** through `useRequest()`, which tracks the
   request's state for the component. Thunks are named for the controller
   method they call (`getPost`, `patchPost`), and call `makeRequest()`.
3. **`makeRequest()`** adds the platform, CSRF and (in the apps) session
   headers, and sends the user to `/` on a 401.
4. **The thunk's `onSuccess` stores the response**: the entity or
   dictionary in its slice, a query's `meta` and `list` under its name, and
   every relation in its own slice through `setRelationsInState()`.

An entity slice holds `{ dictionary, queries }`. A new slice has to be
added to the store in `state/store.js` and to `entityMap` in
`state/lib/relations.js`, or relations for it are dropped with a warning.
Logging out dispatches `system/reset`, which empties the store.

## Real-Time

`useSocket()` opens the WebSocket once someone is logged in. A component
that needs events subscribes with `useEventSubscription()`; the socket
middleware in `state/store.js` puts `Job` events in the `jobs` slice and
`Notification` events in `notifications`. See
[System Overview](overview.md#how-they-talk).

## Local Storage

Drafts and which menus are open are kept in local storage. If you change
the format of something stored there in a way older readers can't handle,
add a migration: write `migrateVersion<N>to<N+1>()` in
`migrations/StorageMigrations.js`, add it to the end of `migrations`, and
increase `currentVersion`. `App` runs them after initialization. Logging
out clears local storage. Nothing sensitive goes there; the apps keep the
session ID in secure storage.

## Build

Webpack (`web-application/webpack.config.js`) builds the client for one
environment, writing the host, API path, environment and version into
`<meta>` tags in `index.html`, which the client reads at startup. The
`build` scripts in `web-application/package.json` also zip the build into
`public/dist/dist.zip`, for the apps' live updates. Locally,
the webpack dev server on port 3000 serves the client and proxies the API,
pages and the WebSocket to Express. See
[Running with Docker](../getting-started/running-with-docker.md).
