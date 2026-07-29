/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media
 *  Copyright (C) 2022 - 2024 Daniel Bingham
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
/******************************************************************************
 *      Security Headers Middleware (Helmet)
 *
 * Configures `helmet` to set the security response headers (CSP, HSTS,
 * X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and the
 * Cross-Origin-* isolation headers).
 *
 * IMPORTANT -- READ BEFORE EDITING
 * --------------------------------
 * This header set is applied to responses served by THIS Express app: the web
 * application at `core.config.host`, its static assets, and the JSON API.
 *
 * It does NOT cover the Capacitor mobile apps. Those load their
 * HTML bundle from a local WebView origin -- `capacitor://localhost` (iOS) and
 * `https://localhost` (Android) -- so this response header never reaches the
 * mobile document. The mobile WebView's CSP has to be delivered as a
 * `<meta http-equiv="Content-Security-Policy">` tag inside the bundled
 * `index.html`.  If you update the directives here, make sure you also update
 * the directives defined in the `index.html` template.
 *
 * What this config DOES do for mobile is make sure the server doesn't block the
 * cross-origin calls those WebViews make back to `core.config.host`:
 *   - Cross-Origin-Resource-Policy is set to `cross-origin` (helmet's default of
 *     `same-origin` would break resources the WebView pulls from this host).
 *   - Cross-Origin-Embedder-Policy is left OFF. Turning it on (`require-corp`)
 *     would break the cross-origin S3 images the web app embeds, since signed
 *     S3 URLs don't send a CORP header.
 * CORS for the Capacitor origins is handled separately in `app.js`.
 *
 ******************************************************************************/

const helmet = require('helmet')

/**
 * Parse a provided configuration URL to just the protocol and host portion to
 * match a CSP directive.  Throws if it fails to parse or is given an invalid
 * URL.  CSP directives are set during startup time and we'd prefer the
 * container crash hard if there's an error so that we can rollback.
 */
const toCSPSource = function(url) {
    if ( ! url || typeof url !== "string" ) {
        throw new Error('Invalid CSP Url.')
    }

    const parsed = new URL(url)
    return `${parsed.protocol}//${parsed.host}`
}


const createSecurityHeadersMiddleware = function(core) {

    return helmet({

        // These are the directives that will be passed to the `Content-Security-Policy` response header.
        // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP
        // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy
        contentSecurityPolicy: {
            // We don't want to use helmet's defaults, because we don't want
            // any surprises to creep in when new headers are added.  Instead,
            // we'll supply a complete set of current headers and as new
            // headers get introduced we'll choose when and how to add them to
            // our set.
            useDefaults: false,

            // Directives in alphabetical order (with the exception of
            // `default-src`, because it's the fallback).
            directives: {
                // Default src is the fallback for most headers we don't define.  This
                // locks it down to self, meaning origin.
                //
                // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/default-src
                'default-src': [ "'self'" ],

                // Controls what the <base> uri tag can point to.  Keep it to
                // origin so someone can't override it.
                //
                // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/base-uri
                'base-uri': [ "'self'" ],

                // Connect src controls which URLS can be loaded with script
                // interfaces. In otherwords, it controls where we can connect
                // to with APIs like `fetch()`.  This list is going to be
                // longer, because we call out to a few different places and we
                // need to account for all of them.
                //
                // We include 'host' in here, because it won't always be the
                // same as 'self'.  For the mobile apps, 'self' is 'localhost'.
                //
                // In the future, we will need to add any client side APIs we
                // use to this.
                //
                // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/connect-src
                'connect-src': [
                    "'self'",
                    toCSPSource(core.config.host), // Primary backend.
                    toCSPSource(core.config.wsHost), // Web socket
                    toCSPSource(core.config.s3.bucket_url),  // Media when we load it through fetch.
                    `https://${core.config.s3.bucket}.s3.us-east-1.amazonaws.com`,  // Media when we load it through fetch.
                    `https://*.sentry.io`, // Sentry
                    `https://*.ingest.us.sentry.io` // Sentry
                ],

                // Controls where we can load fonts from.  We need to include Google
                // Fonts, plus `data:` incase a loaded font includes inline glyphs.
                //
                // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/font-src
                'font-src': [ "'self'", 'https://fonts.gstatic.com', 'data:' ],

                // Controls where forms may submit to.  Keep it locked down to the backend.
                //
                // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/form-action
                'form-action': [ "'self'" ],

                // Controls who can embed communities is an iframe.  Set it to
                // no one to prevent click-jacking attacks.
                //
                // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors
                'frame-ancestors': [ "'none'"],

                // Controls where we can load iframes and other nested browsing
                // context from.  Currently we only use `iframes` for the
                // `youtube` embed feature.
                //
                // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-src
                'frame-src': [ 'https://www.youtube.com' ],

                // Controls where images can be loaded from. Preview images can be
                // loaded from any site right now, so we need to allow `https:`.  In
                // the future, we'll migrate those to images cached on our S3 and then
                // we can lock this down again.
                //
                // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/img-src
                'img-src': [ "'self'", 'data:', 'blob:', 'https:' ],

                // Controls where audo and video files can be loaded from. We
                // need to include our S3 bucket.
                //
                // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/media-src
                'media-src': [ "'self'", 'blob:', toCSPSource(core.config.s3.bucket_url), `https://${core.config.s3.bucket}.s3.us-east-1.amazonaws.com` ],

                // Controls where we can load PWA/Webmanifest from.  We don't
                // use this, so keep it tight.
                //
                // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/manifest-src
                'manifest-src': [ "'self'"],

                // Controls where we can load <object>/<embed>/<aplet> from.
                // We don't currently load any (the youtube embed is an
                // iframe).  Keep it locked down completely.
                //
                // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/object-src
                'object-src': [ "'none'" ],

                // Controls allowed sources for Javascript, including `script` tags and
                // inline loads.
                //
                // Setting this to 'self' allows only our webpack bundled loaded from
                // origin.  NOTE: This won't affect resources loaded from `localhost`
                // in the Capacitor mobile apps.  `localhost` is always considered
                // secure.
                //
                // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src
                'script-src': [ "'self'" ],

                // Blocks inline event handlers (onclick="...") entirely. Our webpack
                // source bundle doesn't generate HTML that uses them.
                //
                // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src-attr
                'script-src-attr': [ "'none'" ],

                // Controls where we can load stylesheets from.  We need
                // `unsafe-inline` here because of the way webpack's `style-loader`
                // works.  We also need to include the Google Fonts api, because fonts
                // can load stylesheets.
                //
                // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/style-src
                'style-src': [ "'self'", "'unsafe-inline'", 'https://fonts.googleapis.com' ],


                // Controls where we can load web worker scripts from.  We
                // don't current use web workers anywhere.
                //
                // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/worker-src
                'worker-src': [ "'self'", 'blob:' ]
            }
        }, // END CSP

        // ---- Cross-Origin isolation headers --------------------------------

        // The mobile apps need resources to allow cross origin from
        // 'localhost', since they run with `localhost` as the origin.
        //
        // The default, 'same-origin', here would break the Capacitor mobile
        // apps.
        crossOriginResourcePolicy: { policy: 'cross-origin' },

        // Controls whether a new origin can be opened in a popup. If we
        // eventually need to support an OAUTH popup of some kind, then we'll
        // need to change this.
        //
        // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Opener-Policy
        crossOriginOpenerPolicy: { policy: 'same-origin' },

        // Controls the loading and embedding of cross origin resources that
        // are requested in `no-cors` mode.  Since we use S3 to host our media,
        // which we need to embed, we need to turn this off.  At least until we
        // fully sort out CORS media requests.
        //
        // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Embedder-Policy
        crossOriginEmbedderPolicy: false,

        // ---- Transport Security --------------------------------------------

        // Forces the use of HTTPS to access the platform and API.
        //
        // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security
        strictTransportSecurity: {
            maxAge: 31536000, // 1 year in seconds, standard default
            includeSubDomains: true,
            preload: false
        },

        // Legacy header to prevent embedding in other sites (prevents
        // clickjacking).  Works as a backup for `frame-ancestors` or as an
        // alternative for older browsers that don't support it.
        //
        // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Frame-Options
        xFrameOptions: { action: 'deny' },

        // Sets the referrer policy, controlling what referrer headers are sent
        // and under what circumstances.
        //
        // We're just sending the origin when the request is cross-origin.
        //
        // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
    })
}

module.exports = {
    createSecurityHeadersMiddleware: createSecurityHeadersMiddleware
}
