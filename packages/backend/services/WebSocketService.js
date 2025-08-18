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

module.exports = class WebSocketService { 

    constructor(core) {
        this.core = core

        this.server = null

        this.sockets = {}
    }

    getServer() {
        return this.server
    }

    addUserSocket(user, socket) {
        if ( ! ( user.id in this.sockets ) ) {
            this.sockets[user.id] = []
        }

        this.sockets[user.id].push(socket)
    }
    
    removeUserSocket(user, socket) {
        if ( ! ( user.id in this.sockets) ) {
            return
        }

        this.sockets[user.id] = this.sockets[user.id].filter((s) => s !== socket)
    }

    getUserSockets(user) {
        if ( user.id in this.sockets ) {
            return this.sockets[user.id]
        }

        return []
    }

    initialize() {
        this.server = new WebSocketServer({ clientTracking: false, noServer: true });

        this.server.on('connection', (socket, request) => {
            const currentUser = request.session.user
            
            if ( ! currentUser ) {
                throw new Error('Socket connection received with no active session.')
            }

            this.addUserSocket(currentUser, socket)

            socket.on('error', console.error)

            const eventLisenter = (event) => {
                socket.send(JSON.stringify(event))
            }

            this.core.events.listen(currentUser.id, eventListener)

            socket.on('close', () => {
                this.core.events.stopListening(currentUser.id, eventListener)
                this.removeUserSocket(currentUser, socket)
            })
        })
    }
}

