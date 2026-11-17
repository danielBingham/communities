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

const fs = require('fs')
const path = require('path')
const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm")

const { LogEmailDriver, PostmarkEmailDriver } = require('./services/email')
const { FilesystemStorage, S3Storage } = require('./services/storage')
const { AndroidPushDriver, IOSPushDriver, LogPushDriver } = require('./services/push')
const { checkSSLConfig } = require('./lib/database-tls')
const { checkRedisConfig } = require('./lib/redis-connection')

/**
 * The environments a configuration definition file can exist for, selected by
 * NODE_ENV: `config/index.<environment>.js`.
 */
const ENVIRONMENTS = [ 'production', 'staging', 'development' ]

/**
 * A value read from AWS Systems Manager Parameter Store. The path is prefixed
 * with the COMMUNITIES_ENVIRONMENT_NAME environment variable:
 * `'aws-ssm-parameter:/database/host'` reads `/<environment name>/database/host`.
 */
const SSM_PREFIX = 'aws-ssm-parameter:'

/**
 * A value read from an environment variable: `'env:COMMUNITIES_DATABASE_HOST'`.
 */
const ENV_PREFIX = 'env:'

/**
 * The environment variable that holds the Parameter Store path prefix.
 */
const ENVIRONMENT_NAME_VARIABLE = 'COMMUNITIES_ENVIRONMENT_NAME'

/**
 * The settings the `database` and `redis` blocks must have.
 */
const REQUIRED = {
    database: [ 'host', 'port', 'user', 'password', 'name' ],
    redis: [ 'host', 'port' ]
}

/**
 * The drivers each block can turn on, by name. `email` and `storage` select
 * one with their `driver` value; each block under `notifications` turns on
 * the driver with the same name. Every driver checks its own settings with
 * its static validateConfig().
 */
const DRIVERS = {
    email: { postmark: PostmarkEmailDriver, log: LogEmailDriver },
    storage: { s3: S3Storage, filesystem: FilesystemStorage },
    notifications: { ios: IOSPushDriver, android: AndroidPushDriver, log: LogPushDriver }
}

/**
 * Thrown when the configuration can't be loaded (no definition file for the
 * environment, or values that couldn't be found) or isn't valid.
 */
class ConfigError extends Error {
    constructor(message, missing) {
        super(message)
        this.name = 'ConfigError'

        /**
         * The values that couldn't be found, as `{ key, source }`: the
         * configuration key (e.g. `database.host`) and where it should have
         * come from (e.g. `env:COMMUNITIES_DATABASE_HOST`).
         */
        this.missing = missing ?? []
    }
}

/**
 * Loads a configuration definition: an object whose string values declare
 * where each configuration value comes from.
 *
 *   'aws-ssm-parameter:/database/host'   Parameter Store, at
 *                                        /$COMMUNITIES_ENVIRONMENT_NAME/database/host
 *   'env:COMMUNITIES_DATABASE_HOST'      the environment variable
 *   anything else                        used as written
 *
 * The definition is the only source of truth: a value is read from the
 * environment if, and only if, the definition says `env:` for it. Every value
 * that can't be found is reported together in a single ConfigError.
 */
module.exports = class Config {

    /**
     * @param {string} environmentName  The Parameter Store path prefix, from
     * COMMUNITIES_ENVIRONMENT_NAME. Only needed when the definition has
     * `aws-ssm-parameter:` values.
     * @param {string} region   AWS region, for Parameter Store.
     * @param {Object} [options]
     * @param {Object} [options.env]    The environment that `env:` values,
     * and the AWS credentials for Parameter Store (see awsCredentials()), are
     * read from. Defaults to `process.env`.
     * @param {Object} [options.client] An SSM client to use instead of
     * constructing one.
     */
    constructor(environmentName, region, options = {}) {
        this.environmentName = environmentName
        this.region = region
        this.env = options.env ?? process.env

        // Created on first use, so a definition with no `aws-ssm-parameter:`
        // values never needs AWS.
        this.client = options.client ?? null
    }

    /**
     * Load the configuration definition for an environment:
     * `<directory>/index.<environment>.js`.
     *
     * @param {string} directory    The app's config directory.
     * @param {string} environment  NODE_ENV: one of production, staging or
     * development.
     *
     * @return {Object} The configuration definition.
     *
     * @throws {ConfigError} When the environment isn't one of those, or its
     * file doesn't exist.
     */
    static definitionFor(directory, environment) {
        // Checked against a fixed list, so NODE_ENV can't name another file.
        if ( ! ENVIRONMENTS.includes(environment) ) {
            throw new ConfigError(`NODE_ENV must be one of ${ENVIRONMENTS.join(', ')}, but it's '${environment ?? ''}'.`)
        }

        const file = path.join(directory, `index.${environment}.js`)
        if ( ! fs.existsSync(file) ) {
            if ( environment === 'development' ) {
                throw new ConfigError(`There's no development configuration at ${file}. Create it by copying `
                    + `index.development.js-env-example (values from environment variables) or `
                    + `index.development.js-ssm-example (values from Parameter Store) in the same folder.`)
            }
            throw new ConfigError(`There's no configuration for '${environment}' at ${file}.`)
        }

        console.log(`Using configuration file ${file}`)
        return require(file)
    }

    /**
     * Load a configuration definition, in a single walk.
     *
     * Every value that names a source is loaded from it; every other value is
     * used as written. Values that can't be loaded are collected, with their
     * key path, and reported together.
     *
     * @param {Object} configDefinition The definition, as returned by
     * definitionFor().
     *
     * @return {Promise<Object>} The configuration, with the same shape as the
     * definition.
     *
     * @throws {ConfigError} When any value can't be loaded.
     */
    async loadConfig(configDefinition) {
        // How many values each source supplied.
        const tally = { ssm: 0, env: 0 }
        const missing = []

        const walk = async (definition, prefix) => {
            const config = {}

            for (const [key, value] of Object.entries(definition)) {
                const keyPath = prefix ? `${prefix}.${key}` : key

                if ( typeof value === 'object' && value !== null && ! Array.isArray(value) ) {
                    config[key] = await walk(value, keyPath)
                } else if ( typeof value === 'string' ) {
                    const source = Config.parseSource(value)

                    if ( source === null ) {
                        config[key] = value
                        continue
                    }

                    tally[source.type] += 1
                    const loaded = source.type === 'env'
                        ? this.loadEnvironmentVariable(source.name)
                        : await this.loadAWSParameter(source.name)

                    if ( loaded === undefined ) {
                        missing.push({ key: keyPath, source: value })
                    } else {
                        config[key] = loaded
                    }
                } else {
                    config[key] = value
                }
            }

            return config
        }

        const config = await walk(configDefinition, '')

        if ( missing.length > 0 ) {
            throw new ConfigError(this.describeMissing(missing), missing)
        }

        console.log(`Configuration loaded: ${tally.ssm} value(s) from Parameter Store`
            + (tally.ssm > 0 ? ` under '/${this.environmentName}'` : '')
            + `, ${tally.env} from environment variables.`)

        return config
    }

    /**
     * Parse a definition value.
     *
     * @return {Object|null} `{ type, name }` for an `aws-ssm-parameter:`
     * (`type: 'ssm'`) or `env:` (`type: 'env'`) value, or null for a value
     * that's used as written.
     */
    static parseSource(value) {
        if ( value.startsWith(SSM_PREFIX) ) {
            return { type: 'ssm', name: value.substring(SSM_PREFIX.length) }
        }
        if ( value.startsWith(ENV_PREFIX) ) {
            return { type: 'env', name: value.substring(ENV_PREFIX.length) }
        }
        return null
    }

    /**
     * Load one value from an environment variable.
     *
     * @param {string} name The variable, e.g. `COMMUNITIES_DATABASE_HOST`.
     *
     * @return {string|undefined} The value, or undefined when the variable is
     * unset or empty.
     */
    loadEnvironmentVariable(name) {
        const value = this.env[name]
        return value === '' ? undefined : value
    }

    /**
     * The AWS credentials to read Parameter Store with, chosen from the
     * environment. There are only two kinds:
     *
     * - Access keys, when AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are
     *   both set. Local environments use these: the keys of an IAM user made
     *   for the environment, so the app runs with that user's permissions
     *   rather than the developer's.
     * - EKS Pod Identity, when AWS_CONTAINER_CREDENTIALS_FULL_URI and
     *   AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE are set. EKS sets them in a
     *   pod whose ServiceAccount has a Pod Identity association, which is how
     *   staging and production run. The SDK's container credential provider
     *   then gets the role's credentials from the Pod Identity agent, and
     *   refreshes them.
     *
     * Keys win when a pod has both, so a pod moves to Pod Identity when its
     * keys are taken away. Anything else is refused rather than left to the
     * SDK's default chain, which would go on to a profile or login in
     * ~/.aws, or to the instance's role: the app never runs as whoever
     * happens to be signed in to AWS.
     *
     * @param {Object} env  The environment, e.g. `process.env`.
     *
     * @return {Object} `{ source, credentials }`: what the credentials are,
     * for the log, and the `credentials` to give the SDK client. That's the
     * key pair, or undefined for Pod Identity, which the SDK finds itself.
     *
     * @throws {ConfigError} When only one of the keys is set, or there are
     * neither keys nor Pod Identity.
     */
    static awsCredentials(env) {
        const accessKeyId = env.AWS_ACCESS_KEY_ID || undefined
        const secretAccessKey = env.AWS_SECRET_ACCESS_KEY || undefined

        if ( accessKeyId && secretAccessKey ) {
            return {
                source: 'the access keys in AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY',
                credentials: { accessKeyId: accessKeyId, secretAccessKey: secretAccessKey }
            }
        }

        if ( accessKeyId || secretAccessKey ) {
            throw new ConfigError(`Only one of AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY is set. `
                + `Set both to read Parameter Store with access keys, or neither in a pod with EKS Pod Identity.`)
        }

        if ( env.AWS_CONTAINER_CREDENTIALS_FULL_URI && env.AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE ) {
            return { source: 'EKS Pod Identity', credentials: undefined }
        }

        throw new ConfigError(`There are no AWS credentials to read Parameter Store with. Set `
            + `AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to an access key for the environment's IAM user, `
            + `or run in a pod whose ServiceAccount has an EKS Pod Identity association. `
            + `AWS profiles and logins aren't used.`)
    }

    /**
     * Load one value from Parameter Store, under the environment name.
     *
     * @param {string} parameter    The path from the definition, without the
     * environment name prefix, e.g. `/database/host`.
     *
     * @return {Promise<string|undefined>} The value, or undefined when the
     * parameter doesn't exist or COMMUNITIES_ENVIRONMENT_NAME isn't set.
     */
    async loadAWSParameter(parameter) {
        // Without the prefix there's nowhere to look. describeMissing() says so.
        if ( ! this.environmentName ) {
            return undefined
        }

        if ( this.client === null ) {
            const { source, credentials } = Config.awsCredentials(this.env)
            console.log(`Reading Parameter Store with ${source}.`)
            this.client = new SSMClient({
                region: this.region,
                credentials: credentials
            })
        }

        const fullyQualifiedParameterPath = this.parameterPath(parameter)
        const command = new GetParameterCommand({
            Name: fullyQualifiedParameterPath,
            WithDecryption: true
        })
        try {
            const response = await this.client.send(command)
            return response.Parameter.Value
        } catch (error) {
            if ( error?.name === 'ParameterNotFound' ) {
                return undefined
            }
            console.error(`Got error while loading parameter: '${fullyQualifiedParameterPath}'::`, error)
            throw error
        }
    }

    /**
     * Check a loaded configuration, so mistakes stop the app as it starts
     * rather than when something first uses them:
     *
     * - the `database` and `redis` blocks have their required settings;
     * - `database.ssl` is a known mode, and with 'verify-full',
     *   `database.certificateAuthorities` holds a currently valid PEM
     *   certificate and the host is a name (see lib/database-tls.js);
     * - `redis.tls` and `redis.auth` are known modes, a token goes with
     *   'verify-full' and is one ElastiCache accepts, and with 'verify-full'
     *   the host is a name (see lib/redis-connection.js);
     * - `email.driver` and `storage.driver` name a known driver, and each
     *   block under `notifications` is a known push driver;
     * - each driver that's selected or turned on accepts its block (see each
     *   driver's static validateConfig()).
     *
     * @param {Object} config   An app's configuration, as loadConfig()
     * returns it.
     *
     * @throws {ConfigError} When anything is wrong, listing every problem.
     */
    validateConfig(config) {
        const problems = []

        for (const [block, keys] of Object.entries(REQUIRED)) {
            for (const key of keys) {
                if ( ! config[block]?.[key] ) {
                    problems.push(`The configuration needs ${block}.${key}.`)
                }
            }
        }

        problems.push(...checkSSLConfig(config.database))
        problems.push(...checkRedisConfig(config.redis))

        // Ask a driver to check its block, recording what it finds.
        const validate = (Driver, settings) => {
            try {
                Driver.validateConfig(settings, config.environment)
            } catch (error) {
                problems.push(error.message)
            }
        }

        for (const block of [ 'email', 'storage' ]) {
            const name = config[block]?.driver
            if ( Object.hasOwn(DRIVERS[block], name ?? '') ) {
                validate(DRIVERS[block][name], config[block][name])
            } else {
                problems.push(`${block}.driver in the configuration must be one of `
                    + `${Object.keys(DRIVERS[block]).map((driver) => `'${driver}'`).join(' or ')}, but it's '${name ?? ''}'.`)
            }
        }

        for (const [name, settings] of Object.entries(config.notifications ?? {})) {
            if ( Object.hasOwn(DRIVERS.notifications, name) ) {
                validate(DRIVERS.notifications[name], settings)
            } else {
                problems.push(`notifications.${name} in the configuration isn't a push driver. `
                    + `Each block under notifications must be one of 'ios', 'android' or 'log'.`)
            }
        }

        if ( problems.length > 0 ) {
            throw new ConfigError(`Invalid configuration: ${problems.length} problem(s).\n`
                + problems.map((problem) => `  ${problem}`).join('\n'))
        }
    }

    parameterPath(parameter) {
        return path.posix.join(`/${this.environmentName ?? ''}`, parameter)
    }

    describeMissing(missing) {
        const width = Math.max(...missing.map((m) => m.key.length))
        const lines = missing.map((m) => {
            const source = Config.parseSource(m.source)
            let detail = `${m.source} (not set)`
            if ( source.type === 'ssm' ) {
                detail = this.environmentName
                    ? `aws-ssm-parameter:${this.parameterPath(source.name)} (not in Parameter Store)`
                    : `${m.source} (not loaded)`
            }
            return `  ${m.key.padEnd(width)}  ${detail}`
        })

        let message = `Missing configuration: ${missing.length} value(s) not found.\n` + lines.join('\n')

        if ( ! this.environmentName && missing.some((m) => Config.parseSource(m.source).type === 'ssm') ) {
            message += `\n${ENVIRONMENT_NAME_VARIABLE} isn't set, so no aws-ssm-parameter: value could be loaded.`
        }

        return message
    }
}

module.exports.ConfigError = ConfigError
module.exports.ENVIRONMENTS = ENVIRONMENTS
