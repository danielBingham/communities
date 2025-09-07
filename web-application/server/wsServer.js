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

const { WebSocketServer } = require('ws')
const Uuid = require('uuid')

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
    core.logger.debug(`Establishing socket Connection(${connectionId})...`)

    if ( ! currentUser ) {
      core.logger.warn(`Unauthenticated user opened a socket Connection(${connectionId}).`)
      socket.close()
      return
    }

    socket.on('error', (error) => {
      core.logger.error(error)
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
        core.logger.warn(`Unrecognized event recieved on Connect(${connectionId}): `)
        core.logger.warn(event)
      }
    })

    core.events.registerConnection(currentUser.id, connectionId, (event) => {
      socket.send(JSON.stringify(event))
    })

    socket.on('close', () => {
      core.logger.debug(`Closing socket Connection(${connectionId}).`)
      core.events.unregisterConnection(currentUser.id, connectionId)
    })
  })

  httpServer.on('upgrade', function(request, httpSocket, head) {
    httpSocket.on('error', errorListener)

    const { pathname } = new URL(request.url, core.config.wsHost)

    if ( pathname === '/socket') {
      sessionParser(request, {}, () => {
        const currentUser = request.session.user
        if ( ! currentUser ) {
          core.logger.warn(`WebSocket Upgrade Failed: Unauthenticated request: `, request)
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
