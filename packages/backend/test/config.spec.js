const Config = require('../config')
const { ConfigError } = Config

describe('Config', function() {

    const definition = {
        host: 'aws-ssm-parameter:/host',
        wsHost: 'aws-ssm-parameter:/ws-host',
        environment: 'development',
        unset: undefined,
        database: {
            host: 'aws-ssm-parameter:/database/host',
            password: 'aws-ssm-parameter:/database/password'
        },
        storage: {
            s3: {
                bucketUrl: 'aws-ssm-parameter:/storage/s3/bucket-url'
            }
        },
        links: {
            5: 'https://example.com/five'
        }
    }

    const allVariables = {
        NODE_ENV: 'development',
        COMMUNITIES_HOST: 'https://localhost:3000',
        COMMUNITIES_WS_HOST: 'wss://localhost:3000',
        COMMUNITIES_DATABASE_HOST: 'postgres',
        COMMUNITIES_DATABASE_PASSWORD: 'secret',
        COMMUNITIES_STORAGE_S3_BUCKET_URL: 'https://bucket.example.com'
    }

    const parameterStore = {
        '/staging/host': 'https://staging.example.com',
        '/staging/ws-host': 'wss://staging.example.com',
        '/staging/database/host': 'db.internal',
        '/staging/database/password': 'from-ssm',
        '/staging/storage/s3/bucket-url': 'https://staging-bucket.example.com'
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
        jest.spyOn(console, 'warn').mockImplementation(() => {})
        jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(function() {
        jest.restoreAllMocks()
    })

    describe('variableName()', function() {
        it('Should map parameter paths to COMMUNITIES_ variables', function() {
            expect(Config.variableName('/host')).toBe('COMMUNITIES_HOST')
            expect(Config.variableName('/ws-host')).toBe('COMMUNITIES_WS_HOST')
            expect(Config.variableName('/storage/s3/bucket-url')).toBe('COMMUNITIES_STORAGE_S3_BUCKET_URL')
            expect(Config.variableName('/notifications/android/firebase-service-account-json'))
                .toBe('COMMUNITIES_NOTIFICATIONS_ANDROID_FIREBASE_SERVICE_ACCOUNT_JSON')
        })
    })

    describe('constructor()', function() {
        it('Should default to the ssm source', function() {
            const config = new Config('staging', 'us-east-1', {}, { env: {}, client: ssmClient({}) })
            expect(config.source).toBe('ssm')
        })

        it('Should read the source from CONFIG_SOURCE', function() {
            const config = new Config('staging', 'us-east-1', {}, { env: { NODE_ENV: 'development', CONFIG_SOURCE: 'env' } })
            expect(config.source).toBe('env')
        })

        it('Should not create an SSM client for the env source', function() {
            const config = new Config(undefined, undefined, undefined, { env: { NODE_ENV: 'development', CONFIG_SOURCE: 'env' } })
            expect(config.client).toBe(null)
        })

        it('Should refuse the env source outside development', function() {
            for (const nodeEnv of [ 'production', 'staging', undefined ]) {
                expect(() => new Config(undefined, undefined, undefined, { env: { NODE_ENV: nodeEnv, CONFIG_SOURCE: 'env' } }))
                    .toThrow('CONFIG_SOURCE=env is only allowed in development')
            }
        })

        it('Should reject an unknown source', function() {
            expect(() => new Config('staging', 'us-east-1', {}, { env: { CONFIG_SOURCE: 'file' } }))
                .toThrow(ConfigError)
        })
    })

    describe('loadConfig() with the env source', function() {

        it('Should load every parameter from its variable and keep the definition shape', async function() {
            const config = new Config(undefined, undefined, undefined, { source: 'env', env: allVariables })

            const result = await config.loadConfig(definition)

            expect(result).toEqual({
                host: 'https://localhost:3000',
                wsHost: 'wss://localhost:3000',
                environment: 'development',
                database: {
                    host: 'postgres',
                    password: 'secret'
                },
                storage: {
                    s3: {
                        bucketUrl: 'https://bucket.example.com'
                    }
                },
                links: {
                    5: 'https://example.com/five'
                }
            })
        })

        it('Should report every missing variable at once', async function() {
            const env = { ...allVariables }
            delete env.COMMUNITIES_DATABASE_PASSWORD
            env.COMMUNITIES_WS_HOST = ''

            const config = new Config(undefined, undefined, undefined, { source: 'env', env: env })

            const error = await config.loadConfig(definition).catch((error) => error)

            expect(error).toBeInstanceOf(ConfigError)
            expect(error.missing).toEqual([
                { parameter: '/ws-host', variable: 'COMMUNITIES_WS_HOST' },
                { parameter: '/database/password', variable: 'COMMUNITIES_DATABASE_PASSWORD' }
            ])
            expect(error.message).toContain('COMMUNITIES_WS_HOST')
            expect(error.message).toContain('COMMUNITIES_DATABASE_PASSWORD')
            expect(error.message).not.toContain('COMMUNITIES_HOST\n')
        })
    })

    describe('loadConfig() with the ssm source', function() {

        it('Should load every parameter from under /<environment>', async function() {
            const client = ssmClient(parameterStore)
            const config = new Config('staging', 'us-east-1', {}, { env: {}, client: client })

            const result = await config.loadConfig(definition)

            expect(result.host).toBe('https://staging.example.com')
            expect(result.database.password).toBe('from-ssm')
            expect(result.storage.s3.bucketUrl).toBe('https://staging-bucket.example.com')
            expect(client.send).toHaveBeenCalledTimes(5)
            expect(client.send.mock.calls[0][0].input).toEqual({ Name: '/staging/host', WithDecryption: true })
        })

        it('Should let a set variable override its parameter in development, without asking Parameter Store', async function() {
            const client = ssmClient(parameterStore)
            const config = new Config('staging', 'us-east-1', {}, {
                env: { NODE_ENV: 'development', COMMUNITIES_DATABASE_HOST: 'localhost' },
                client: client
            })

            const result = await config.loadConfig(definition)

            expect(result.database.host).toBe('localhost')
            expect(result.database.password).toBe('from-ssm')
            const names = client.send.mock.calls.map((call) => call[0].input.Name)
            expect(names).not.toContain('/staging/database/host')
        })

        it('Should ignore variables outside development and load every parameter from Parameter Store', async function() {
            const client = ssmClient(parameterStore)
            const config = new Config('staging', 'us-east-1', {}, {
                env: {
                    NODE_ENV: 'production',
                    COMMUNITIES_DATABASE_HOST: 'attacker.example.com',
                    COMMUNITIES_DATABASE_PASSWORD: 'injected'
                },
                client: client
            })

            const result = await config.loadConfig(definition)

            expect(result.database.host).toBe('db.internal')
            expect(result.database.password).toBe('from-ssm')
            expect(client.send).toHaveBeenCalledTimes(5)
            expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('COMMUNITIES_DATABASE_HOST, COMMUNITIES_DATABASE_PASSWORD'))
            expect(console.warn).not.toHaveBeenCalledWith(expect.stringContaining('injected'))
        })

        it('Should not suggest variables for missing parameters outside development', async function() {
            const store = { ...parameterStore }
            delete store['/staging/host']
            const config = new Config('staging', 'us-east-1', {}, { env: { NODE_ENV: 'production' }, client: ssmClient(store) })

            const error = await config.loadConfig(definition).catch((error) => error)

            expect(error).toBeInstanceOf(ConfigError)
            expect(error.message).toContain('/staging/host')
            expect(error.message).not.toContain('COMMUNITIES_HOST')
        })

        it('Should report every parameter Parameter Store does not have', async function() {
            const store = { ...parameterStore }
            delete store['/staging/host']
            delete store['/staging/database/password']
            const config = new Config('staging', 'us-east-1', {}, { env: { NODE_ENV: 'development' }, client: ssmClient(store) })

            const error = await config.loadConfig(definition).catch((error) => error)

            expect(error).toBeInstanceOf(ConfigError)
            expect(error.missing.map((m) => m.parameter)).toEqual([ '/host', '/database/password' ])
            expect(error.message).toContain('/staging/database/password')
            expect(error.message).toContain('COMMUNITIES_DATABASE_PASSWORD')
        })

        it('Should rethrow errors other than a missing parameter', async function() {
            const client = { send: jest.fn(async () => { throw new Error('Access denied') }) }
            const config = new Config('staging', 'us-east-1', {}, { env: {}, client: client })

            await expect(config.loadConfig(definition)).rejects.toThrow('Access denied')
        })
    })

    describe('collectParameters()', function() {
        it('Should reject two parameters that map to the same variable', function() {
            const config = new Config(undefined, undefined, undefined, { source: 'env', env: { NODE_ENV: 'development' } })

            expect(() => config.collectParameters({
                a: 'aws-ssm-parameter:/database/host-name',
                b: 'aws-ssm-parameter:/database-host/name'
            })).toThrow(ConfigError)
        })
    })
})
