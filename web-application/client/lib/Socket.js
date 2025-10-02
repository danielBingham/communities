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

import logger from '/logger'

import { Capacitor } from '@capacitor/core'
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin'

export class SocketError extends Error {
    constructor(type, message) {
        super(message)
        this.type = type
    }
}

export default class Socket {
    constructor() {
        this.socket = null

        this.keepAliveTimeout = null
        this.keepAliveInterval = null

        this.eventHandlers = {
            'error': [],
            'message': [],
            'close': [],
            'open': []
        }
    }

    resetHandlers() {
        this.eventHandlers['error'] = []
        this.eventHandlers['message'] = []
        this.eventHandlers['close'] = []
        this.eventHandlers['open'] = []
    }

    isOpen() {
        if ( this.socket !== null ) {
            return this.socket.readyState === WebSocket.OPEN
        } else {
            return false
        }
    }

    isClosed() {
        if ( this.socket !== null ) {
            return this.socket.readyState === WebSocket.CLOSED
        } else {
            return true
        }
    }

    isConnecting() {
        if ( this.socket !== null ) {
            return this.socket.readyState === WebSocket.CONNECTING
        } else {
            return false
        }
    }

    isClosing() {
        if ( this.socket !== null ) { 
            return this.socket.readyState === WebSocket.CLOSING
        } else {
            return false
        }
    }

    ping() {
        try { 
            const sent = this.send({ entity: 'Ping' })
            if ( sent === false ) {
                if ( ! this.isConnecting() && ! this.isOpen() ) {
                    logger.warn(`Socket :: Connection lost.`)
                    this.disconnect()
                }
            }
        } catch (error) {
            logger.error(error)
            this.disconnect()
        }

        this.keepAliveTimeout = setTimeout(() => {
            logger.warn(`Socket :: Connection lost.`)
            this.disconnect() 
        }, 10000)
    }

    pong() {
        clearTimeout(this.keepAliveTimeout) 
        this.keepAliveTimeout = null
    }

    startListening() {
        if ( this.socket !== null ) {
            this.socket.addEventListener('message', (event) => {
                const data = JSON.parse(event.data)
                if ( data.entity === 'Pong' ) {
                    this.pong()
                } else { 
                    for(const handler of this.eventHandlers['message']) {
                        handler(data)
                    }
                }
            })

            this.socket.addEventListener('error', (event) => {
                logger.error(`Socket :: Error: ${event.message} ::`, event)

                for(const handler of this.eventHandlers['error']) {
                    handler(event)
                }
                this.disconnect()
            })

            this.socket.addEventListener('open', (event) => {
                logger.info(`Socket :: Connected.`)
                if ( this.keepAliveTimeout !== null ) {
                    clearTimeout(this.keepAliveTimeout)
                }
                if ( this.keepAliveInterval !== null ) {
                    clearInterval(this.keepAliveInterval)
                }

                this.keepAliveInterval = setInterval(() => {
                    this.ping()
                }, 30000)

                for(const handler of this.eventHandlers['open']) {
                    handler(event)
                }
            })

            this.socket.addEventListener('close', (event) => {
                logger.info(`Socket :: Closed.`)
                // Clear any hanging keepAlives
                clearTimeout(this.keepAliveTimeout)
                this.keepAliveTimeout = null
                clearInterval(this.keepAliveInterval)
                this.keepAliveInterval = null

                for(const handler of this.eventHandlers['close']) {
                    handler(event)
                }

                // Once we've handled the close event, reset.
                this.resetHandlers()
                this.socket = null
            })
        } else {
            logger.warn(`Socket :: Attempt to listen without a created socket.`)
        }
    }

    async connect(host) {
        logger.info(`>>> UPGRADE /socket :: BEGIN connection to ${host}...`)
        const protocols = [ 'wss', 'x-communities-platform', Capacitor.getPlatform() ]

        if ( Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android' ) {
            try { 
                const secureValue = await SecureStoragePlugin.get({ key: 'auth-token' })
                const authToken = encodeURIComponent(secureValue.value)
                protocols.push('x-communities-auth', authToken)
            } catch (error) {
                logger.warn(`>>> UPGRADE /socket :: Missing auth token. Refusing to connect.`)
                return
            }
        }

        try {
            if ( this.socket === null ) {

                this.socket = new WebSocket(host, protocols)
                this.startListening()
            } else if ( this.socket !== null && this.socket.readyState !== WebSocket.OPEN && this.socket.readyState !== WebSocket.CONNECTING ) {
                // Ensure we're closing the old one.
                this.socket.close()

                // Open a new one.
                this.socket = new WebSocket(host, protocols)
                this.startListening()
            } else {
                logger.warn(`>>> UPGRADE /socket :: Attempt to connect a connected socket.`)
            }
        } catch (error) {
            logger.error(`>>> UPGRADE /socket :: Connection failed: ${error.message}`, error)
        }
    }

    disconnect() {
        if ( this.socket !== null ) {
            if ( this.socket.readyState === WebSocket.OPEN 
                || this.socket.readyState === WebSocket.CONNECTING 
                || this.socket.readyState === WebSocket.CLOSING
            ) {
                this.socket.close()
            } else {
                // If we're calling this, then the socket was somehow closed
                // without us triggering the appropriate handlers.
                for(const handler of this.eventHandlers['close']) {
                    handler()
                }
                // If the socket is already closed, then cleanup and reset.
                this.resetHandlers()
                this.socket = null
            }
        } else {
            // If we don't have a socket, then trigger the close event handlers
            // anyway.
            for(const handler of this.eventHandlers['close']) {
                handler()
            }

            // If the socket is already closed, then cleanup and reset.
            this.resetHandlers()
            this.socket = null
        }
    }

    send(message) {
        if ( this.isOpen() ) {
            this.socket.send(JSON.stringify(message))
            return true
        } else {
            return false
        }
    }

    on(event, handler) {
        this.eventHandlers[event].push(handler)
    }

}

