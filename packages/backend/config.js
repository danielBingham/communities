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
     * Load a configuration definition.
     *
     * @param {Object} configDefinition The definition, as returned by
     * definitionFor().
     *
     * @return {Promise<Object>} The configuration, with the same shape as the
     * definition.
     *
     * @throws {ConfigError} When any value can't be found.
     */
    async loadConfig(configDefinition) {
        const references = this.collectReferences(configDefinition)

        const fromParameterStore = references.filter((r) => r.type === 'ssm')
        const fromEnvironment = references.filter((r) => r.type === 'env')
        console.log(`Loading configuration: ${fromParameterStore.length} value(s) from Parameter Store`
            + (fromParameterStore.length > 0
                ? (this.environmentName ? ` under '/${this.environmentName}'` : ` (COMMUNITIES_ENVIRONMENT_NAME isn't set)`)
                : '')
            + `, ${fromEnvironment.length} from environment variables...`)

        const values = new Map()
        const missing = []

        for (const reference of fromEnvironment) {
            const value = this.env[reference.name]
            if ( value !== undefined && value !== '' ) {
                values.set(reference.source, value)
            } else {
                missing.push(...reference.keys.map((key) => ({ key: key, source: reference.source })))
            }
        }

        if ( fromParameterStore.length > 0 ) {
            if ( ! this.environmentName ) {
                // Without the prefix there's nowhere to look; report it once
                // rather than every parameter that depends on it (and not at
                // all if the definition's own env: value already did).
                const source = `${ENV_PREFIX}${ENVIRONMENT_NAME_VARIABLE}`
                if ( ! missing.some((m) => m.source === source) ) {
                    missing.push({ key: '(Parameter Store path prefix)', source: source })
                }
            } else {
                for (const reference of fromParameterStore) {
                    const value = await this.loadParameter(reference.name)
                    if ( value !== undefined ) {
                        values.set(reference.source, value)
                    } else {
                        missing.push(...reference.keys.map((key) => ({ key: key, source: reference.source })))
                    }
                }
            }
        }

        if ( missing.length > 0 ) {
            throw new ConfigError(this.describeMissing(missing), missing)
        }

        return this.buildConfig(configDefinition, values)
    }

    /**
     * The distinct sources a definition refers to, in definition order, each
     * with the configuration keys that use it.
     *
     * @return {Object[]} `{ source, type, name, keys }`, where `type` is `ssm`
     * or `env` and `name` is the parameter path or variable name.
     */
    collectReferences(configDefinition) {
        const references = new Map()

        const walk = (definition, prefix) => {
            for (const [key, value] of Object.entries(definition)) {
                const keyPath = prefix ? `${prefix}.${key}` : key

                if ( typeof value === 'string' ) {
                    const reference = Config.parseSource(value)
                    if ( reference === null ) {
                        continue
                    }
                    if ( ! reference.name ) {
                        throw new ConfigError(`'${keyPath}' is set to '${value}', which names no ${reference.type === 'env' ? 'variable' : 'parameter'}.`)
                    }
                    if ( ! references.has(value) ) {
                        references.set(value, { ...reference, source: value, keys: [] })
                    }
                    references.get(value).keys.push(keyPath)
                } else if ( typeof value === 'object' && ! Array.isArray(value) && value !== null ) {
                    walk(value, keyPath)
                }
            }
        }
        walk(configDefinition, '')

        return [ ...references.values() ]
    }

    /**
     * Parse a definition value.
     *
     * @return {Object|null} `{ type, name }` for an `aws-ssm-parameter:` or
     * `env:` value, or null for a value that's used as written.
     */
    static parseSource(value) {
        if ( value.startsWith(SSM_PREFIX) ) {
            return { type: 'ssm', name: value.substring(SSM_PREFIX.length).trim() }
        }
        if ( value.startsWith(ENV_PREFIX) ) {
            return { type: 'env', name: value.substring(ENV_PREFIX.length).trim() }
        }
        return null
    }

    /**
     * Build the configuration object from the definition and the loaded
     * values. As before, only strings and nested objects are carried over.
     */
    buildConfig(configDefinition, values) {
        const config = {}

        for(const [key, value] of Object.entries(configDefinition)) {
            if ( typeof value === 'string' ) {
                config[key] = Config.parseSource(value) === null ? value : values.get(value)
            } else if ( typeof value === 'object' && ! Array.isArray(value) && value !== null ) {
                config[key] = this.buildConfig(value, values)
            }
        }

        return config
    }

    /**
     * Load one parameter from Parameter Store.
     *
     * @param {string} parameter    The path from the definition, without the
     * environment name prefix.
     *
     * @return {Promise<string|undefined>} The value, or undefined when the
     * parameter doesn't exist.
     */
    async loadParameter(parameter) {
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
        return path.posix.join(`/${this.environmentName}`, parameter)
    }

    describeMissing(missing) {
        const width = Math.max(...missing.map((m) => m.key.length))
        const lines = missing.map((m) => {
            const reference = Config.parseSource(m.source)
            const detail = reference.type === 'ssm'
                ? `aws-ssm-parameter:${this.parameterPath(reference.name)} (not in Parameter Store)`
                : `${m.source} (not set)`
            return `  ${m.key.padEnd(width)}  ${detail}`
        })

        return `Missing configuration: ${missing.length} value(s) not found.\n`
            + lines.join('\n')
    }
}

module.exports.ConfigError = ConfigError
module.exports.ENVIRONMENTS = ENVIRONMENTS
