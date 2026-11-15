# Hooks

The hooks components use to get data and app state: an entity hook per
entity that fetches or selects, and general hooks for the app's
cross-cutting state.

**Code:** `web-application/client/lib/hooks/`

## Entity Hooks

Each entity has a folder (`lib/hooks/Post/`), usually with:

| Hook | Returns | Does |
| ---- | ------- | ---- |
| `usePost(id, options)` | `[post, request, refresh]` | Selects the post from the store; if it isn't there, requests it. `refresh()` requests it again. |
| `usePostQuery(params)` | `[query, request, reset]` | Selects the query named for `params`; if it isn't there, requests it. Clears the query when the component unmounts. |

`query` is `{ meta, list }`: select each entity from the dictionary by id,
or with the single-entity hook.

Options most single-entity hooks take:

| Option | |
| ------ | - |
| `skip: true` | Don't request it yet (waiting on something else). |
| `noQuery: true` | Only select; never request. |

Some entities have more: `useGroupFromSlug(slug)`,
`useGroupPermissionContext(currentUser, groupId)` (the context `can()`
needs for a group), `usePostLink()`.

A hook returns `null` for an entity it's still loading, and the request
tells you whether it's pending or failed. Components show a spinner while
pending and a `RequestError` on failure.

## General Hooks

| Hook | For |
| ---- | --- |
| `useRequest()` | Making a request and tracking its state. See [Requests](requests.md). |
| `useRetries()` | Retrying a request the page can't work without. |
| `useAuthentication()` | The current user, and sending them through the onboarding gates. |
| `useFeature(name)` | Whether a feature flag is enabled. |
| `useLocalStorage(key, default)` | State kept in local storage. See [Local Storage](local-storage.md). |
| `usePostDraft()` | A post's draft. |
| `useFormErrors()` | Errors to show beside a form's fields. |
| `useSocket()` | Opening and keeping the WebSocket while someone's logged in. |
| `useEventSubscription(key, entity, action, context)` | Subscribing to a real-time event. See [Real-Time](real-time.md). |
| `useNotifications()` | Registering for push notifications in the apps, and keeping delivered notifications and the badge in step. |
| `useDevice()` | Recording the device's platform and app version with the server (`PATCH /device`). |
| `useAppState()` | Whether the app is in the foreground. |
| `useVersion()` | Noticing a new server version and reloading or updating. See [Live Updates](../mobile/live-updates.md). |
| `useNativeDeepLinks()` | Opening links in the apps at the right route. |
| `useHistoryTracking()`, `useBackPoint()`, `useScrollRestoration()` | Navigation history, returning to where the user came from, and scroll position. |

## Writing an Entity Hook

Follow `lib/hooks/Post/usePost.js` and `usePostQuery.js`:

1. Select from the slice with `useSelector`.
2. Use `useRequest()` and request in a `useEffect` only when the entity or
   query is missing and no request has been made.
3. For query hooks, name the query `JSON.stringify(params)`, and clear it
   on unmount.
4. Return `[value, request, ...]`.
5. Export it from the folder's `index.js`.

Keep fetching in hooks, not components: components ask for what they need
and render what they get.
