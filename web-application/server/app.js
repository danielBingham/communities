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
const session = require('express-session')
const cors = require('cors')

const morgan = require('morgan')

const { Client, Pool } = require('pg')
const pgSession = require('connect-pg-simple')(session)

const BullQueue = require('bull')

const path = require('path')
const fs = require('fs')
const Uuid = require('uuid')

const { Core, FeatureFlags, FeatureService, ServerSideRenderingService, PageMetadataService } = require('@communities/backend')
const ControllerError = require('./errors/ControllerError')

/**********************************************************************
 * Load Configuration
 **********************************************************************/
const config = require('./config') 

const core = new Core('web-application', config)
core.initialize()

// Load express.
const app = express()

app.use(cors({
    origin: core.config.s3.bucket_url,
    methods: [ 'GET' ]
}))

// Use a development http logger.
app.use(morgan('dev'))

// Make sure the request limit is large so that we don't run into it.
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ limit: "50mb", extended: false }))

// Set up our session storage.  We're going to use database backed sessions to
// maintain a stateless app.
core.logger.info('Setting up the database backed session store.')
const sessionStore = new pgSession({
    pool: core.database,
    createTableIfMissing: true
})
app.use(session({
    key: core.config.session.key,
    secret: core.config.session.secret,
    store: sessionStore,
    resave: false,
    saveUninitialized: true,
    proxy: true,
    cookie: { 
        path: '/',
        httpOnly: true,
        // TODO TECHDEBT 
        //secure: true,
        //secure: config.session.secure_cookie,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 14 // 14 days, two weeks

    } 
}))

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

// Set the id the logger will use to identify the session.  We don't want to
// use the actual session id, since that value is considered sensitive.  So
// instead we'll just use a uuid.
app.use(function(request, response, next) {
    if ( request.session.user ) {
        core.logger.setId(request.session.user.id)
    } else {
        if ( request.session.logId ) {
            core.logger.setId(request.session.logId)
        } else {
            request.session.logId = Uuid.v4()
            core.logger.setId(request.session.logId)
        }
    }
    next()
})

// Get the api router, pre-wired up to the controllers.
const router = require('./router')(core)

// Load our router at the ``/api/v0/`` route.  This allows us to version our api. If,
// in the future, we want to release an updated version of the api, we can load it at
// ``/api/v1/`` and so on, with out impacting the old versions of the router.
if( process.env?.MAINTENANCE_MODE === 'true' ) {
    core.logger.info('Entering maintenance mode.')

    app.use(core.config.backend, function(request, response) {
        response.json({
            maintenance_mode: true
        })
    })
} else {
    core.logger.info(`Configuring the API Backend on path '${core.config.backend}'`)

    app.use(core.config.backend, router)
}

app.get('/health', function(request, response) {
    response.status(200).send()
})

/**
 * Send configuration information up to the front-end.  Be *very careful*
 * about what goes in here.
 */
app.get('/config', function(request, response) {
    response.status(200).json({
        backend: core.config.backend, 
        environment: process.env.NODE_ENV,
        log_level: core.config.log_level,
        maintenance_mode: process.env.MAINTENANCE_MODE === 'true' ? true : false,
        stripe: {
            portal: core.config.stripe.portal,
            links: core.config.stripe.links
        },
        features: core.features.features
    })
})

/**
 * Handle requests for static image and pdf files.  We'll send these directly
 * to the public path.
 */
app.get(/.*\.(svg|ico|pdf|jpg|png)$/, function(request, response) {
    const filepath = path.join(process.cwd(), 'public', request.originalUrl)
    response.sendFile(filepath)
})


/**
 * For javascript files and the index file we need to use different logic on
 * development and production.
 *
 * On development, we're going to use the webpack-dev-middleware to generate
 * the assets on the fly.  For production, we render the assets generated by
 * the webpack build from the `/dist` directory.
 *
 * For the index.html template, we need to run it through our server side 
 * rendering logic to populate the <head> with the page metadata.  We'll
 * do this for both development and production.
 *
 * TECHDEBT the webpack-dev-middleware server side rendering logic is
 * experimental, it may break on us in future versions.
 */
const serverSideRenderingService = new ServerSideRenderingService(core)
const pageMetadataService = new PageMetadataService(core)
if ( core.config.environment == 'development' ) {
    const webpack = require('webpack')
    const webpackMiddleware = require('webpack-dev-middleware')
    const webpackConfig = require('../webpack.config')

    webpackConfig.mode = 'development'

    const compiler = webpack(webpackConfig)
    app.use(webpackMiddleware(compiler, { 
        publicPath: webpackConfig.output.publicPath,
        serverSideRender: true,
        index: false
    }))

    app.use(function(request, response) {
        core.logger.debug(`Index File Request with webpack-dev-middleware server side rendering.`)
        const { devMiddleware } = response.locals.webpack
        const { assetsByChunkName, outputPath } = devMiddleware.stats.toJson() 

        const metadata = pageMetadataService.getRootWithDevAssets(assetsByChunkName)
        const parsedTemplate = serverSideRenderingService.renderIndexTemplate(metadata) 
        response.send(parsedTemplate)
    })
} else {

    // Javascript files go to dist.
    app.get(/.*\.(css|js|js.map)$/, function(request, response) {
        const filepath = path.join(process.cwd(), 'public/dist', request.originalUrl)
        response.sendFile(filepath)
    })

    // Everything else goes to the index file.
    app.use('*', function(request,response) {
        const metadata = pageMetadataService.getRoot()
        const parsedTemplate = serverSideRenderingService.renderIndexTemplate(metadata) 
        response.send(parsedTemplate)
    })
}

// error handler
app.use(function(error, request, response, next) {
    console.error(error)
    try {
        // Log the error.
        if ( error instanceof ControllerError ) {
            if ( error.status < 500 ) {
                core.logger.warn(error)
            } else {
                core.logger.error(error)
            }
        } else {
            core.logger.error(error)
        }

        if ( error instanceof ControllerError) {
            response.status(error.status).json({
                error: {
                    type: error.type, 
                    message: error.publicMessage
                }
            })
            return 
        } else { 
            response.status(500).json({ 
                error: {
                    type: 'server-error',
                    message: `Something went wrong on the backend in a way we couldn't handle.  Please report this as a bug!`
                }
            })
            return
        }
    } catch (secondError) {
        // If we fucked up something in our error handling.
        core.logger.error(secondError)
        response.status(500).json({ 
            error: {
                type: 'server-error',
                message: `Something went wrong on the backend in a way we couldn't handle.  Please report this as a bug!`
            }
        })
    }
})


module.exports = { 
    app: app,
    core: core
}
