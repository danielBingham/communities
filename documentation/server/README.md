# Server

The web application's server: the Express API, the WebSocket server, and
the page renderer. It's built on the backend package, which holds the DAOs
and services; see [Backend](../backend/README.md).

**Code:** `web-application/server/`, `packages/session/`

| File | Read it when |
| ---- | ------------ |
| [structure.md](structure.md) | Finding your way around `server/`, or changing how the server starts and stops. |
| [request-pipeline.md](request-pipeline.md) | Adding middleware, or working out what runs before a controller. |
| [routing-and-rate-limits.md](routing-and-rate-limits.md) | Adding a route, choosing a rate limit, or handling uploads. |
| [controllers.md](controllers.md) | Writing or changing a controller method. |
| [responses-and-errors.md](responses-and-errors.md) | Shaping a response, or choosing an error status and type. |
| [sessions-and-csrf.md](sessions-and-csrf.md) | Working with sessions, cookies vs headers, or the CSRF check. |
| [session-package.md](session-package.md) | Changing `packages/session`, or updating it from upstream. |
| [websockets.md](websockets.md) | Changing the WebSocket server or its messages. |
| [pages-and-metadata.md](pages-and-metadata.md) | Giving a page its own title and link preview, or preloading its data. |
| [security-headers.md](security-headers.md) | Changing the Content Security Policy or other security headers. |
