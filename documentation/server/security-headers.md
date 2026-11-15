# Security Headers

The Content Security Policy and other security headers the server sends,
and how to change them safely.

**Code:** `web-application/server/middleware/security-headers.js`,
`web-application/webpack.config.js`

## What's Set

`createSecurityHeadersMiddleware(core)` configures
[helmet](https://helmetjs.github.io/) for every response the web
application sends:

| Header | Setting |
| ------ | ------- |
| `Content-Security-Policy` | Every directive listed explicitly (`useDefaults: false`), in alphabetical order. |
| `Strict-Transport-Security` | One year, including subdomains. |
| `Referrer-Policy` | `strict-origin-when-cross-origin`. |
| `Cross-Origin-Opener-Policy` | `same-origin`. |
| `Cross-Origin-Resource-Policy` | `cross-origin`, so the apps' WebViews can load resources from the server. |
| `Cross-Origin-Embedder-Policy` | Off: signed S3 links don't send the header it would require, so images would break. |
| `X-Content-Type-Options`, `X-Frame-Options` | Helmet's defaults. |

## Sources That Depend on Configuration

Some CSP sources come from configuration at startup:

- `connect-src` includes `host` and `wsHost`.
- `connect-src` and `media-src` include the storage driver's origins
  (`core.storage.contentOrigins`): the S3 bucket on staging and production,
  the app itself with the `filesystem` driver. (`img-src` allows any
  `https:` source, for link preview images.)

A source that doesn't parse as a URL stops the server at startup, on
purpose: a deploy with a broken CSP fails before it serves anything.

## The Apps Need the Same Policy Twice

These headers don't reach the mobile apps: they load their `index.html`
from inside the app (`capacitor://localhost` on iOS, `https://localhost` on
Android), not from the server. Their policy is a
`<meta http-equiv="Content-Security-Policy">` tag that webpack writes into
`index.html`, from `web-application/webpack.config.js`.

**Change both together.** A source added to one and not the other works on
the web and breaks in the apps, or the other way round.

## Changing the Policy

1. Add only the specific source you need, to the specific directive, with
   a comment saying what needs it.
2. Make the same change to the meta tag in `webpack.config.js`.
3. Check the browser console on the pages that use it for CSP violations,
   in the browser and an app.
4. Never add `'unsafe-inline'` or `'unsafe-eval'` to `script-src`.

CORS for the apps' origins is separate, in `app.js`; see
[Request Pipeline](request-pipeline.md).
