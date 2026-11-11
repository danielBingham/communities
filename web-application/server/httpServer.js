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

const https = require('https')
const http = require('http')

const { loadCertificate } = require('./certificate')

/**
 * Log where a server listens, and stop the process with a readable message
 * when it can't.
 */
const reportListening = function(core, server, name) {
    server.on('error', function(error) {
        core.logger.error('ERROR.')
        if (error.syscall !== 'listen') {
            throw error
        }

        var bind = error.port !== undefined ? 'Port ' + error.port : 'Pipe ' + error.address

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                core.logger.error(`${name}: ${bind} requires elevated privileges`)
                process.exit(1)
                break
            case 'EADDRINUSE':
                core.logger.error(`${name}: ${bind} is already in use`)
                process.exit(1)
                break
            default:
                core.logger.error(error)
                throw error
        }
    })

    server.on('listening', function() {
        var addr = server.address();
        var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
        core.logger.info(`${name}: listening on ${bind}`);
    })
}

/**
 * The web application's server. It serves HTTPS, in every environment, with
 * the certificate from ./security or one it makes itself (see
 * certificate.js).
 *
 * @param {Core} core
 * @param {function} app  The request handler: the Express app.
 * @param {string} certificateDirectory  Where to look for key.pem and
 *     cert.pem.
 *
 * @return {https.Server} Not yet listening.
 */
const createHTTPServer = function(core, app, certificateDirectory = './security') {
    core.logger.info(`Initializing the HTTPS server...`)
    const { key, cert } = loadCertificate(core, certificateDirectory)

    // TLS 1.2 is Node's default minimum too; it's set here so it's on record.
    const server = https.createServer({ key, cert, minVersion: 'TLSv1.2' }, app)
    reportListening(core, server, 'HTTPS server')

    return server
}

/******************************************************************************
 * TRANSITIONAL (feat-7-tls-everywhere). Plain HTTP on 8080 as well as HTTPS,
 * the way the server has always served staging and production, so the load
 * balancer and Kubernetes' probes can move to HTTPS without dropping
 * requests. The infrastructure repository's runbooks/feat-7-tls-everywhere
 * moves them. Its last step is the release that removes this.
 ******************************************************************************/

const PLAIN_HTTP_PORT = 8080

/**
 * @param {Core} core
 * @param {function} app  The request handler: the Express app.
 *
 * @return {http.Server} Not yet listening.
 */
const createPlainHTTPServer = function(core, app) {
    core.logger.info(`Initializing the plain HTTP server (until feat-7-tls-everywhere is done)...`)
    const server = http.createServer(app)
    reportListening(core, server, 'Plain HTTP server')

    return server
}

module.exports = {
    createHTTPServer: createHTTPServer,
    createPlainHTTPServer: createPlainHTTPServer,
    PLAIN_HTTP_PORT: PLAIN_HTTP_PORT
}
