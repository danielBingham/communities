# Request Pipeline

The Express middleware every request passes through, in order, and why
each is where it is.

**Code:** `web-application/server/app.js`

## The Order

| # | Middleware | Applies to | What it does |
| - | ---------- | ---------- | ------------ |
| 1 | `express.json`, `express.urlencoded` | Everything | Parse bodies, up to 50 MB. Query strings are parsed with `qs` (`query parser: extended`), matching how the client builds them. |
| 2 | Security headers | Everything | CSP, HSTS and the rest. See [Security Headers](security-headers.md). |
| 3 | CORS | Everything | Allows the site's own host and the apps' origins (`capacitor://localhost`, `https://localhost`), the methods `GET`, `POST`, `PATCH` and `DELETE`, and our headers. |
| 4 | Storage route | `/api/0.0.0/storage/` | Only with the `filesystem` driver. Before sessions, because a signed link is its own permission. |
| 5 | `Cache-Control: no-store` | `/api` | API responses are never cached; the client's state does the caching. |
| 6 | Session | `/api` | Loads the session from PostgreSQL by cookie or header. See [Sessions and CSRF](sessions-and-csrf.md). |
| 7 | Request logger | Everything | Creates `request.logger`, and logs the start and end of each request. |
| 8 | Feature flags | `/api` | Loads the enabled features into `core.features` for this request. |
| 9 | CSRF | `/api` | Checks the token on everything but `GET`. |
| 10 | API router | `/api/0.0.0` | The routes, each with its rate limit. See [Routing and Rate Limits](routing-and-rate-limits.md). |
| 11 | `/health` | | Answers 200 with no work, for the load balancer. |
| 12 | Static files | `/dist/dist.zip`, `/.well-known/...`, images, CSS and JS | The mobile apps' live update bundle, the app link files for iOS and Android, and the built client's files. |
| 13 | Page router | Everything else | `index.html` with the page's metadata. See [Pages and Metadata](pages-and-metadata.md). |
| 14 | Error handler | | Turns errors into responses. See [Responses and Errors](responses-and-errors.md). |

## Things to Know

- **The API is versioned by path.** Routes are mounted at `/api/0.0.0`, so
  a future incompatible API can be mounted beside it.
- **Sessions only load for `/api`.** Static files and pages don't need
  them. (The WebSocket loads the session itself during the upgrade.)
- **Feature flags are read per request and set on the shared `core`.**
  That means flags can't be read in constructors, which run at startup.
  Read them inside the request with `this.core.features.has(name)`. This
  is a known shortcut (marked `TECHDEBT` in `app.js`).
- **`trust proxy` is on**, so `request.ip` is the client's address from
  `X-Forwarded-For`, which the rate limits depend on.

## Adding Middleware

Add it to `app.js` where it belongs in the order above, with a comment
saying what it does and why it's there. Middleware that only matters for
the API goes under `/api`. Anything that needs the session goes after the
session parser; anything that must run without one (like the storage
route) goes before it.
