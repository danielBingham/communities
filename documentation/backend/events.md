# Events

The `Events` class, which carries events between instances over Redis and
delivers them to WebSocket connections, and the handlers for each kind of
event. How the whole flow fits together is in
[Real-Time Events](../architecture/real-time-events.md).

**Code:** `packages/backend/events.js`, `packages/backend/events/`,
`web-application/server/events.js`

## The Events Class

`core.events` is created by `Core.initialize()`. It keeps three things, for
this instance only:

| | Structure |
| - | --------- |
| `handlers` | `{ [entity]: handler(event) }`, one per entity. |
| `subscriptions` | `{ [entity]: { [action]: ... } }`, organized however each entity's handler needs. |
| `connections` | `{ [userId]: { [connectionId]: send(event) } }`, the WebSocket connections this instance holds. |

| Method | Does |
| ------ | ---- |
| `trigger(audience, entity, action, context, options)` | Publishes the event on the Redis channel `communities:events`. Every instance receives it, including this one. `audience` is a user id, or `'all'`. |
| `registerHandler(entity, actions, handler)` | Registers the handler for an entity's events, and the actions it supports. |
| `registerConnection(userId, connectionId, send)`, `unregisterConnection(...)` | Called by the WebSocket server as connections open and close. |
| `subscribe(userId, connectionId, event)`, `unsubscribe(...)` | Called when a client subscribes; passes the event to the handler, then confirms. |
| `sendEventToUserConnection(userId, connectionId, event)` | Sends an event down one connection, without its audience. |

When an event arrives from Redis, `handleEvent()` passes it to its entity's
handler, which returns `true` if it handled it.

## A Handler

A handler is a class constructed with `core`, which registers itself and
does three jobs:

```javascript
module.exports = class JobEvents {
    constructor(core) {
        this.core = core
        this.core.events.registerHandler('Job', [ 'update' ], (event) => {
            return this.handle(event)
        })
    }
}
```

1. **Record subscriptions**, for `subscribe` and `unsubscribe` events.
2. **Forget a connection**, for the `unregister` event `Events` sends every
   handler when a connection closes.
3. **Deliver events**: for each subscribed connection this instance holds
   for the event's audience, `sendEventToUserConnection()`.

## The Handlers

| Handler | Entity and actions | Events come from |
| ------- | ------------------ | ---------------- |
| `JobEvents` | `Job`: `update` | Bull's global events on the `process-video`, `resize-image` and `send-notifications` queues, which it listens to and republishes to the user who added the job. |
| `NotificationEvents` | `Notification`: `create` | `NotificationWorker`, after it saves a notification. |

The web application creates both at startup
(`web-application/server/events.js`). The worker only triggers events; it
doesn't hold connections.

## Adding an Event Type

See [Add a Real-Time Event](../how-to/add-a-real-time-event.md).
