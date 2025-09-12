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

const { createLogMiddleware, createLogIdMiddleware } = require('./log')
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

    // Request and log initialization middleware
    app.use(createLogMiddleware(core))

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

    // Assign an ID to the request logger if we have a session.  The ID will
    // follow the requests around.
    app.use('/api', createLogIdMiddleware(core))


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

    app.get('/\/dist\/dist\.zip$/', function(request, response) {
        const filepath = path.join(process.cwd(), 'public/dist/dist.zip')
        response.sendFile(filepath)
    })

    /**
     * Handle requests for static image and pdf files.  We'll send these directly
     * to the public path.
     */
    app.get(/.*\.(svg|ico|jpg|png)$/, function(request, response) {
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
