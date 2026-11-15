# Client Structure

What's in `web-application/client/`, how it starts, and how imports work.
The same bundle runs in browsers and, wrapped by Capacitor, as the iOS and
Android apps.

**Code:** `web-application/client/`

## Directories

| Path | What's in it |
| ---- | ------------ |
| `index.js` | The entry point. Loads preloaded entities into the store, sets up logging (and Sentry in production), and renders `App`. In the apps, it first tells the live updater the bundle started. |
| `App.js` | Initialization, and every route. See [Routing and Layouts](routing-and-layouts.md). |
| `app.css` | Global styles and the palette's CSS variables. See [Styling](styling.md). |
| `logger.js` | The client's logger. See [Errors and Logging](errors-and-logging.md). |
| `layouts/` | The four layouts routes render inside. |
| `pages/` | One component per route or group of routes, by area (`posts/`, `groups/`, `users/`, `admin/`, `about/`, `authentication/`, `friends/`). Pages compose components; they hold little logic of their own. |
| `components/` | Everything else that renders, by domain (`posts/`, `groups/`, `users/`, ...), plus the `ui/` kit and `generic/` building blocks. See [Components](components.md). |
| `state/` | The Redux store: a slice and thunks per entity, plus system slices. See [State](state.md). |
| `lib/hooks/` | Hooks: per entity (`lib/hooks/Post/`) and general (`useRequest`, `useAuthentication`, ...). See [Hooks](hooks.md). |
| `lib/permission/` | `can()`, using the shared permission rules. See [Shared Permissions](../shared/permissions.md). |
| `lib/native/` | Wrappers around Capacitor's native features. See [Native Features](../mobile/native-features.md). |
| `lib/Socket.js` | The WebSocket client. See [Real-Time](real-time.md). |
| `lib/localStorage/`, `migrations/` | Local storage helpers and their migrations. See [Local Storage](local-storage.md). |
| `lib/errors/`, `errors/` | Error helpers and the error boundary. |
| `lib/notification/` | Badge counts for notifications. |
| `lib/request/` | `Requests`, for combining the states of several requests. |
| `lib/validation/` | Client-side validation helpers for forms. |
| `assets/` | Logos and app store badges, imported by components. |

## Starting Up

1. `index.js` puts any entities the server preloaded into the store
   (see [Pages and Metadata](../server/pages-and-metadata.md)).
2. `App` calls `GET /system/initialization` (retrying with backoff),
   which returns the CSRF token, the enabled features and the client's
   configuration.
3. It sets the log level, runs local storage migrations, then calls
   `GET /authentication` to find out who's logged in.
4. It opens the WebSocket once someone is (`useSocket`), and records the
   device and app version with the server (`useDevice`). Logged-in pages
   also register for push notifications in the apps (`useNotifications`).
5. Then it renders the router.

## Imports

Paths from the client's root start with `/`:

```javascript
import { usePost } from '/lib/hooks/Post'
import Spinner from '/components/Spinner'
import { getPosts } from '/state/Post'
```

Webpack resolves them from `client/` (`resolve.roots` in
`web-application/webpack.config.js`), and Jest maps them with
`moduleNameMapper` in `web-application/package.json`. Use them for
anything outside the current component's own folder; relative imports
(`./Post.css`) only for its own files.

The shared package is imported whole:
`import * as shared from '@communities/shared'`.
