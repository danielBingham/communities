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

const path = require('path')
const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm")

/**
 * Prefix that marks a configuration definition value as a parameter to load,
 * e.g. `'aws-ssm-parameter:/database/host'`.
 */
const PARAMETER_PREFIX = 'aws-ssm-parameter:'

/**
 * Prefix for the environment variable that holds a parameter's value.
 */
const VARIABLE_PREFIX = 'COMMUNITIES_'

/**
 * Where parameter values come from.
 *
 * - `ssm`: AWS Systems Manager Parameter Store, under `/<environment>`. The
 *   default, and what staging and production use.
 * - `env`: environment variables only. Nothing is read from AWS, so no AWS
 *   credentials are needed. Development only.
 *
 * Environment variables only ever supply configuration in development
 * (NODE_ENV=development): the `env` source is refused otherwise, and with the
 * `ssm` source a parameter's variable overrides it only in development.
 * Outside development every value comes from Parameter Store, so a variable
 * injected into a container can't change the configuration.
 */
const SOURCES = [ 'ssm', 'env' ]

/**
 * Thrown when the configuration can't be loaded: an unknown source, or
 * parameters with no value.
 */
class ConfigError extends Error {
    constructor(message, missing) {
        super(message)
        this.name = 'ConfigError'

        /**
         * The parameters that had no value, as `{ parameter, variable }`.
         */
        this.missing = missing ?? []
    }
}

/**
 * Loads a configuration definition, replacing every
 * `'aws-ssm-parameter:<path>'` value with the parameter's value.
 *
 * Each parameter path maps to an environment variable: the path without its
 * leading slash, with `/` and `-` replaced by `_`, uppercased and prefixed
 * with `COMMUNITIES_`. For example `/storage/s3/bucket-url` is
 * `COMMUNITIES_STORAGE_S3_BUCKET_URL`.
 *
 * Resolution, per parameter:
 *  1. In development, the environment variable, if it's set and not empty.
 *  2. Otherwise, with the `ssm` source, Parameter Store at
 *     `/<environment><path>`.
 *  3. Otherwise the parameter is missing.
 *
 * Every missing parameter is reported together in a single ConfigError.
 */
module.exports = class Config {

    /**
     * @param {string} environment  The Parameter Store path prefix (the
     * ENVIRONMENT_NAME), used with the `ssm` source.
     * @param {string} region   AWS region, used with the `ssm` source.
     * @param {Object} credentials  AWS credentials, used with the `ssm` source.
     * @param {Object} [options]
     * @param {string} [options.source] `'ssm'` or `'env'`. Defaults to the
     * CONFIG_SOURCE environment variable, then `'ssm'`.
     * @param {Object} [options.env]    The environment to read variables,
     * including NODE_ENV and CONFIG_SOURCE, from. Defaults to `process.env`.
     * @param {Object} [options.client] An SSM client to use instead of
     * constructing one.
     */
    constructor(environment, region, credentials, options = {}) {
        this.environment = environment
        this.env = options.env ?? process.env

        // Whether environment variables may supply configuration at all.
        this.development = this.env.NODE_ENV === 'development'

        this.source = options.source || this.env.CONFIG_SOURCE || 'ssm'
        if ( ! SOURCES.includes(this.source) ) {
            throw new ConfigError(`Unknown configuration source '${this.source}'. `
                + `Set CONFIG_SOURCE to one of: ${SOURCES.join(', ')}.`)
        }

        if ( this.source === 'env' && ! this.development ) {
            throw new ConfigError(`CONFIG_SOURCE=env is only allowed in development (NODE_ENV=development), `
                + `but NODE_ENV is '${this.env.NODE_ENV ?? ''}'. Outside development, configuration `
                + `comes from Parameter Store only.`)
        }

        // Only the `ssm` source talks to AWS.
        this.client = null
        if ( this.source === 'ssm' ) {
            this.client = options.client ?? new SSMClient({
                region: region,
                credentials: credentials
            })
        }
    }

    /**
     * The environment variable that holds a parameter's value.
     *
     * @param {string} parameter    The parameter path, e.g. `/database/host`.
     *
     * @return {string} The variable name, e.g. `COMMUNITIES_DATABASE_HOST`.
     */
    static variableName(parameter) {
        return VARIABLE_PREFIX + parameter
            .replace(/^\/+/, '')
            .replace(/[/-]/g, '_')
            .toUpperCase()
    }

    /**
     * Load a configuration definition.
     *
     * @param {Object} configDefinition The definition, as in
     * `web-application/server/config/index.js`.
     *
     * @return {Promise<Object>} The configuration, with the same shape as the
     * definition.
     *
     * @throws {ConfigError} When any parameter has no value.
     */
    async loadConfig(configDefinition) {
        const parameters = this.collectParameters(configDefinition)

        console.log(this.source === 'ssm'
            ? `Loading configuration from Parameter Store under '/${this.environment}'...`
            : `Loading configuration from environment variables (CONFIG_SOURCE=env)...`)

        const isSet = (variable) => this.env[variable] !== undefined && this.env[variable] !== ''

        // Outside development, environment variables never supply
        // configuration. Say so up front (names only, never values) so it's
        // visible even if loading from Parameter Store fails.
        if ( ! this.development ) {
            const ignored = parameters.map((parameter) => Config.variableName(parameter)).filter(isSet)
            if ( ignored.length > 0 ) {
                console.warn(`Configuration: ignoring ${ignored.length} environment variable(s) because NODE_ENV isn't development: ${ignored.join(', ')}`)
            }
        }

        const values = new Map()
        const missing = []
        const overridden = []

        for (const parameter of parameters) {
            const variable = Config.variableName(parameter)

            if ( this.development && isSet(variable) ) {
                values.set(parameter, this.env[variable])
                if ( this.source === 'ssm' ) {
                    overridden.push(variable)
                }
                continue
            }

            if ( this.source === 'ssm' ) {
                const value = await this.loadParameter(parameter)
                if ( value !== undefined ) {
                    values.set(parameter, value)
                    continue
                }
            }

            missing.push({ parameter: parameter, variable: variable })
        }

        // Names only: never log values, most of them are secrets.
        if ( overridden.length > 0 ) {
            console.log(`Configuration: ${overridden.length} parameter(s) overridden by environment variables: ${overridden.join(', ')}`)
        }

        if ( missing.length > 0 ) {
            throw new ConfigError(this.describeMissing(missing), missing)
        }

        return this.buildConfig(configDefinition, values)
    }

    /**
     * The distinct parameter paths in a definition, in definition order.
     * Throws if two paths map to the same environment variable.
     */
    collectParameters(configDefinition) {
        const parameters = []
        const seen = new Set()
        const variables = new Map()

        const walk = (definition) => {
            for (const value of Object.values(definition)) {
                if ( typeof value === 'string' && value.startsWith(PARAMETER_PREFIX) ) {
                    const parameter = value.substring(PARAMETER_PREFIX.length)
                    if ( seen.has(parameter) ) {
                        continue
                    }
                    seen.add(parameter)

                    const variable = Config.variableName(parameter)
                    if ( variables.has(variable) ) {
                        throw new ConfigError(`Parameters '${variables.get(variable)}' and '${parameter}' `
                            + `both map to the environment variable ${variable}. Rename one of them.`)
                    }
                    variables.set(variable, parameter)

                    parameters.push(parameter)
                } else if ( typeof value === 'object' && ! Array.isArray(value) && value !== null ) {
                    walk(value)
                }
            }
        }
        walk(configDefinition)

        return parameters
    }

    /**
     * Build the configuration object from the definition and the loaded
     * values. As before, only strings and nested objects are carried over;
     * other values (e.g. an unset `process.env` entry) are left out.
     */
    buildConfig(configDefinition, values) {
        const config = {}

        for(const [key, value] of Object.entries(configDefinition)) {
            if ( typeof value === 'string' ) {
                if ( value.startsWith(PARAMETER_PREFIX) ) {
                    config[key] = values.get(value.substring(PARAMETER_PREFIX.length))
                } else {
                    config[key] = value
                }
            } else if ( typeof value === 'object' && ! Array.isArray(value) && value !== null ) {
                config[key] = this.buildConfig(value, values)
            }
        }

        return config
    }

    /**
     * Load one parameter from Parameter Store.
     *
     * @return {Promise<string|undefined>} The value, or undefined when the
     * parameter doesn't exist.
     */
    async loadParameter(param) {
        const fullyQualifiedParameterPath = path.join(`/${this.environment}`, param)
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

    describeMissing(missing) {
        const fullPath = (m) => path.join(`/${this.environment}`, m.parameter)

        if ( this.source === 'ssm' && ! this.development ) {
            return `Missing configuration: ${missing.length} parameter(s) not found in Parameter Store under '/${this.environment}':\n`
                + missing.map((m) => `  ${fullPath(m)}`).join('\n')
        }

        if ( this.source === 'ssm' ) {
            const width = Math.max(...missing.map((m) => m.variable.length))
            return `Missing configuration: ${missing.length} parameter(s) not found in Parameter Store under '/${this.environment}'.\n`
                + `Create them there, or set these environment variables:\n`
                + missing.map((m) => `  ${m.variable.padEnd(width)}  (${fullPath(m)})`).join('\n')
        }

        const lines = missing.map((m) => `  ${m.variable}`)

        return `Missing configuration: ${missing.length} value(s) not set (CONFIG_SOURCE=env).\n`
            + `Set these environment variables, for example in .env (see .env.local.example):\n`
            + lines.join('\n')
    }
}

module.exports.ConfigError = ConfigError
module.exports.SOURCES = SOURCES
