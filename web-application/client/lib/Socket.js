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

export default class Socket {
    constructor() {
        this.socket = null

        this.messageHandlers = []
    }

    connect(host) {
        if ( this.socket === null ) {
            this.socket = new WebSocket(host)

            this.socket.addEventListener('message', (event) => {
                const data = JSON.parse(event.data)
                for(const handler of this.messageHandlers) {
                    handler(data)
                }
            })

            this.socket.addEventListener('error', (error) => {
                this.handleError(error)
            })
        } else {
            console.log(`Warning: Attempt to connect a connected socket.`)
        }
    }

    handleError(error) {
        console.error(error)
    }

    disconnect() {
        if ( this.socket !== null ) {
            this.socket.close()
            this.socket = null
        }
    }

    send(message) {
        if ( this.socket ) {
            this.socket.send(JSON.stringify(message))
        }
    }

    on(event, handler) {
        if ( this.socket !== null ) {
            if ( event === 'message' ) {
                this.messageHandlers.push(handler)
            } else {
                this.socket.addEventListener(event, handler)
            }
        }
    }
}

