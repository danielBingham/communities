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
 * Thrown when the configuration can't be loaded: no definition file for the
 * environment, or values that couldn't be found.
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
     * @param {Object} credentials  AWS credentials, for Parameter Store.
     * @param {Object} [options]
     * @param {Object} [options.env]    The environment that `env:` values are
     * read from. Defaults to `process.env`.
     * @param {Object} [options.client] An SSM client to use instead of
     * constructing one.
     */
    constructor(environmentName, region, credentials, options = {}) {
        this.environmentName = environmentName
        this.region = region
        this.credentials = credentials
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
            this.client = new SSMClient({
                region: this.region,
                credentials: this.credentials
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
