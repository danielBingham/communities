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
const https = require('https')
const http = require('http')

const createHTTPServer = function(core, app, sessionParser, webSocketServer) {
    core.logger.info(`Initializing the HTTP server...`)
    let server = null

    if ( process.env.NODE_ENV == 'development') {
        const httpsOptions = {
          key: fs.readFileSync('./security/key.pem'),
          cert: fs.readFileSync('./security/cert.pem')
        }
        server = https.createServer(httpsOptions, app)
    } else {
        server = http.createServer(app);
    }

    server.on('error', function(error) {
        core.logger.error('ERROR.')
        if (error.syscall !== 'listen') {
            throw error
        }

        var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                core.logger.error(bind + ' requires elevated privileges')
                process.exit(1)
                break
            case 'EADDRINUSE':
                core.logger.error(bind + ' is already in use')
                process.exit(1)
                break
            default:
                core.logger.error(error)
                throw error
        }
    })

    const onSocketError = function(error) {
        core.logger.error(error)
    }

    if ( webSocketServer && sessionParser ) {
        core.logger.info(`Wiring Web Socket Server to HTTP upgrades...`)
        server.on('upgrade', function (request, httpSocket, head) {
            console.log(`Recieved upgrade request...`)
            httpSocket.on('error', onSocketError) 
            
            sessionParser(request, {}, function() {
                console.log(request.session)
                /*if ( ! request.session.user ) {
                    console.log(`Denied upgrade request.`)
                    httpSocket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
                    httpSocket.destroy()
                    return
                }*/

                httpSocket.removeListener('error', onSocketError)

                webSocketServer.handleUpgrade(request, httpSocket, head, function (webSocket) {
                    webSocketServer.emit('connection', webSocket, request)
                })
            })
        })
    }

    server.on('listening', function() {
        var addr = server.address();
        var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
        core.logger.info('Listening on ' + bind);
    })

    return server
}

module.exports = {
    createHTTPServer: createHTTPServer
}


