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
const { Client, Pool } = require('pg')
const BullQueue = require('bull')
const { createClient } = require('redis')

const Events = require('./events')
const Logger = require('./logger')
const { sslMode, sslOptions, describeCertificateAuthorities } = require('./lib/database-tls')
const { createEmailDriver } = require('./services/email')
const { createStorage } = require('./services/storage')

/**
 * The Bull queues, one for each kind of job. Each worker Deployment processes
 * one of them (see worker/index.js); the web application adds jobs to them.
 */
const QUEUES = [
    'process-video',
    'resize-image',
    'send-notifications',
    'add-mutuals-for-relationship',
    'remove-mutuals-for-relationship'
]

/***
 * A wrapper around our core dependencies that will be used by most of our
 * services and controllers.
 */
module.exports = class Core {

    constructor(context, config) {

        /**
         * The context in which we are running the core. One of
         * 'web-application' or 'worker'.
         */
        this.context = context

        /**
         * An instance of backend.Logger that we'll use to write to the logs.
         */
        this.logger = null

        /**
         * An instance of pg.Pool that we'll use to interact with the Postgres
         * database.
         */
        this.database = null

        /**
         * An instance of of Redis Client.
         */
        this.redis = null

        /**
         * An instance of Events, which publishes events to the other
         * instances through Redis and listens for theirs.
         */
        this.events = null

        /**
         * The bull queues, by name (see QUEUES), that we'll use to queue up
         * long running jobs for pickup by the workers.
         */
        this.queues = {}

        /**
         * The email driver selected by `email.driver` in the configuration,
         * which EmailService sends through.
         *
         * @see services/email/index.js
         */
        this.emailDriver = null

        /**
         * The storage driver selected by `storage.driver` in the
         * configuration, where uploaded files are kept.
         *
         * @see services/storage/index.js
         */
        this.storage = null

        /**
         * Our configuration values.
         *
         * @see web-application/server/config/index.js
         * @see worker/config/index.js
         */
        this.config = config

        /**
         * An instance of FeatureFlags, initialized with information on what
         * feature flags are set for the current user.
         *
         * This is initialized separately from the other core dependencies.
         */
        this.features = null

        this.shutdownInProgress = false

    }

    /**
     * Create a connection pool for the database the configuration names.
     *
     * @param {Object} database The configuration's `database` block: host,
     * port, user, password, name and, optionally, ssl and
     * certificateAuthorities (see lib/database-tls.js).
     * @param {Object} [logger] Where to report connections the pool loses.
     * Anything with an `error()` method; defaults to the console.
     *
     * @return {Pool}
     */
    static createDatabasePool(database, logger = console) {
        const databaseConfig = {
            host: database.host,
            user: database.user,
            password: database.password,
            database: database.name,
            port: database.port,
            ssl: sslOptions(database)
        }

        const pool = new Pool(databaseConfig)

        // An idle connection in the pool can still fail: the database
        // restarts, fails over, or drops every connection during a
        // blue/green switchover. pg-pool takes the connection out of the pool
        // and emits the error on the pool. Without a listener, Node treats
        // that as an uncaught exception and the process exits, so every pod
        // holding an idle connection would crash at once. With one, the pool
        // simply opens a new connection the next time it needs one.
        pool.on('error', function(error) {
            logger.error(`Lost an idle database connection; the pool will open a new one when it's needed. `
                + `(${error?.message})`)
        })

        return pool
    }

    /**
     * Check the database answers, and log whether the connection is
     * encrypted, before the app starts taking work. A configuration that
     * can't connect, such as a server certificate that doesn't verify, stops
     * the app as it starts instead of failing every request.
     */
    async checkDatabaseConnection() {
        const results = await this.database.query(`
            SELECT ssl, version, cipher FROM pg_stat_ssl WHERE pid = pg_backend_pid()
        `, [])

        const connection = results.rows[0]
        if ( connection?.ssl === true ) {
            this.logger.info(`Connected to postgres over TLS (${connection.version}, ${connection.cipher}).`)
        } else {
            this.logger.info(`Connected to postgres without TLS (database.ssl is '${sslMode(this.config.database)}').`)
        }
    }

    /**
     * Initialize the common dependencies.
     */
    async initialize() {

        /**********************************************************************
         * Logger Initialization
         **********************************************************************/
        this.logger = new Logger(this.config.log_level)
        this.logger.info(`Starting ${this.config.environment} ${this.context}...`)

        /**********************************************************************
         * Database Connection Initialization
         **********************************************************************/
        this.logger.info(`Connecting to postgres database at ${this.config.database.host}:${this.config.database.port} with ${this.config.database.user}.`)
        if ( sslMode(this.config.database) === 'verify-full' ) {
            this.logger.info(`Trusting these certificate authorities for the database: `
                + `${describeCertificateAuthorities(this.config.database)}.`)
        }
        this.database = Core.createDatabasePool(this.config.database, this.logger)
        await this.checkDatabaseConnection()

        /**********************************************************************
         * Bull Queue Initialization
         **********************************************************************/
        this.logger.info(`Connecting to redis ${this.config.redis.host}:${this.config.redis.port}.`)

        this.redis = createClient({ url: `redis://${this.config.redis.host}:${this.config.redis.port}` })
        this.redis.on('error', err => this.logger.error(`Redis connection error: `, err))
        await this.redis.connect()

        this.events = new Events(this.redis, this.logger)
        await this.events.initialize()

        for (const name of QUEUES) {
            this.queues[name] = new BullQueue(name, { redis: this.config.redis })
        }

        /**********************************************************************
         * Email Driver Initialization
         **********************************************************************/
        this.logger.info(`Using the '${this.config.email?.driver}' email driver.`)
        this.emailDriver = createEmailDriver(this)

        /**********************************************************************
         * Storage Driver Initialization
         **********************************************************************/
        this.logger.info(`Using the '${this.config.storage?.driver}' storage driver.`)
        this.storage = createStorage(this)

        /**********************************************************************
         * Push Notifications
         **********************************************************************/
        // Each NotificationWorker creates its own push drivers (the iOS driver
        // holds a connection), so there's nothing to create here.
        // Config.validateConfig() has already checked their settings.
        const pushDriverNames = Object.keys(this.config.notifications ?? {})
        this.logger.info(pushDriverNames.length > 0
            ? `Sending push notifications with: ${pushDriverNames.join(', ')}.`
            : `Push notifications are off.`)
    }

    async shutdown() {
        if ( this.shutdownInProgress ) {
            this.logger.info('Shutdown called again while already in progress.')
            console.error(new Error('Shutdown called a second time.'))
            return
        }
        this.logger.info('Beginning shutdown of core dependencies...')
        this.shutdownInProgress = true

        // The queues go first. Closing a queue a worker is processing waits
        // for the jobs it's running to finish, and they need Redis and the
        // database to do it.
        this.logger.info('Closing the redis queues.')
        const queues = Object.entries(this.queues)
        const closed = await Promise.allSettled(queues.map(([ , queue ]) => queue.close()))
        closed.forEach((result, index) => {
            if ( result.status === 'rejected' ) {
                this.logger.error(`Couldn't close the '${queues[index][0]}' queue: ${result.reason?.message}`)
            }
        })
        this.queues = {}
        this.logger.info('Redis queues closed.')

        this.logger.info('Closing the redis connections.')
        await this.closeQuietly('the events subscriber', () => this.events?.shutdown())
        await this.closeQuietly('the redis client', () => this.redis?.close())
        this.events = null
        this.redis = null
        this.logger.info('Redis connections closed.')

        this.logger.info('Closing the connection pool.')
        await this.database.end()
        this.database = null
        this.logger.info('Connection pool closed.')
    }

    /**
     * Close something during shutdown, logging rather than throwing if it
     * fails, so the rest still gets closed.
     *
     * @param {string} name What's being closed, for the log.
     * @param {function} close Closes it; may return a promise.
     */
    async closeQuietly(name, close) {
        try {
            await close()
        } catch (error) {
            this.logger.error(`Couldn't close ${name}: ${error?.message}`)
        }
    }
}
