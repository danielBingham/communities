# WebSockets

The server side of the WebSocket: how connections are authenticated, what
messages it takes, and how it hands connections to `Events`. The whole flow
of an event is in [Real-Time Events](../architecture/real-time-events.md).

**Code:** `web-application/server/wsServer.js`, `packages/backend/events.js`

## The Upgrade

The WebSocket server shares the HTTPS server, taking upgrades at `/socket`
only (anything else is dropped). For each upgrade:

1. **Unpack the smuggled headers.** The browser WebSocket API can't set
   headers, so the client sends them as extra entries in
   `Sec-WebSocket-Protocol`: the real protocol first, then header and value
   pairs (values URI-encoded). `parseProtocolHeader()` moves them onto the
   request's headers and leaves only the protocol.
2. **Load the session** with the same session parser as the API, which now
   sees the platform and auth headers.
3. **Refuse unauthenticated upgrades** with `401 Unauthorized`.
4. **Accept**, and give the connection a new id.

`COMMUNITIES_WS_HOST` must point at `/socket` (locally
`wss://localhost:3000/socket`, through the webpack dev server's proxy).

## Messages

All messages are JSON objects.

| From the client | What happens |
| --------------- | ------------ |
| `{ entity: 'Ping' }` | The server answers `{ entity: 'Pong' }`. The client uses it to keep the connection alive and notice when it's gone. |
| `{ action: 'subscribe', entity, context }` | `core.events.subscribe(userId, connectionId, event)`: the entity's handler records the subscription, and the server confirms with `confirmSubscription`. |
| `{ action: 'unsubscribe', entity, context }` | `core.events.unsubscribe(...)`, confirmed with `confirmUnsubscription`. |
| Anything else | Logged as unrecognized and ignored. |

From the server, events arrive as `{ entity, action, context, options }`.

## Connections

On connection, the server registers a send function with
`core.events.registerConnection(userId, connectionId, send)`. `Events` keeps
connections by user and connection id, in this instance only: each
instance delivers events to the connections it holds. On close,
`unregisterConnection()` tells every handler to drop that connection's
subscriptions.

Each connection gets its own `Logger`, prefixed with the username and
connection id.
