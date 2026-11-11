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

/******************************************************************************
 * The certificate the web application serves HTTPS with.
 *
 * The web application only serves HTTPS, in every environment. Where its
 * certificate comes from:
 *
 *   Development   The self-signed certificate you create in ./security
 *                 (documentation/running-locally.md). The webpack dev server
 *                 serves the same one, so you trust it once, for your
 *                 browser and the tests.
 *   Staging and   Nothing is in ./security (the image doesn't include it),
 *   production    so the server makes a new self-signed certificate each
 *                 time it starts.
 *
 * In staging and production the only clients are the load balancer, which
 * re-encrypts each request to the pods, and Kubernetes' probes. Neither
 * checks the certificate: AWS's load balancers don't validate their targets'
 * certificates, relying on the VPC to stop anyone impersonating a target. So
 * the certificate only has to encrypt; nothing has to trust it, and there's
 * nothing to store, share or renew. Each pod's key lives only as long as the
 * pod.
 ******************************************************************************/

const fs = require('fs')
const os = require('os')
const path = require('path')
const { X509Certificate } = require('crypto')
const { execFileSync } = require('child_process')

const KEY_FILE = 'key.pem'
const CERTIFICATE_FILE = 'cert.pem'

// Longer than any pod lives. Nothing checks the dates, but a certificate
// that hasn't expired keeps tools like `openssl s_client` quiet.
const GENERATED_CERTIFICATE_DAYS = 365
const GENERATED_CERTIFICATE_SUBJECT = '/CN=communities-web-application'

/**
 * Make a new self-signed certificate, with openssl, the same way
 * documentation/running-locally.md has you make the development one.
 *
 * openssl writes the key and certificate to a private scratch folder, which
 * is deleted before this returns. On Linux the folder is in /dev/shm, which
 * is memory, so the key isn't written to disk.
 *
 * @return {{ key: string, cert: string }} The PEM key and certificate.
 *
 * @throws {Error} When openssl isn't installed or fails.
 */
function createSelfSignedCertificate() {
    const parent = fs.existsSync('/dev/shm') ? '/dev/shm' : os.tmpdir()
    // mkdtemp makes the folder readable only by this user.
    const scratch = fs.mkdtempSync(path.join(parent, 'communities-certificate-'))

    try {
        const keyPath = path.join(scratch, KEY_FILE)
        const certificatePath = path.join(scratch, CERTIFICATE_FILE)

        try {
            execFileSync('openssl', [
                'req', '-x509',
                '-newkey', 'rsa:2048', '-nodes',
                '-sha256',
                '-days', String(GENERATED_CERTIFICATE_DAYS),
                '-subj', GENERATED_CERTIFICATE_SUBJECT,
                '-keyout', keyPath,
                '-out', certificatePath
            ], { stdio: [ 'ignore', 'ignore', 'pipe' ] })
        } catch (error) {
            const detail = error.stderr?.toString().trim() || error.message
            throw new Error(`Couldn't create a self-signed certificate with openssl: ${detail}`)
        }

        return {
            key: fs.readFileSync(keyPath, 'utf8'),
            cert: fs.readFileSync(certificatePath, 'utf8')
        }
    } finally {
        fs.rmSync(scratch, { recursive: true, force: true })
    }
}

/**
 * Describe a certificate for the logs: its subject, SHA-256 fingerprint and
 * expiry, so you can tell which certificate a server is presenting.
 *
 * @param {string|Buffer} cert  A PEM certificate.
 *
 * @return {string}
 */
function describeCertificate(cert) {
    const certificate = new X509Certificate(cert)
    return `${certificate.subject.replace(/\n/g, ', ')}; SHA-256 ${certificate.fingerprint256}; `
        + `valid until ${certificate.validTo}`
}

/**
 * The key and certificate to serve HTTPS with: the ones in `directory` when
 * it has both, otherwise a new self-signed certificate (see the top of this
 * file).
 *
 * @param {Core} core
 * @param {string} directory  Where to look for key.pem and cert.pem, relative
 *     to the working directory. './security' in every environment.
 *
 * @return {{ key: string|Buffer, cert: string|Buffer }}
 *
 * @throws {Error} When `directory` has only one of the two files, or a new
 *     certificate can't be made.
 */
function loadCertificate(core, directory = './security') {
    const keyPath = path.join(directory, KEY_FILE)
    const certificatePath = path.join(directory, CERTIFICATE_FILE)
    const hasKey = fs.existsSync(keyPath)
    const hasCertificate = fs.existsSync(certificatePath)

    // Half a pair is a mistake, not a reason to quietly make a new one.
    if ( hasKey !== hasCertificate ) {
        const [ found, missing ] = hasKey ? [ keyPath, certificatePath ] : [ certificatePath, keyPath ]
        throw new Error(`Found ${found} but not ${missing}. Put both in ${directory} to serve that `
            + `certificate, or neither to have the server make its own.`)
    }

    if ( hasKey ) {
        const certificate = {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certificatePath)
        }
        core.logger.info(`Serving HTTPS with the certificate in ${directory} (${describeCertificate(certificate.cert)}).`)
        return certificate
    }

    const certificate = createSelfSignedCertificate()
    core.logger.info(`Nothing in ${directory}, so serving HTTPS with a new self-signed certificate `
        + `(${describeCertificate(certificate.cert)}).`)
    return certificate
}

module.exports = {
    loadCertificate,
    createSelfSignedCertificate,
    describeCertificate
}
