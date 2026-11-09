const Core = require('../core')
const {
    checkRedisConfig,
    describeRedisConnection,
    nodeRedisOptions,
    bullRedisOptions
} = require('../lib/redis-connection')

describe('Redis connections', function() {

    const host = 'master.communities-production-cache-redis.abc123.use1.cache.amazonaws.com'
    const token = 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90'

    const redis = { host, port: '6379' }
    const hardened = { ...redis, tls: 'verify-full', auth: 'token', password: token }

    describe('checkRedisConfig()', function() {
        it('Should accept no TLS and no AUTH, which are the defaults', function() {
            expect(checkRedisConfig(redis)).toEqual([])
            expect(checkRedisConfig({ ...redis, tls: 'disable', auth: 'none' })).toEqual([])
        })

        it('Should accept a password it isn\'t going to send', function() {
            // Staging and production always load /redis/password, so
            // setting /redis/auth to 'none' has to keep working.
            expect(checkRedisConfig({ ...redis, auth: 'none', password: 'anything at all' })).toEqual([])
        })

        it('Should accept TLS with a token, as staging and production use', function() {
            expect(checkRedisConfig(hardened)).toEqual([])
            expect(checkRedisConfig({ ...redis, tls: 'verify-full', auth: 'none' })).toEqual([])
        })

        it('Should refuse modes it doesn\'t know, including ones that skip verification', function() {
            for (const tls of [ 'require', 'true', 'prefer' ]) {
                expect(checkRedisConfig({ ...redis, tls }))
                    .toEqual([ `redis.tls in the configuration must be one of 'disable' or 'verify-full', but it's '${tls}'.` ])
            }
            expect(checkRedisConfig({ ...redis, auth: 'password' }))
                .toEqual([ `redis.auth in the configuration must be one of 'none' or 'token', but it's 'password'.` ])
        })

        it('Should refuse to send a token without TLS', function() {
            expect(checkRedisConfig({ ...hardened, tls: 'disable' })).toEqual([
                `redis.auth is 'token', so redis.tls has to be 'verify-full': the token mustn't be sent without TLS.`
            ])
        })

        it('Should refuse a token it hasn\'t got, or one ElastiCache wouldn\'t accept, without repeating it', function() {
            expect(checkRedisConfig({ ...hardened, password: undefined }))
                .toEqual([ `redis.auth is 'token', so the configuration needs redis.password.` ])

            for (const password of [ 'too-short', 'x'.repeat(129), 'has a space in it ok', 'has@an/at-and-slash1' ]) {
                const problems = checkRedisConfig({ ...hardened, password })
                expect(problems).toEqual([ `redis.password isn't a token ElastiCache accepts: 16 to 128 characters, `
                    + `letters, digits and !&#$^<>- only (it has ${password.length}).` ])
                expect(problems[0]).not.toContain(password)
            }

            expect(checkRedisConfig({ ...hardened, password: 'Abc123!&#$^<>-xyz' })).toEqual([])
        })

        it('Should refuse an IP address for the host with verify-full, since its name couldn\'t be checked', function() {
            expect(checkRedisConfig({ ...hardened, host: '10.0.12.7' })).toEqual([
                `redis.tls is 'verify-full', so redis.host has to be the host name on the server's certificate, `
                    + `not an IP address ('10.0.12.7').`
            ])
            expect(checkRedisConfig({ ...redis, host: '10.0.12.7' })).toEqual([])
        })
    })

    describe('describeRedisConnection()', function() {
        it('Should give both modes, and never the password', function() {
            expect(describeRedisConnection(redis)).toBe('TLS: disable, AUTH: none')
            expect(describeRedisConnection(hardened)).toBe('TLS: verify-full, AUTH: token')
            expect(describeRedisConnection(hardened)).not.toContain(token)
        })
    })

    describe('nodeRedisOptions()', function() {
        it('Should connect in plaintext, without a password, by default', function() {
            expect(nodeRedisOptions(redis)).toEqual({ socket: { host, port: 6379 } })
            expect(nodeRedisOptions({ ...redis, auth: 'none', password: token })).toEqual({ socket: { host, port: 6379 } })
        })

        it('Should verify the server\'s certificate and host name, and send the token', function() {
            expect(nodeRedisOptions(hardened)).toEqual({
                socket: { host, port: 6379, tls: true, servername: host, rejectUnauthorized: true },
                password: token
            })
        })

        it('Should refuse what validation would have reported', function() {
            expect(() => nodeRedisOptions({ ...redis, tls: 'require' })).toThrow(/must be one of/)
            expect(() => nodeRedisOptions({ ...hardened, password: '' })).toThrow(/redis.password isn't set/)
        })
    })

    describe('bullRedisOptions()', function() {
        it('Should connect in plaintext, without a password, by default', function() {
            expect(bullRedisOptions(redis)).toEqual({ host, port: 6379 })
        })

        it('Should verify the server\'s certificate and host name, and send the token', function() {
            expect(bullRedisOptions(hardened)).toEqual({
                host,
                port: 6379,
                password: token,
                tls: { servername: host, rejectUnauthorized: true }
            })
        })

        it('Should never hand ioredis the configuration\'s own tls and auth strings', function() {
            const options = bullRedisOptions(hardened)
            expect(typeof options.tls).toBe('object')
            expect(options).not.toHaveProperty('auth')
        })
    })

    describe('Core.createRedisClient()', function() {
        it('Should create a client with the options for the configuration', function() {
            const client = Core.createRedisClient(hardened)
            expect(client.options.socket).toMatchObject(nodeRedisOptions(hardened).socket)
            expect(client.options.password).toBe(token)
            expect(client.isOpen).toBe(false)
        })

        it('Should give the events subscriber the same options', function() {
            const subscriber = Core.createRedisClient(hardened).duplicate()
            expect(subscriber.options.socket).toMatchObject(nodeRedisOptions(hardened).socket)
            expect(subscriber.options.password).toBe(token)
        })

        it('Should give up on a failed connection until the app has started, then keep retrying', function() {
            let started = false
            const { reconnectStrategy } = Core.createRedisClient(hardened, () => started).options.socket

            expect(reconnectStrategy(0, new Error('WRONGPASS invalid username-password pair'))).toBe(false)

            started = true
            for (const retries of [ 0, 3, 20 ]) {
                const delay = reconnectStrategy(retries, new Error('Socket closed unexpectedly'))
                expect(delay).toBeGreaterThanOrEqual(Math.min(Math.pow(2, retries) * 50, 2000))
                expect(delay).toBeLessThan(2200)
            }
        })

        it('Should keep retrying by default', function() {
            const { reconnectStrategy } = Core.createRedisClient(redis).options.socket
            expect(typeof reconnectStrategy(0, new Error('Socket closed unexpectedly'))).toBe('number')
        })
    })
})
