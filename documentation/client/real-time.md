# Real-Time

The client side of the WebSocket: connecting, subscribing to events, and
handling what arrives. The whole flow is in
[Real-Time Events](../architecture/real-time-events.md).

**Code:** `web-application/client/lib/Socket.js`,
`web-application/client/state/store.js`, `web-application/client/state/socket.js`,
`web-application/client/state/events.js`,
`web-application/client/lib/hooks/useSocket.js`,
`web-application/client/lib/hooks/useEventSubscription.js`

## Connecting

`useSocket()`, in `App`, keeps the socket open while a user is logged in and
the app is active (in the foreground). It dispatches the `socket` slice's
`connect` and `disconnect` actions, retrying with a growing delay (from
125ms) until it connects.

The socket middleware in `store.js` does the work, with one `Socket`
instance:

- On `connect`, it opens `wsHost` from the server's configuration,
  passing the platform and (in the apps) the session ID as extra
  `Sec-WebSocket-Protocol` entries, since the WebSocket API can't set
  headers.
- On `open` and `close` from the socket, it updates the `socket` slice. A
  close clears the confirmed subscriptions.
- `Socket` pings the server to keep the connection alive, and treats a
  missing `Pong` as a dropped connection.

## Subscribing

```javascript
useEventSubscription('Notification-create', 'Notification', 'create')

useEventSubscription(file?.jobId ? `Job-update-${queue}-${file.jobId}` : null,
    'Job', 'update', { jobId: file.jobId, queue })
```

`useEventSubscription(key, entity, action, context)` subscribes when the
component mounts (or the key changes), unsubscribes when it unmounts, and
subscribes again whenever the socket reconnects. A `null` key means "not
yet". The `events` slice tracks pending and confirmed subscriptions.

## Handling Events

The socket middleware dispatches each event the server sends:

| Event | Goes to |
| ----- | ------- |
| `confirmSubscription`, `confirmUnsubscription` | The `events` slice. |
| `Notification` | `handleNotificationEvent()` in the `notifications` slice, which adds the new notification. |
| `Job` | `handleJobEvent()` in the `jobs` slice, which updates the job's state and progress. |

Components read jobs and notifications from their slices as usual: upload
components show a job's progress, and the notification menu shows new
notifications as they arrive.

## Adding an Event Type

Add a branch for its entity in the socket middleware's `message` handler,
a handler in the slice it updates, and subscribe where it's needed with
`useEventSubscription`. See
[Add a Real-Time Event](../how-to/add-a-real-time-event.md).
