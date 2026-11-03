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
 * TLS for the apps' connections to Postgres.
 *
 * The configuration's `database.ssl` chooses how they connect:
 *
 *   'disable'      No TLS. The default, for local development, where the
 *                  database runs alongside the app.
 *   'verify-full'  TLS, and the server has to present a certificate that
 *                  chains to one of `database.certificateAuthorities`, for
 *                  the host name the app connected to. The same as libpq's
 *                  sslmode=verify-full. Staging and production use it.
 *
 * `database.certificateAuthorities` is the certificates themselves, in PEM,
 * not a path. Staging and production read them from Parameter Store
 * (/<environment>/database/certificate-authorities): the Amazon RDS root
 * certificate authority their database instances use. They're trusted for
 * the database connection only, in place of Node's usual list.
 *
 * There's deliberately no mode that encrypts without verifying the server:
 * that would protect against someone reading the traffic, but not against
 * someone in the middle of it.
 ******************************************************************************/

const { X509Certificate } = require('crypto')
const net = require('net')

const SSL_MODES = [ 'disable', 'verify-full' ]

/**
 * Parse PEM certificates.
 *
 * @param {string} pem  One or more PEM certificates.
 *
 * @return {X509Certificate[]} Each certificate, in order.
 *
 * @throws {Error} When a certificate doesn't parse.
 */
function readCertificates(pem) {
    const blocks = (pem ?? '').match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g) ?? []
    return blocks.map((block) => new X509Certificate(block))
}

/**
 * @param {X509Certificate} certificate
 *
 * @return {string|undefined} The certificate's subject common name.
 */
function commonName(certificate) {
    return certificate.subject.split('\n').find((part) => part.startsWith('CN='))?.substring(3)
}

/**
 * @param {X509Certificate} certificate
 * @param {Date} now
 *
 * @return {boolean} Whether the certificate is valid at `now`.
 */
function isCurrent(certificate, now) {
    return new Date(certificate.validFrom) <= now && now <= new Date(certificate.validTo)
}

/**
 * @param {Object} database The configuration's `database` block.
 *
 * @return {string} The block's TLS mode, 'disable' when it doesn't set one.
 */
function sslMode(database) {
    return database?.ssl || 'disable'
}

/**
 * Check the `database` block's TLS settings, for Config.validateConfig().
 *
 * @param {Object} database The configuration's `database` block.
 * @param {Date} [now] The time to check the certificates' validity at.
 *
 * @return {string[]} One message per problem; empty when there are none.
 */
function checkSSLConfig(database, now = new Date()) {
    const problems = []
    const mode = sslMode(database)

    if ( ! SSL_MODES.includes(mode) ) {
        problems.push(`database.ssl in the configuration must be one of `
            + `${SSL_MODES.map((m) => `'${m}'`).join(' or ')}, but it's '${mode}'.`)
        return problems
    }

    // With 'disable', the certificate authorities aren't used, whether
    // they're set or not: staging and production always load them, and
    // setting /<environment>/database/ssl to 'disable' has to keep working.
    if ( mode !== 'verify-full' ) {
        return problems
    }

    // pg only tells TLS which host name to expect when the host is a name.
    // Given an IP address, Node checks the certificate against "localhost"
    // instead, which would quietly skip the host name check. Amazon RDS
    // endpoints are always names.
    if ( database?.host && net.isIP(database.host) !== 0 ) {
        problems.push(`database.ssl is 'verify-full', so database.host has to be the host name on the `
            + `server's certificate, not an IP address ('${database.host}').`)
    }

    if ( ! database?.certificateAuthorities ) {
        problems.push(`database.ssl is 'verify-full', so the configuration needs database.certificateAuthorities: `
            + `the PEM certificates of the certificate authorities to trust.`)
        return problems
    }

    let certificates = null
    try {
        certificates = readCertificates(database.certificateAuthorities)
    } catch (error) {
        problems.push(`A certificate in database.certificateAuthorities doesn't parse: ${error.message}`)
        return problems
    }

    if ( certificates.length === 0 ) {
        problems.push(`database.certificateAuthorities has no PEM certificates in it.`)
    } else if ( ! certificates.some((certificate) => isCurrent(certificate, now)) ) {
        problems.push(`None of the certificate authorities in database.certificateAuthorities is valid now: `
            + certificates.map((certificate) => `${commonName(certificate)} (${certificate.validFrom} to ${certificate.validTo})`).join(', ')
            + `. Put the current one in Parameter Store.`)
    }

    return problems
}

/**
 * Describe the certificate authorities a 'verify-full' connection trusts,
 * for the log.
 *
 * @param {Object} database The configuration's `database` block.
 *
 * @return {string} Each one's common name and expiry, or why there are none.
 */
function describeCertificateAuthorities(database) {
    try {
        const certificates = readCertificates(database?.certificateAuthorities)
        if ( certificates.length === 0 ) {
            return 'none'
        }
        return certificates.map((certificate) => `${commonName(certificate)} (until ${certificate.validTo})`).join(', ')
    } catch (error) {
        return `unreadable (${error.message})`
    }
}

/**
 * The `ssl` option for a pg Pool.
 *
 * @param {Object} database The configuration's `database` block.
 *
 * @return {boolean|Object} false for 'disable'. For 'verify-full', the
 * trusted certificate authorities, with verification on. pg sets the TLS
 * `servername` to the host it connects to (when it's a name, not an IP
 * address), and Node checks the server's certificate against it, so this
 * verifies the host name as well as the certificate chain.
 *
 * @throws {Error} For an unknown mode, or 'verify-full' without certificate
 * authorities. Config.validateConfig() reports both before this is called.
 */
function sslOptions(database) {
    const mode = sslMode(database)

    if ( mode === 'disable' ) {
        return false
    }

    if ( mode === 'verify-full' ) {
        if ( ! database.certificateAuthorities ) {
            throw new Error(`database.ssl is 'verify-full', but database.certificateAuthorities isn't set.`)
        }
        return {
            ca: database.certificateAuthorities,
            rejectUnauthorized: true
        }
    }

    throw new Error(`database.ssl must be one of ${SSL_MODES.join(', ')}, but it's '${mode}'.`)
}

module.exports = {
    SSL_MODES,
    readCertificates,
    commonName,
    isCurrent,
    sslMode,
    checkSSLConfig,
    describeCertificateAuthorities,
    sslOptions
}
