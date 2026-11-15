# Building the Client

How the client is built and served: webpack and Babel, the dev server, the
builds for each environment, and what the apps get.

**Code:** `web-application/webpack.config.js`,
`web-application/babel.config.js`, `web-application/package.json`,
`web-application/server/views/index.html`

## Webpack

| Setting | Value |
| ------- | ----- |
| Entry | `client/index.js` |
| Output | `public/dist/`, as `[name].[hash].bundle.js`, cleaned each build |
| `index.html` | Built from `server/views/index.html` by `HtmlWebpackPlugin`, with `<meta>` tags for the host, API path, environment and version, and the Content Security Policy the apps use |
| Imports | `/` resolves from `client/` (`resolve.roots`) |
| JavaScript | Babel: `@babel/preset-env`, `@babel/preset-react` (automatic runtime), `@babel/plugin-transform-runtime`. `packages/` isn't transpiled. |
| CSS | `css-loader` and `style-loader`, so styles are bundled into the JavaScript |
| Images | `.png`, `.svg` and `.jpg` imports become files in the output |
| Source maps | Always (`devtool: source-map`); uploaded to Sentry when `SENTRY_AUTH_TOKEN` is set |

The host, WebSocket host and environment in `index.html` come from
`NODE_ENV` at build time, so a bundle is built for one environment.

## Scripts

From the repository root:

| Command | Builds |
| ------- | ------ |
| `npm run build` | Production, then `npx cap sync` for the apps. |
| `npm run build-staging` | Staging, then `npx cap sync`. |
| `npm run build-dev` | Development, then `npx cap sync`. |

Each runs `web-application`'s build, which empties `public/dist/`, runs
webpack, and zips the output into `public/dist/dist.zip`, the bundle the
apps download as a live update (see [Live Updates](../mobile/live-updates.md)).
`npx cap sync` copies the build into the native projects (see
[Capacitor](../mobile/capacitor.md)).

The web application's Docker image builds the client for its environment
as part of the image.

## The Dev Server

In development (`npm run dev`, or the web application container), webpack's
dev server runs on 3000 with the local HTTPS certificate, and:

- serves the bundles, rebuilding when the client changes (no hot reload:
  reload the page);
- proxies `/api/0.0.0`, `/health` and `/socket` (WebSocket) to Express on
  8443;
- proxies page requests (a `GET` for HTML) to Express too, which renders
  each page's metadata into `index.html`;
- writes its builds to `public/dist/` (`writeToDisk`), so Express has the
  current `index.html` to render from.

## Jest

Client unit tests run with Jest from `web-application` (`npm test`). The
`/` imports are mapped by `moduleNameMapper` in `web-application/package.json`;
add a mapping there if a test imports from a new top-level client
directory.
