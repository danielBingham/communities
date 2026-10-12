const fs = require('fs')
const os = require('os')
const path = require('path')

const Config = require('../config')
const { ConfigError } = Config

describe('Config', function() {

    const environment = {
        COMMUNITIES_HOST: 'https://localhost:3000',
        COMMUNITIES_DATABASE_HOST: 'postgres',
        COMMUNITIES_DATABASE_PASSWORD: 'secret',
        COMMUNITIES_LOG_LEVEL: 'debug'
    }

    const parameterStore = {
        '/staging/host': 'https://staging.example.com',
        '/staging/database/host': 'db.internal',
        '/staging/database/password': 'from-ssm'
    }

    // A stand-in SSM client that serves `parameters`, failing like the real
    // one for names it doesn't have.
    const ssmClient = function(parameters) {
        return {
            send: jest.fn(async function(command) {
                const name = command.input.Name
                if ( name in parameters ) {
                    return { Parameter: { Name: name, Value: parameters[name] } }
                }
                const error = new Error(`Parameter ${name} not found.`)
                error.name = 'ParameterNotFound'
                throw error
            })
        }
    }

    beforeEach(function() {
        jest.spyOn(console, 'log').mockImplementation(() => {})
        jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(function() {
        jest.restoreAllMocks()
    })

    describe('parseSource()', function() {
        it('Should recognize Parameter Store and environment sources', function() {
            expect(Config.parseSource('aws-ssm-parameter:/database/host')).toEqual({ type: 'ssm', name: '/database/host' })
            expect(Config.parseSource('env:COMMUNITIES_DATABASE_HOST')).toEqual({ type: 'env', name: 'COMMUNITIES_DATABASE_HOST' })
        })

        it('Should treat anything else as a value used as written', function() {
            expect(Config.parseSource('production')).toBe(null)
            expect(Config.parseSource('https://billing.stripe.com/p/login/x')).toBe(null)
        })
    })

    describe('definitionFor()', function() {
        let directory = null

        beforeEach(function() {
            directory = fs.mkdtempSync(path.join(os.tmpdir(), 'communities-config-'))
            for (const name of [ 'production', 'staging', 'development' ]) {
                fs.writeFileSync(path.join(directory, `index.${name}.js`), `module.exports = { environment: '${name}' }\n`)
            }
        })

        afterEach(function() {
            fs.rmSync(directory, { recursive: true, force: true })
        })

        it('Should load the file for each environment', function() {
            for (const name of [ 'production', 'staging', 'development' ]) {
                expect(Config.definitionFor(directory, name)).toEqual({ environment: name })
            }
        })

        it('Should reject a NODE_ENV that is not one of the environments', function() {
            for (const name of [ undefined, '', 'test', '../production', 'production.js' ]) {
                expect(() => Config.definitionFor(directory, name)).toThrow(ConfigError)
            }
        })

        it('Should explain how to create a missing development file', function() {
            fs.rmSync(path.join(directory, 'index.development.js'))

            expect(() => Config.definitionFor(directory, 'development'))
                .toThrow(/index\.development\.js-env-example.*index\.development\.js-ssm-example/)
        })

        it('Should fail when a committed environment file is missing', function() {
            fs.rmSync(path.join(directory, 'index.production.js'))

            expect(() => Config.definitionFor(directory, 'production')).toThrow(ConfigError)
        })
    })

    describe('loadConfig()', function() {

        it('Should load env: values from the environment and keep everything else as written, without AWS', async function() {
            const config = new Config(undefined, undefined, undefined, { env: environment })

            const result = await config.loadConfig({
                host: 'env:COMMUNITIES_HOST',
                environment: 'development',
                log_level: 'env:COMMUNITIES_LOG_LEVEL',
                database: {
                    host: 'env:COMMUNITIES_DATABASE_HOST',
                    password: 'env:COMMUNITIES_DATABASE_PASSWORD'
                },
                links: {
                    5: 'https://example.com/five'
                },
                retries: 3,
                enabled: true,
                hosts: [ 'a', 'b' ]
            })

            expect(result).toEqual({
                host: 'https://localhost:3000',
                environment: 'development',
                log_level: 'debug',
                database: {
                    host: 'postgres',
                    password: 'secret'
                },
                links: {
                    5: 'https://example.com/five'
                },
                retries: 3,
                enabled: true,
                hosts: [ 'a', 'b' ]
            })
            expect(config.client).toBe(null)
        })

        it('Should load aws-ssm-parameter: values from under the environment name', async function() {
            const client = ssmClient(parameterStore)
            const config = new Config('staging', 'us-east-1', {}, { env: {}, client: client })

            const result = await config.loadConfig({
                host: 'aws-ssm-parameter:/host',
                database: {
                    host: 'aws-ssm-parameter:/database/host'
                }
            })

            expect(result).toEqual({
                host: 'https://staging.example.com',
                database: { host: 'db.internal' }
            })
            expect(client.send.mock.calls.map((call) => call[0].input)).toEqual([
                { Name: '/staging/host', WithDecryption: true },
                { Name: '/staging/database/host', WithDecryption: true }
            ])
        })

        it('Should take each value only from the source its definition names', async function() {
            const client = ssmClient(parameterStore)
            // Both variables are set, but only one value is declared env:.
            const config = new Config('staging', 'us-east-1', {}, { env: environment, client: client })

            const result = await config.loadConfig({
                database: {
                    host: 'env:COMMUNITIES_DATABASE_HOST',
                    password: 'aws-ssm-parameter:/database/password'
                }
            })

            expect(result.database).toEqual({ host: 'postgres', password: 'from-ssm' })
            expect(client.send.mock.calls.map((call) => call[0].input.Name)).toEqual([ '/staging/database/password' ])
        })

        it('Should report how many values came from each source', async function() {
            const config = new Config('staging', 'us-east-1', {}, { env: environment, client: ssmClient(parameterStore) })

            await config.loadConfig({
                host: 'aws-ssm-parameter:/host',
                environment: 'staging',
                database: {
                    host: 'aws-ssm-parameter:/database/host',
                    password: 'env:COMMUNITIES_DATABASE_PASSWORD'
                }
            })

            expect(console.log).toHaveBeenCalledWith(
                `Configuration loaded: 2 value(s) from Parameter Store under '/staging', 1 from environment variables.`)
        })

        it('Should report every missing value at once, in definition order, with its key and source', async function() {
            const config = new Config('staging', 'us-east-1', {}, {
                env: { ...environment, COMMUNITIES_DATABASE_PASSWORD: '' },
                client: ssmClient(parameterStore)
            })

            const error = await config.loadConfig({
                host: 'aws-ssm-parameter:/host',
                wsHost: 'aws-ssm-parameter:/ws-host',
                database: {
                    host: 'env:COMMUNITIES_DATABASE_HOST',
                    password: 'env:COMMUNITIES_DATABASE_PASSWORD'
                },
                session: {
                    secret: 'env:COMMUNITIES_SESSION_SECRET'
                }
            }).catch((error) => error)

            expect(error).toBeInstanceOf(ConfigError)
            expect(error.missing).toEqual([
                { key: 'wsHost', source: 'aws-ssm-parameter:/ws-host' },
                { key: 'database.password', source: 'env:COMMUNITIES_DATABASE_PASSWORD' },
                { key: 'session.secret', source: 'env:COMMUNITIES_SESSION_SECRET' }
            ])
            expect(error.message).toContain('3 value(s)')
            expect(error.message).toContain('aws-ssm-parameter:/staging/ws-host')
            expect(error.message).toContain('env:COMMUNITIES_SESSION_SECRET')
        })

        it('Should not ask Parameter Store without COMMUNITIES_ENVIRONMENT_NAME, and say why the values are missing', async function() {
            const client = ssmClient(parameterStore)
            const config = new Config(undefined, 'us-east-1', {}, { env: {}, client: client })

            const error = await config.loadConfig({
                environmentName: 'env:COMMUNITIES_ENVIRONMENT_NAME',
                host: 'aws-ssm-parameter:/host'
            }).catch((error) => error)

            expect(error).toBeInstanceOf(ConfigError)
            expect(error.missing).toEqual([
                { key: 'environmentName', source: 'env:COMMUNITIES_ENVIRONMENT_NAME' },
                { key: 'host', source: 'aws-ssm-parameter:/host' }
            ])
            expect(error.message).toContain(`COMMUNITIES_ENVIRONMENT_NAME isn't set`)
            expect(client.send).not.toHaveBeenCalled()
        })

        it('Should rethrow errors other than a missing parameter', async function() {
            const client = { send: jest.fn(async () => { throw new Error('Access denied') }) }
            const config = new Config('staging', 'us-east-1', {}, { env: {}, client: client })

            await expect(config.loadConfig({ host: 'aws-ssm-parameter:/host' })).rejects.toThrow('Access denied')
        })
    })

    describe('validateConfig()', function() {
        // A complete, valid configuration for development.
        const valid = () => ({
            environment: 'development',
            database: { host: 'localhost', port: '5432', user: 'app', password: 'secret', name: 'communities' },
            redis: { host: 'localhost', port: '6379' },
            email: { driver: 'log', log: { directory: 'tmp/email' } },
            storage: { driver: 'filesystem', filesystem: { directory: 'tmp/storage', secret: 'secret' } },
            notifications: { log: {} }
        })

        const problems = function(config) {
            try {
                new Config().validateConfig(config)
                return []
            } catch (error) {
                expect(error).toBeInstanceOf(ConfigError)
                return error.message.split('\n').slice(1).map((line) => line.trim())
            }
        }

        it('Should accept a complete configuration', function() {
            expect(problems(valid())).toEqual([])

            const production = {
                ...valid(),
                environment: 'production',
                email: { driver: 'postmark', postmark: { api_token: 'token' } },
                storage: { driver: 's3', s3: { bucket_url: 'https://files', bucket: 'files', access_id: 'id', access_key: 'key' } },
                notifications: {
                    ios: { privateCert: 'key', publicCert: 'cert', applicationBundleID: 'social.communities', endpoint: 'https://api.push.apple.com' },
                    android: { firebaseServiceAccount: JSON.stringify({ project_id: 'communities', client_email: 'push@communities.example', private_key: 'key' }) }
                }
            }
            expect(problems(production)).toEqual([])
        })

        it('Should allow push notifications to be off', function() {
            expect(problems({ ...valid(), notifications: {} })).toEqual([])
            expect(problems({ ...valid(), notifications: undefined })).toEqual([])
        })

        it('Should require the database and redis settings', function() {
            const config = valid()
            delete config.database.password
            config.redis = undefined

            expect(problems(config)).toEqual([
                'The configuration needs database.password.',
                'The configuration needs redis.host.',
                'The configuration needs redis.port.'
            ])
        })

        it('Should require known email and storage drivers', function() {
            expect(problems({ ...valid(), email: { driver: 'smtp' }, storage: undefined })).toEqual([
                `email.driver in the configuration must be one of 'postmark' or 'log', but it's 'smtp'.`,
                `storage.driver in the configuration must be one of 's3' or 'filesystem', but it's ''.`
            ])
        })

        it('Should reject a block under notifications that isn\'t a push driver', function() {
            expect(problems({ ...valid(), notifications: { log: {}, apns: {} } })).toEqual([
                `notifications.apns in the configuration isn't a push driver. Each block under notifications must be one of 'ios', 'android' or 'log'.`
            ])
        })

        it('Should have each driver check its own block, and report every problem together', function() {
            const config = {
                ...valid(),
                environment: 'production',
                email: { driver: 'postmark', postmark: {} },
                notifications: { ios: { privateCert: 'key' }, log: {} }
            }

            expect(problems(config)).toEqual([
                'The postmark email driver needs email.postmark.api_token in the configuration.',
                'The filesystem storage driver may only be used in development.',
                'The ios push driver needs notifications.ios.publicCert in the configuration.',
                'The log push driver may only be used in development.'
            ])
        })
    })

    describe('loadEnvironmentVariable()', function() {
        it('Should treat an unset or empty variable as missing', function() {
            const config = new Config(undefined, undefined, undefined, { env: { SET: 'value', EMPTY: '' } })

            expect(config.loadEnvironmentVariable('SET')).toBe('value')
            expect(config.loadEnvironmentVariable('EMPTY')).toBe(undefined)
            expect(config.loadEnvironmentVariable('UNSET')).toBe(undefined)
        })
    })
})
