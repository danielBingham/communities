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
const http2 = require("http2")
const fs = require("fs")
const path = require("path")

const SessionService = require('../SessionService')

const STATE = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    DISCONNECTING: 'disconnecting'
}

const REASON = {
    SHUTDOWN: 'Shutdown',
    UNAVAILABLE: 'ServiceUnavailable',
    ERROR: 'InternalServerError'
}

module.exports = class IOSNotifications {

    constructor(core) {
        this.core = core

        this.sessionService = new SessionService(core)

        this.queue = []

        this.timeoutId = null
        this.attempts = 0

        this.state = STATE.DISCONNECTED
        this.client = this.connect()
    }

    getCredentials() {
        const keyPath = path.join(process.cwd(), this.core.config.notifications.ios.privateCert) 
        const certPath = path.join(process.cwd(), this.core.config.notifications.ios.publicCert)

        const key = fs.readFileSync(keyPath)
        const cert = fs.readFileSync(certPath)

        return {
            key: key,
            cert: cert
        }
    }

    reconnect(reason) {
        let retryTimeout = 1000
        if ( reason === REASON.SHUTDOWN) {
            this.core.logger.info(`=== IOS Notifications:: Server Shutdown. Reconnecting...`)
            retryTimeout = retryTimeout * Math.exp(this.attempts) 
        } else if ( reason === REASON.UNAVAILABLE ) {
            this.core.logger.info(`=== IOS Notifications:: Service Unavailable. Trying in 15 minutes...`)
            retryTimeout = 15 * 60 * 1000 * Math.exp(this.attempts)
        } else if ( reason === REASON.ERROR ) {
            this.core.logger.info(`=== IOS Notifications:: Server Error. Reconnecting...`)
            retryTimeout = 1000 * Math.exp(this.attempts)
        } else {
            this.core.logger.info(`=== IOS Notifications:: Unknown disconnect.  Reconnecting...`)
            retryTimeout = 1000 * Math.exp(this.attempts)
        }
       
        if ( this.timeoutId === null ) {
            this.timeoutId = setTimeout(() => {
                this.timeoutId = null
                this.client = this.connect()
            }, retryTimeout)
        }
    }

    connect() {
        this.core.logger.info(`=== IOS Notifications:: Connecting...`)
        this.attempts = this.attempts + 1
        this.state = STATE.CONNECTING

        // `client` is a ClientHttp2Session: https://nodejs.org/api/http2.html#class-clienthttp2session
        // Which extends Http2Session: https://nodejs.org/api/http2.html#class-http2session
        const client = http2.connect(this.core.config.notifications.ios.endpoint, this.getCredentials())

        client.on("close", () => {
            this.core.logger.debug(`=== IOS Notifications:: Connection closed.`)
            if ( this.state !== STATE.DISCONNECTING ) {
                this.reconnect()
            }
            this.state = STATE.DISCONNECTED
        })

        client.on("connect", () => {
            this.core.logger.debug(`=== IOS Notifications:: Connected.`)
            this.timeoutId = null
            this.attempts = 0

            this.state = STATE.CONNECTED
            this.flushQueue()
        })

        client.on("error", (error) => this.core.logger.error(error))
        client.on("goaway", (errorCode, lastStreamId, data) => {
            this.core.logger.debug(`=== IOS Notifications:: 'goaway' Frame: `, data.toString('utf8'))
            this.core.logger.debug(`Code: ${errorCode}, StreamId: ${lastStreamId}`)
            this.state = STATE.DISCONNECTING

            const payload = JSON.parse(data.toString('utf8'))
            if ( 'reason' in payload) {
                this.reconnect(payload.reason)
            }
        })

        return client
    }

    async notify(userId, notification) {
        this.core.logger.debug(`=== IOS Notifications:: Notifying User(${userId})...`)
        this.queue.push({ userId: userId, notification: notification })

        await this.flushQueue()
    }

    async flushQueue() {
        if ( this.state !== STATE.CONNECTED ) {
            return
        }

        this.core.logger.debug(`=== IOS Notifications:: Flushing the Queue...`)
        while ( this.queue.length > 0 ) {
            const item = this.queue.shift()
            await this.sendNotificationToUser(item.userId, item.notification)
        }
    }

    async sendNotificationToUser(userId, notification) {
        const sessions = await this.sessionService.getSessions(userId)
        const devices = {}
        for(const session of sessions) {
            if ( ! ('device' in session.data ) ) {
                continue
            } 

            if ( session.data.platform !== 'ios' ) {
                continue
            }

            if ( ! ('deviceToken' in session.data.device) ) {
                continue
            }

            const token = session.data.device.deviceToken

            // TODO TECHDEBT Right now it's possible to have multiple hanging
            // native app sessions for the device.  If something happens that
            // causes the app to lose its token (secure storage to be wiped for
            // example) without destroying the session, then the session will
            // survive all the way up until its expiration time.
            //
            // We don't want to send duplicate notifications to dead sessions.
            // The device tokens should be immutable for some combination of
            // device and app, so record which tokens we've already sent
            // notifications to and don't send more than one notification.
            if ( token in devices ) {
                continue
            } else {
                devices[token] = true
            }

            const path = `/3/device/${token}`

            const body = {
                aps: {
                    alert: {
                        title: "You have a new notification on Communities",
                        body: notification.description
                    }
                },
                path: notification.path,
                notificationId: notification.id
            }

            const headers = {
                ":method": "POST",
                "apns-topic": this.core.config.notifications.ios.applicationBundleID,
                "apns-push-type": "alert",
                ":scheme": "https",
                ":path": path
            }

            this.core.logger.debug(`=== IOS Notifications:: Attempting to send notification: `, body)
            this.core.logger.debug(`=== IOS Notifications:: With headers: `, headers)
            this.core.logger.debug(`=== IOS Notifications:: To device: `, session.data.device)

            // `request` is a ClientHttp2Stream: https://nodejs.org/api/http2.html#class-clienthttp2stream
            // Which extends Http2Stream: https://nodejs.org/api/http2.html#class-http2stream
            const clientStream = this.client.request(headers)

            // TODO Retry sending notifications that fail.
            let requestError = false
            clientStream.on("error", (error) => {
                requestError = true 
                this.core.logger.error(`=== IOS Notifications:: Request Error ===\n`, error)
            })
            clientStream.on("frameError", (type, code, id) => {
                requestError = true
                this.core.logger.error(`=== IOS Notifications:: FrameError ===\n type: ${type}, code: ${code}, id: ${id}.`)
            })
            clientStream.on("response", (responseHeaders, flags) => {
                if ( responseHeaders[':status'] !== 200 ) {
                    requestError = true
                    this.core.logger.error(`=== IOS Notifications:: Failed Request ===`)
                    this.core.logger.error(`Body: `, body)
                    this.core.logger.error(`Headers: `, headers)
                    this.core.logger.error(`Response Headers: `, responseHeaders)
                }
            })
            clientStream.on("data", (data) => {
                if ( requestError ) {
                    this.core.logger.error(`=== IOS Notifications:: Data frame ===\n`, data)
                }
            })
            clientStream.setEncoding("utf8")

            clientStream.write(JSON.stringify(body))
            clientStream.end()
        }
    }
}
