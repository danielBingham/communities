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
    Core, 
    FeatureFlags, 
    FeatureService, 
    ServerSideRenderingService, 
    PageMetadataService, 
    TokenService 
} = require('@communities/backend')

const { createLogMiddleware } = require('./log')
const { createCSRFMiddleware } = require('./csrf')
const { createErrorsMiddleware } = require('./errors')

const createRouter = require('./router')



/**********************************************************************
 * Load Configuration
 **********************************************************************/
const config = require('./config') 

const createExpressApp = function(core, sessionParser) {
    core.logger.info(`Initializing the Express App...`)
    // Load express.
    const app = express()

    app.use(cors({
        origin: [ core.config.host, 'capacitor://localhost' ],
        methods: [ 'GET', 'POST', 'PATCH', 'DELETE' ],
        allowedHeaders: [ 'Content-Type', 'Accept', 'X-Communities-CSRF-Token' ]
    }))

    // Trust the proxy.
    app.set('trust proxy', true)

    // Make sure the request limit is large so that we don't run into it.
    app.use(express.json({ limit: "50mb" }))
    app.use(express.urlencoded({ limit: "50mb", extended: false }))

    // Set up our session storage.  We're going to use database backed sessions to
    // maintain a stateless app.
    app.use(sessionParser)

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
    app.use(function(request, response, next) {
        const featureService = new FeatureService(core)
        featureService.getEnabledFeatures().then(function(features) {
            core.features = new FeatureFlags(features)
            next()
        })
    })

    // Perform the CSRF check, checking the token provided in the header
    // against the one stored in the session.
    app.use(createCSRFMiddleware(core))

    // Get the api router, pre-wired up to the controllers.
    const router = createRouter(core)

    // Load our router at the ``/api/v0/`` route.  This allows us to version our api. If,
    // in the future, we want to release an updated version of the api, we can load it at
    // ``/api/v1/`` and so on, with out impacting the old versions of the router.
    core.logger.info(`Configuring the API Backend on path '${core.config.backend}'`)
    app.use(core.config.backend, router)

    app.get('/health', function(request, response) {
        response.status(200).send()
    })

    /**
     * Send configuration information up to the front-end.  Be *very careful*
     * about what goes in here.
     */
    app.get('/config', function(request, response) {
        const tokenService = new TokenService(core)

        // Only generate a new CSRF Token if we don't have one. Since we're
        // storing it in the session, we'll need to generate a new one
        // anytime we destroy the session, which is the desired behavior.
        if ( request.session?.csrfToken === undefined  || request.session?.csrfToken === null ) {
            request.session.csrfToken = tokenService.createToken()
        }

       response.status(200).json({
            version: process.env.npm_package_version,
            host: core.config.host,
            wsHost: core.config.wsHost,
            backend: core.config.backend, 
            environment: process.env.NODE_ENV,
            log_level: core.config.log_level,
            maintenance_mode: process.env.MAINTENANCE_MODE === 'true' ? true : false,
            stripe: {
                portal: core.config.stripe.portal,
                links: core.config.stripe.links
            },
            csrf: request.session.csrfToken,
            features: core.features.features
        })
    })

    app.get('/version', function(request, response) {
        response.status(200).json({
            version: process.env.npm_package_version,
        })
    })

    app.get('/\/dist\/dist\.zip$/', function(request, response) {
        console.log(`Getting new distribution.`)
        const filepath = path.join(process.cwd(), 'public/dist/dist.zip')
        response.sendFile(filepath)
    })

    /**
     * Handle requests for static image and pdf files.  We'll send these directly
     * to the public path.
     */
    app.get(/.*\.(svg|ico|pdf|jpg|png)$/, function(request, response) {
        const filepath = path.join(process.cwd(), 'public', request.originalUrl)
        response.sendFile(filepath)
    })

    // Javascript files go to dist.
    app.get(/.*\.(css|js|js.map)$/, function(request, response) {
        const filepath = path.join(process.cwd(), 'public/dist', request.originalUrl)
        response.sendFile(filepath)
    })

    // Everything else goes to the index file.
    app.all('{*any}', function(request,response) {
        request.logger.debug(`Loading index file.`)
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
