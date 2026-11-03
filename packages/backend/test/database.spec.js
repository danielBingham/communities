const tls = require('tls')

const Core = require('../core')
const { sslOptions, describeCertificateAuthorities } = require('../lib/database-tls')

describe('Database connections', function() {

    const database = {
        host: 'communities-production-database-cluster.cluster-example.us-east-1.rds.amazonaws.com',
        port: '5432',
        user: 'app',
        password: 'secret',
        name: 'communities'
    }

    // A real PEM certificate without committing one: the first of Node's own
    // root certificate authorities.
    const certificateAuthorities = tls.rootCertificates[0]

    afterEach(function() {
        jest.restoreAllMocks()
    })

    describe('sslOptions()', function() {
        it('Should turn TLS off by default, and for disable', function() {
            expect(sslOptions(database)).toBe(false)
            expect(sslOptions({ ...database, ssl: 'disable' })).toBe(false)
            expect(sslOptions({ ...database, ssl: 'disable', certificateAuthorities })).toBe(false)
        })

        it('Should trust only the configured certificate authorities, with verification on, for verify-full', function() {
            expect(sslOptions({ ...database, ssl: 'verify-full', certificateAuthorities })).toEqual({
                ca: certificateAuthorities,
                rejectUnauthorized: true
            })
        })

        it('Should refuse verify-full without certificate authorities', function() {
            expect(() => sslOptions({ ...database, ssl: 'verify-full' })).toThrow(/certificateAuthorities isn't set/)
        })

        it('Should refuse a mode it doesn\'t know', function() {
            expect(() => sslOptions({ ...database, ssl: 'require' })).toThrow(/must be one of/)
        })
    })

    describe('describeCertificateAuthorities()', function() {
        it('Should name each certificate authority and when it expires', function() {
            expect(describeCertificateAuthorities({ certificateAuthorities }))
                .toMatch(/^.+ \(until .+\)$/)
            expect(describeCertificateAuthorities({ certificateAuthorities: certificateAuthorities + '\n' + tls.rootCertificates[1] })
                .split('), ').length).toBe(2)
        })

        it('Should say when there are none', function() {
            expect(describeCertificateAuthorities({})).toBe('none')
            expect(describeCertificateAuthorities({ certificateAuthorities: 'not a certificate' })).toBe('none')
        })
    })

    describe('Core.createDatabasePool()', function() {
        it('Should connect without TLS when the configuration doesn\'t ask for it', async function() {
            const pool = Core.createDatabasePool(database)
            expect(pool.options.ssl).toBe(false)
            expect(pool.options.host).toBe(database.host)
            expect(pool.options.database).toBe(database.name)
            await pool.end()
        })

        it('Should connect with verified TLS for verify-full', async function() {
            const pool = Core.createDatabasePool({ ...database, ssl: 'verify-full', certificateAuthorities })
            expect(pool.options.ssl).toEqual({ ca: certificateAuthorities, rejectUnauthorized: true })
            await pool.end()
        })

        it('Should survive an idle connection failing, and report it', async function() {
            const logger = { error: jest.fn() }
            const pool = Core.createDatabasePool(database, logger)

            // What pg-pool does when an idle client's connection drops.
            expect(() => pool.emit('error', new Error('terminating connection due to administrator command')))
                .not.toThrow()
            expect(logger.error).toHaveBeenCalledTimes(1)
            expect(logger.error.mock.calls[0][0]).toMatch(/terminating connection due to administrator command/)

            await pool.end()
        })
    })

    describe('Core.checkDatabaseConnection()', function() {
        const coreWith = function(row) {
            const core = new Core('test', { database: { ...database, ssl: 'verify-full', certificateAuthorities } })
            core.logger = { info: jest.fn() }
            core.database = { query: jest.fn(async () => ({ rows: row ? [ row ] : [] })) }
            return core
        }

        it('Should log the TLS version and cipher of an encrypted connection', async function() {
            const core = coreWith({ ssl: true, version: 'TLSv1.3', cipher: 'TLS_AES_256_GCM_SHA384' })
            await core.checkDatabaseConnection()
            expect(core.logger.info).toHaveBeenCalledWith('Connected to postgres over TLS (TLSv1.3, TLS_AES_256_GCM_SHA384).')
        })

        it('Should say when the connection isn\'t encrypted', async function() {
            const core = coreWith({ ssl: false, version: null, cipher: null })
            await core.checkDatabaseConnection()
            expect(core.logger.info).toHaveBeenCalledWith(`Connected to postgres without TLS (database.ssl is 'verify-full').`)
        })

        it('Should fail when the database can\'t be reached', async function() {
            const core = coreWith(null)
            core.database.query = jest.fn(async () => { throw new Error('self-signed certificate in certificate chain') })
            await expect(core.checkDatabaseConnection()).rejects.toThrow('self-signed certificate in certificate chain')
        })
    })
})
