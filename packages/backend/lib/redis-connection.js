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
 * TLS and authentication for the apps' connections to Redis.
 *
 * The configuration's `redis` block chooses how they connect:
 *
 *   redis.tls   'disable'      No TLS. The default, for local development,
 *                              where Redis runs alongside the app.
 *               'verify-full'  TLS, and the server has to present a
 *                              certificate that chains to one of Node's
 *                              built-in certificate authorities, for the host
 *                              name the app connected to. Staging and
 *                              production use it.
 *
 *   redis.auth  'none'         No password. The default.
 *               'token'        Send redis.password, ElastiCache's AUTH token,
 *                              when connecting. Needs 'verify-full': a token
 *                              mustn't cross the network in plaintext, and
 *                              ElastiCache only accepts one over TLS.
 *
 * Unlike the database (see database-tls.js), there are no certificate
 * authorities to configure: ElastiCache's certificates are publicly trusted,
 * so Node's own list verifies them. To try 'verify-full' locally against a
 * self-signed certificate, start the app with NODE_EXTRA_CA_CERTS naming its
 * certificate authority.
 *
 * Staging and production read all three from Parameter Store
 * (/<environment>/redis/tls, /redis/auth and /redis/password). The password
 * is loaded whatever `auth` says, so turning AUTH on is a change to
 * /redis/auth and a restart. Sending a password to a server that doesn't
 * have one is an error, so `auth` stays 'none' until the server has a token.
 *
 * There's deliberately no mode that encrypts without verifying the server:
 * that would protect against someone reading the traffic, but not against
 * someone in the middle of it.
 *
 * Two libraries connect: node-redis, for rate limiting and the events
 * pub/sub, and ioredis, under Bull, for the queues. They take their options
 * in different shapes, so this builds both from the one block.
 ******************************************************************************/

const net = require('net')

const TLS_MODES = [ 'disable', 'verify-full' ]
const AUTH_MODES = [ 'none', 'token' ]

/**
 * What ElastiCache accepts as an AUTH token: 16 to 128 printable characters,
 * of which the only non-alphanumeric ones allowed are !, &, #, $, ^, <, > and -.
 */
const TOKEN_PATTERN = /^[A-Za-z0-9!&#$^<>-]{16,128}$/

/**
 * @param {Object} redis The configuration's `redis` block.
 *
 * @return {string} The block's TLS mode, 'disable' when it doesn't set one.
 */
function tlsMode(redis) {
    return redis?.tls || 'disable'
}

/**
 * @param {Object} redis The configuration's `redis` block.
 *
 * @return {string} The block's authentication mode, 'none' when it doesn't
 * set one.
 */
function authMode(redis) {
    return redis?.auth || 'none'
}

/**
 * Check the `redis` block's TLS and authentication settings, for
 * Config.validateConfig().
 *
 * @param {Object} redis The configuration's `redis` block.
 *
 * @return {string[]} One message per problem; empty when there are none.
 */
function checkRedisConfig(redis) {
    const problems = []
    const tls = tlsMode(redis)
    const auth = authMode(redis)

    if ( ! TLS_MODES.includes(tls) ) {
        problems.push(`redis.tls in the configuration must be one of `
            + `${TLS_MODES.map((m) => `'${m}'`).join(' or ')}, but it's '${tls}'.`)
    }

    if ( ! AUTH_MODES.includes(auth) ) {
        problems.push(`redis.auth in the configuration must be one of `
            + `${AUTH_MODES.map((m) => `'${m}'`).join(' or ')}, but it's '${auth}'.`)
    }

    // Node only checks the certificate's host name when it's given a name to
    // check (the TLS servername), and there's no name to give for an IP
    // address. ElastiCache endpoints are always names.
    if ( tls === 'verify-full' && redis?.host && net.isIP(redis.host) !== 0 ) {
        problems.push(`redis.tls is 'verify-full', so redis.host has to be the host name on the `
            + `server's certificate, not an IP address ('${redis.host}').`)
    }

    if ( auth === 'token' ) {
        if ( tls !== 'verify-full' ) {
            problems.push(`redis.auth is 'token', so redis.tls has to be 'verify-full': the token `
                + `mustn't be sent without TLS.`)
        }
        if ( ! redis?.password ) {
            problems.push(`redis.auth is 'token', so the configuration needs redis.password.`)
        } else if ( ! TOKEN_PATTERN.test(redis.password) ) {
            // Don't put the token, or any part of it, in the message.
            problems.push(`redis.password isn't a token ElastiCache accepts: 16 to 128 characters, `
                + `letters, digits and !&#$^<>- only (it has ${redis.password.length}).`)
        }
    }

    return problems
}

/**
 * Describe how the apps connect to Redis, for the log. Never includes the
 * password.
 *
 * @param {Object} redis The configuration's `redis` block.
 *
 * @return {string} E.g. "TLS: verify-full, AUTH: token".
 */
function describeRedisConnection(redis) {
    return `TLS: ${tlsMode(redis)}, AUTH: ${authMode(redis)}`
}

/**
 * The TLS options both libraries pass on to Node's tls.connect().
 *
 * @param {Object} redis The configuration's `redis` block.
 *
 * @return {Object|null} null for 'disable'. For 'verify-full', the host name
 * to verify the certificate against, with verification on, and Node's own
 * certificate authorities.
 *
 * @throws {Error} For an unknown mode. Config.validateConfig() reports it
 * before this is called.
 */
function tlsOptions(redis) {
    const mode = tlsMode(redis)

    if ( mode === 'disable' ) {
        return null
    }

    if ( mode === 'verify-full' ) {
        return {
            servername: redis.host,
            rejectUnauthorized: true
        }
    }

    throw new Error(`redis.tls in the configuration must be one of `
        + `${TLS_MODES.map((m) => `'${m}'`).join(' or ')}, but it's '${mode}'.`)
}

/**
 * @param {Object} redis The configuration's `redis` block.
 *
 * @return {string|undefined} The password to send, or undefined for 'none'.
 *
 * @throws {Error} For an unknown mode, or 'token' without a password.
 * Config.validateConfig() reports both before this is called.
 */
function password(redis) {
    const mode = authMode(redis)

    if ( mode === 'none' ) {
        return undefined
    }

    if ( mode === 'token' ) {
        if ( ! redis.password ) {
            throw new Error(`redis.auth is 'token', but redis.password isn't set.`)
        }
        return redis.password
    }

    throw new Error(`redis.auth in the configuration must be one of `
        + `${AUTH_MODES.map((m) => `'${m}'`).join(' or ')}, but it's '${mode}'.`)
}

/**
 * Options for node-redis's createClient(). Its duplicate() copies them, so
 * the events subscriber connects the same way.
 *
 * @param {Object} redis The configuration's `redis` block.
 *
 * @return {Object}
 */
function nodeRedisOptions(redis) {
    const tls = tlsOptions(redis)
    const secret = password(redis)

    return {
        socket: {
            host: redis.host,
            port: Number(redis.port),
            ...(tls ? { tls: true, ...tls } : {})
        },
        ...(secret ? { password: secret } : {})
    }
}

/**
 * Options for ioredis, as Bull's `redis` option. Bull opens up to three
 * connections per queue with them.
 *
 * Built field by field, rather than passing the `redis` block through:
 * ioredis would take its `tls` and `auth` strings as options of its own.
 *
 * @param {Object} redis The configuration's `redis` block.
 *
 * @return {Object}
 */
function bullRedisOptions(redis) {
    const tls = tlsOptions(redis)
    const secret = password(redis)

    return {
        host: redis.host,
        port: Number(redis.port),
        ...(secret ? { password: secret } : {}),
        ...(tls ? { tls } : {})
    }
}

module.exports = {
    TLS_MODES,
    AUTH_MODES,
    tlsMode,
    authMode,
    checkRedisConfig,
    describeRedisConnection,
    nodeRedisOptions,
    bullRedisOptions
}
