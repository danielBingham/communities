# Add a Real-Time Event

How to push a new kind of event to clients as it happens. The flow is in
[Real-Time Events](../architecture/real-time-events.md); the pieces are in
[Events](../backend/events.md), [WebSockets](../server/websockets.md) and
[Real-Time](../client/real-time.md).

Events are best-effort: a client that isn't connected misses them. Use one
to update what's on screen sooner, never as the only way the client learns
something.

## 1. A Handler on the Server

Create `packages/backend/events/<Entity>Events.js`, following
`JobEvents.js` or `NotificationEvents.js`:

- [ ] In the constructor, register the entity and the actions it supports:
      `core.events.registerHandler('Thing', [ 'update' ], (event) => this.handle(event))`.
- [ ] In `handle(event)`, handle `subscribe`, `unsubscribe` and `unregister`
      (recording and forgetting subscriptions by user and connection), and
      your actions: for each subscribed connection this instance holds for
      the event's audience, `core.events.sendEventToUserConnection()`.
- [ ] Return `true` for anything handled.
- [ ] Export it from `packages/backend/index.js`, and create it in
      `web-application/server/events.js`.

## 2. Trigger It

Wherever the thing happens, in the web application or the worker:

```javascript
await this.core.events.trigger(userId, 'Thing', 'update', { thing })
```

The first argument is the audience: the user to send it to.

## 3. Handle It in the Client

- [ ] In the socket middleware's `message` handler in
      `web-application/client/state/store.js`, add a branch for the entity
      that dispatches a handler.
- [ ] Write that handler in the slice it updates.

## 4. Subscribe Where It's Needed

```javascript
useEventSubscription(thing ? `Thing-update-${thing.id}` : null, 'Thing', 'update', { thingId: thing?.id })
```

The key identifies the subscription; `null` waits. Subscriptions are
dropped on unmount and renewed on reconnect.

## 5. Test It

Open two browser windows as different users (or the same user twice) and
check the event arrives, and that it still works after the socket
reconnects. Add the event to the table in
[Real-Time Events](../architecture/real-time-events.md).
