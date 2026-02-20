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
 *      API Backend Server
 *
 * Provides the API backend for the Peer Review website.  Implements a RESTful
 * API.  Runs as a stateless node server, with state pushed out to either a
 * Redis instance or a MySQL database.
 *
 ******************************************************************************/

const express = require('express')
const cors = require('cors')

const path = require('path')

const { 
    FeatureFlags, 
    FeatureService, 
} = require('@communities/backend')

const { createLogMiddleware } = require('./log')
const { createCSRFMiddleware } = require('./csrf')
const { createErrorsMiddleware } = require('./errors')

const createRouter = require('./router')

const createExpressApp = function(core, sessionParser) {
    core.logger.info(`Initializing the Express App...`)
    // Load express.
    const app = express()

    // Use the extended parser so we use 'qs' to parse query strings.
    // We use 'qs' on the frontend to create them.
    app.set('query parser', 'extended') 

    // Trust the proxy.
    app.set('trust proxy', true)

    // Make sure the request limit is large so that we don't run into it.
    app.use(express.json({ limit: "50mb" }))
    app.use(express.urlencoded({ limit: "50mb", extended: false }))


    app.use(cors({
        origin: [ core.config.host, 'capacitor://localhost', 'https://localhost' ],
        methods: [ 'GET', 'POST', 'PATCH', 'DELETE' ],
        allowedHeaders: [ 
            'Content-Type', 'Accept', 'Cache-Control',
            'Sec-WebSocket-Protocol',
            'X-Communities-CSRF-Token', 'X-Communities-Platform', 'X-Communities-Auth' 
        ],
        exposedHeaders: '*'
    }))

    app.use('/api', function(request, response, next) {
        // Don't cache API responses.  We'll take care of that in redux.
        response.setHeader('Cache-Control', 'no-store')
        next()
    })

    // Set up our session storage.  We're going to use database backed sessions to
    // maintain a stateless app.
    //
    // We only want to setup the sessions for API requests.  We don't care
    // about them for requests for static assets.
    app.use('/api', function(request, response, next) {
        sessionParser(request, response, next)
    })

    // Request and log initialization middleware
    app.use(createLogMiddleware(core))


    // Set the feature flags on each request, so that they are always up to date.
    // This means we can't use feature flags in Controller, Service, and DAO
    // constructors, since those are called at startup time.
    //
    // TECHDEBT This is pretty awkward, and it's worth considering if we want to
    // change something here. Should we be creating Controllers, Services, and DAOs
    // just in time so that we can use Feature Flags in constructors?
    //
    // Or is it better to retain this pattern? Does it save memory to use a single
    // instance created at startup?  Is it enough that we care?
    //
    // Feature flags only matter for API requests.
    app.use('/api', function(request, response, next) {
        const featureService = new FeatureService(core)
        featureService.getEnabledFeatures().then(function(features) {
            core.features = new FeatureFlags(features)
            next()
        })
    })

    // Perform the CSRF check, checking the token provided in the header
    // against the one stored in the session.
    //
    // We only care about CSRF for the API.  For static assets it doesn't
    // matter.
    app.use('/api', createCSRFMiddleware(core))

    // Get the api router, pre-wired up to the controllers.
    const router = createRouter(core)

    // Load our router at the ``/api/v0/`` route.  This allows us to version our api. If,
    // in the future, we want to release an updated version of the api, we can load it at
    // ``/api/v1/`` and so on, with out impacting the old versions of the router.
    core.logger.info(`Configuring the API Backend on path '/api/0.0.0'`)
    app.use('/api/0.0.0', router)

    // Super simple health check, minimal work.
    app.get('/health', function(request, response) {
        response.status(200).send()
    })

    // ==================== Static Asset Requests =============================
    // These are requests for static assets where we just want to return the
    // asset and do no additional work.
    // ========================================================================

    app.get('/dist/dist.zip', function(request, response) {
        core.logger.verbose(`Request for distro bundle.`)
        core.logger.verbose(`Process: `, process.cwd())
        const filepath = path.join(process.cwd(), 'public/dist/dist.zip')
        core.logger.verbose(`Filepath: `, filepath)
        response.sendFile(filepath)
    })

    app.get('/.well-known/apple-app-site-association', function(request, response) {
        core.logger.verbose(`Request for apple site association.`)
        const json = {
            "applinks": {
                "apps": [],
                "details": [
                    {
                        "appID": "GAK47A8S5M.social.communities",
                        "paths": ["*"]
                    },
                    {
                        "appID": "GAK47A8S5M.social.communities.staging",
                        "paths": ["*"]
                    },
                    {
                        "appID": "GAK47A8S5M.social.communities.local",
                        "paths": ["*"]
                    }
                ]
            }
        }
        response.json(json)
    })

    app.get('/.well-known/assetlinks.json', function(request, response) {
        core.logger.verbose(`Request for Android Asset Links.`)
        let json = [
            {
                "relation": ["delegate_permission/common.handle_all_urls"],
                "target": {
                    "namespace": "android_app",
                    "package_name": "social.communities",
                    "sha256_cert_fingerprints":
                    ["FD:47:DA:14:D7:86:25:1A:92:B6:B0:C8:C1:77:7B:F2:EF:12:C8:27:9D:FF:DB:ED:72:56:4C:48:6B:97:E4:76"]
                }
            }
        ]
        if ( process.env.NODE_ENV === 'staging' ) {
            json = [
                {
                    "relation": ["delegate_permission/common.handle_all_urls"],
                    "target": {
                        "namespace": "android_app",
                        "package_name": "social.communities.staging",
                        "sha256_cert_fingerprints":
                        ["7C:32:5C:22:C1:83:AB:E5:D7:0B:D7:9B:8D:19:5E:EB:22:5F:9E:02:61:00:9C:CD:91:1B:6A:78:5A:E7:AE:1F"]
                    }
                }
            ]
        }
        response.json(json)
    })

    app.get('/favicon.svg', function(request, response) {
        const filepath = path.join(process.cwd(), 'public/', request.originalUrl)
        response.sendFile(filepath)
    })

    /**
     * Any other static images are going to be bundled into the dist.
     */
    app.get(/.*\.(svg|ico|jpg|png)$/, function(request, response) {
        const filepath = path.join(process.cwd(), 'public/dist', request.originalUrl)
        response.sendFile(filepath)
    })

    // Javascript files go to dist.
    app.get(/.*\.(css|js|js.map)$/, function(request, response) {
        const filepath = path.join(process.cwd(), 'public/dist', request.originalUrl)
        response.sendFile(filepath)
    })

    // Everything else goes to the index file.
    app.all('{*any}', function(request,response) {
        request.logger.verbose(`Loading index file.`)
        const filepath = path.join(process.cwd(), 'public/dist/index.html')
        response.sendFile(filepath)
    })

    // Register the error handler.
    app.use(createErrorsMiddleware(core))

    return app
}

module.exports = { 
    createExpressApp: createExpressApp
}
