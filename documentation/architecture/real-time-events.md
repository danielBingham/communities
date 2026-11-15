# Real-Time Events

How the server tells clients about things as they happen (a job's progress,
a new notification) over a WebSocket, even when the event starts in a
different instance than the one holding the client's connection.

**Code:** `packages/backend/events.js`, `packages/backend/events/`,
`web-application/server/wsServer.js`, `web-application/client/lib/Socket.js`,
`web-application/client/state/store.js`

## The Flow

```
Worker or web instance                Every web instance
──────────────────────                ─────────────────────────────────────────────
core.events.trigger(audience, ──► Redis channel ──► Events.handleEvent()
  entity, action, context)       communities:events      │
                                                         ▼
                                              the entity's handler
                                              (JobEvents, NotificationEvents)
                                                         │ for each subscribed
                                                         ▼ connection it holds
                                              WebSocket ──► client Socket ──► store
```

1. **Something happens.** The worker saves a notification, or Bull reports
   a job's progress. Code calls
   `core.events.trigger(audience, entity, action, context)`, where
   `audience` is a user's id (or `'all'`).
2. **It's published** as JSON on the Redis channel `communities:events`.
   Every instance of the web application subscribes to it.
3. **Each instance passes it to the entity's handler**, registered with
   `core.events.registerHandler(entity, actions, handler)`.
4. **The handler finds the subscribed connections** this instance holds for
   that audience, and sends the event down each socket, without the
   audience.
5. **The client's socket middleware** in `store.js` dispatches it: `Job`
   events to the `jobs` slice, `Notification` events to the `notifications`
   slice.

## Connections and Subscriptions

- **Connecting.** The client opens `wss://<host>/socket` once a user is
  logged in and the app is active (`useSocket`), retrying with backoff. The
  browser API can't set headers, so the platform and auth headers ride in
  `Sec-WebSocket-Protocol`; the server unpacks them and checks the session
  before upgrading. Unauthenticated upgrades get a 401.
- **Registering.** Each connection gets an id and is registered with
  `core.events.registerConnection(userId, connectionId, send)`.
- **Subscribing.** Components subscribe to what they need with
  `useEventSubscription(key, entity, action, context)`, which sends
  `{ action: 'subscribe', entity, context }`. The handler records it, and
  the server confirms with `confirmSubscription`. Unmounting unsubscribes.
  Subscriptions are re-sent when the socket reconnects.
- **Keeping alive.** The client pings (`{ entity: 'Ping' }`) and the server
  answers `Pong`.

## Current Event Types

| Entity | Action | Triggered by | Who subscribes |
| ------ | ------ | ------------ | -------------- |
| `Job` | `update` (`active`, `progress`, `completed`, `failed`) | `JobEvents`, listening to the `process-video`, `resize-image` and `send-notifications` queues. | Upload components, for their file's job (`DraftFile`, `DraftProfileImage`). |
| `Notification` | `create` | `NotificationWorker`, after saving a notification. | The notification menu. |

## Limits

Events are best-effort: an event for a user with no open connection is
dropped, and a client that reconnects doesn't receive what it missed.
Anything a client must not miss is also fetched through the API (the
notification list, a file's state).

Adding an event type is in
[Add a Real-Time Event](../how-to/add-a-real-time-event.md).
