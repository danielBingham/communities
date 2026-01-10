/******************************************************************************
 *
 *    Communities -- Non-profit, cooperative social media 
 *    Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *    This program is free software: you can redistribute it and/or modify
 *    it under the terms of the GNU Affero General Public License as published
 *    by the Free Software Foundation, either version 3 of the License, or
 *    (at your option) any later version.
 *
 *    This program is distributed in the hope that it will be useful,
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.    See the
 *    GNU Affero General Public License for more details.
 *
 *    You should have received a copy of the GNU Affero General Public License
 *    along with this program.    If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/

const { WebSocketServer } = require('ws')
const Uuid = require('uuid')

const { Logger } = require('@communities/backend') 

// ============ Header Smuggling ==============================================
// We have to smuggle our custom headers in through the Sec-WebSocket-Protocol
// header, since the WebSocket API doesn't give us any way to set custom headers.
//
// Both the Auth header and the Platform header are sent through this single
// header. We then parse them out, set them on the request object, and remove
// the protocol header.
const parseProtocolHeader = function(request) {
  const protocolsHeader = request.headers['sec-websocket-protocol']

  const smuggledHeaders = protocolsHeader.split(',').map((s) => s.trim())
  const protocol = smuggledHeaders.shift()
  for(let index = 0; index < smuggledHeaders.length-1; index=index+2) {
    const header = smuggledHeaders[index]
    const value = decodeURIComponent(smuggledHeaders[index+1])

    request.headers[header] = value
    request.headersDistinct[header] = [ value ]

    request.rawHeaders.push(header)
    request.rawHeaders.push(value)
  }

  // Remove the Protocols header.
  request.headers['sec-websocket-protocol'] = protocol 
  request.headersDistinct['sec-websocket-protocol'] = protocol 
  for(let index = 0; index < request.rawHeaders.length; index++) {
    if ( request.rawHeaders[index]?.toLowerCase() === 'sec-websocket-protocol' ) {
      request.rawHeaders[index+1] = protocol 
    }
  }
}

const createWebSocketServer = function(core, sessionParser, httpServer) {
  core.logger.info(`Initializing the Web Socket Server...`)
  const webSocketServer = new WebSocketServer({ noServer: true })

  const errorListener = function(error) {
    core.logger.error(`Socket error: `)
    core.logger.error(error)
  }

  webSocketServer.on('connection', function(socket, request) {
    const currentUser = request.session.user
    const connectionId = Uuid.v4()
    const logger = new Logger(core.logger.level, currentUser?.username, connectionId)

    if ( ! currentUser ) {
      logger.warn(`Unauthenticated user opened a socket connection.`)
      socket.close()
      return
    }

    logger.info(`Socket connection established.`)


    socket.on('error', (error) => {
      logger.error(error)
    })

    socket.on('message', (message) => {
      const event = JSON.parse(message)

      if ( event.entity === 'Ping' ) {
        socket.send(JSON.stringify({ entity: 'Pong' }))
      } else if ( event.action === 'subscribe' ) {
        core.events.subscribe(currentUser.id, connectionId, event)
      } else if ( event.action === 'unsubscribe' ) {
        core.events.unsubscribe(currentUser.id, connectionId, event)
      } else {
        logger.warn(`Unrecognized event recieved: %O`, event)
      }
    })

    core.events.registerConnection(currentUser.id, connectionId, (event) => {
      console.log(`Connection firing: `, event)
      socket.send(JSON.stringify(event))
    })

    socket.on('close', () => {
      logger.info(`Closing socket connection.`)
      core.events.unregisterConnection(currentUser.id, connectionId)
    })
  })

  httpServer.on('upgrade', function(request, httpSocket, head) {
    core.logger.verbose(`<<<<<<<<< UPGRADE /socket\n Headers: %O`, request.headers)

    httpSocket.on('error', errorListener)

    const { pathname } = new URL(request.url, core.config.wsHost)

    if ( pathname === '/socket') {
      parseProtocolHeader(request)

      sessionParser(request, {}, () => {
        const currentUser = request.session.user
        if ( ! currentUser ) {
          core.logger.warn(`WebSocket Upgrade Failed: Unauthenticated request`)
          core.logger.verbose(`Headers: `, request.headers)
          core.logger.verbose(`Session: `, request.session)
          httpSocket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
          httpSocket.destroy()
          return
        }

        httpSocket.removeListener('error', errorListener)

        webSocketServer.handleUpgrade(request, httpSocket, head, function(socket) {
          webSocketServer.emit('connection', socket, request)
        })
      })
    } else {
      httpSocket.destroy()
    }
  })

  return webSocketServer
}

module.exports = {
  createWebSocketServer: createWebSocketServer
}
