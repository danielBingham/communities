/******************************************************************************
 * The certificate the web application serves HTTPS with, and the server that
 * serves it.
 *
 * These run openssl, as the server does in staging and production.
 ******************************************************************************/

const fs = require('fs')
const os = require('os')
const path = require('path')
const https = require('https')
const { X509Certificate, createPrivateKey } = require('crypto')

const { loadCertificate, createSelfSignedCertificate } = require('../../../server/certificate')
const { createHTTPServer } = require('../../../server/httpServer')

const quietCore = () => ({ logger: { info: jest.fn(), error: jest.fn(), verbose: jest.fn() } })

describe('The web application\'s certificate', function() {
    let directory = null

    beforeEach(function() {
        directory = fs.mkdtempSync(path.join(os.tmpdir(), 'certificate-spec-'))
    })

    afterEach(function() {
        fs.rmSync(directory, { recursive: true, force: true })
    })

    describe('createSelfSignedCertificate()', function() {
        it('Should make a certificate signed by its own key, for a year', function() {
            const { key, cert } = createSelfSignedCertificate()
            const certificate = new X509Certificate(cert)

            expect(certificate.subject).toBe('CN=communities-web-application')
            expect(certificate.checkPrivateKey(createPrivateKey(key))).toBe(true)
            expect(certificate.verify(certificate.publicKey)).toBe(true)

            const days = (new Date(certificate.validTo) - new Date(certificate.validFrom)) / (24 * 60 * 60 * 1000)
            expect(Math.round(days)).toBe(365)
        })

        it('Should make a different key each time', function() {
            expect(createSelfSignedCertificate().key).not.toEqual(createSelfSignedCertificate().key)
        })

        it('Should leave nothing behind in the scratch folder\'s parent', function() {
            const parent = fs.existsSync('/dev/shm') ? '/dev/shm' : os.tmpdir()
            const scratchFolders = () => fs.readdirSync(parent).filter((name) => name.startsWith('communities-certificate-'))

            const before = scratchFolders()
            createSelfSignedCertificate()
            expect(scratchFolders()).toEqual(before)
        })
    })

    describe('loadCertificate()', function() {
        it('Should make its own when the directory has neither file', function() {
            const core = quietCore()
            const { key, cert } = loadCertificate(core, directory)

            expect(new X509Certificate(cert).checkPrivateKey(createPrivateKey(key))).toBe(true)
            expect(fs.readdirSync(directory)).toEqual([])
            expect(core.logger.info).toHaveBeenCalledWith(expect.stringMatching(/new self-signed certificate.*SHA-256/))
        })

        it('Should make its own when the directory doesn\'t exist', function() {
            const { cert } = loadCertificate(quietCore(), path.join(directory, 'missing'))
            expect(new X509Certificate(cert).subject).toBe('CN=communities-web-application')
        })

        it('Should serve the files when the directory has both', function() {
            const { key, cert } = createSelfSignedCertificate()
            fs.writeFileSync(path.join(directory, 'key.pem'), key)
            fs.writeFileSync(path.join(directory, 'cert.pem'), cert)

            const core = quietCore()
            const loaded = loadCertificate(core, directory)

            expect(loaded.key.toString()).toBe(key)
            expect(loaded.cert.toString()).toBe(cert)
            expect(core.logger.info).toHaveBeenCalledWith(expect.stringMatching(/the certificate in/))
        })

        it.each([ 'key.pem', 'cert.pem' ])('Should refuse a directory with only %s', function(file) {
            fs.writeFileSync(path.join(directory, file), 'half a pair')

            expect(() => loadCertificate(quietCore(), directory)).toThrow(/Put both in .* or neither/)
        })
    })

    describe('createHTTPServer()', function() {
        it('Should serve HTTPS, with TLS 1.2 or later', async function() {
            const handler = (request, response) => response.end('ok')
            const server = createHTTPServer(quietCore(), handler, directory)

            await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))

            try {
                const { body, protocol } = await new Promise((resolve, reject) => {
                    https.get({
                        host: '127.0.0.1',
                        port: server.address().port,
                        path: '/health',
                        agent: false,
                        // Like the load balancer and the probes.
                        rejectUnauthorized: false
                    }, (response) => {
                        const protocol = response.socket.getProtocol()
                        let body = ''
                        response.on('data', (chunk) => { body += chunk })
                        response.on('end', () => resolve({ body, protocol }))
                    }).on('error', reject)
                })

                expect(body).toBe('ok')
                expect([ 'TLSv1.2', 'TLSv1.3' ]).toContain(protocol)
            } finally {
                await new Promise((resolve) => server.close(resolve))
            }
        })
    })
})
