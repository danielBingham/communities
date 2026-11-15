# The Session Package

`packages/session` is our fork of
[express-session](https://github.com/expressjs/session) 1.18.2, published
nowhere, used by the web application as `@communities/session`. It adds
sessions carried in a header, for the mobile apps. Its `README.md` is the
upstream documentation, and still describes everything else.

**Code:** `packages/session/index.js`, `web-application/server/session.js`

## What We Changed

| Change | Where in `index.js` |
| ------ | ------------------- |
| **Two options:** `headerName` (default `X-Auth`), the header that carries the session ID, and `platformHeader` (default `X-Platform`), the header that names the platform. We set them to `X-Communities-Auth` and `X-Communities-Platform`. | The options at the top of `session()`. |
| **Reading the session ID by platform.** For `web` (or no platform), from the cookie, as upstream. For `ios` and `android`, from the auth header (`getAuthHeader()`), signed with the same secret as the cookie. | Where the middleware reads `req.sessionID`. |
| **Writing the session ID by platform.** For the apps, the signed ID goes back in the auth header (`setAuthHeader()`) instead of a `Set-Cookie`. | Where upstream sets the cookie. |
| **The `test` platform** behaves like the apps, but only when `NODE_ENV` is `development` or `staging`. | The same three places. |
| **`req.session.platform`** records the platform when a session is created (`web` if none or unknown). | `store.generate`. |
| **A `logger` option**, for logging which way the ID was read and written. | |

Everything else (stores, cookies, `resave`, `rolling`, `touch`) is
upstream's.

## Keeping Up with Upstream

When upstream releases a fix we need:

1. Diff the release against 1.18.2 (the version we forked).
2. Apply the changes to `packages/session/index.js` and `session/`, keeping
   our platform branches.
3. Run its tests: `npm test -w packages/session` (Mocha, inherited from
   upstream).
4. Update the version we're based on in `package.json`'s `description` and
   in this page.

The package keeps upstream's dependency ranges rather than exact pins.
