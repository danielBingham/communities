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

module.exports = class IOSNotifications {

    constructor(core) {
        this.core = core

        this.sessionService = new SessionService(core)

        const keyPath = path.join(process.cwd(), this.core.config.notifications.ios.privateCert) 
        const certPath = path.join(process.cwd(), this.core.config.notifications.ios.publicCert)
        const key = fs.readFileSync(keyPath)
        const cert = fs.readFileSync(certPath)
        this.client = http2.connect(this.core.config.notifications.ios.endpoint, {
            key: key,
            cert: cert 
        })

        this.client.on("error", (error) => this.core.logger.error(error))
        this.client.on("goaway", (errorCode, lastStreamId, data) => {
            this.core.logger.debug(`IOS Notifications:: 'goaway' Frame: `)
            this.core.logger.debug(`Code: ${errorCode}, StreamId: ${lastStreamId}`)
            this.core.logger.debug(`Data: `, data)
        })
    }

    async sendIOSNotification(userId, notification) {
        const sessions = await this.sessionService.getSessions(userId)

        for(const session of sessions) {
            if ( 'device' in session.data 
                && session.data.device.platform === 'ios' 
                && 'deviceToken' in session.data.device) 
            {
                const token = session.data.device.deviceToken
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

                const request = this.client.request(headers)

                let requestError = false
                request.on("error", (error) => {
                    requestError = true 
                    this.core.logger.error(`=== IOS Notifications:: Request Error ===\n`, error)
                })
                request.on("frameError", (type, code, id) => {
                    requestError = true
                    this.core.logger.error(`=== IOS Notifications:: FrameError ===\n type: ${type}, code: ${code}, id: ${id}.`)
                })
                request.on("response", (responseHeaders, flags) => {
                    if ( responseHeaders[':status'] !== 200 ) {
                        requestError = true
                        this.core.logger.error(`=== IOS Notifications:: Failed Request ===`)
                        this.core.logger.error(`Body: `, body)
                        this.core.logger.error(`Headers: `, headers)
                        this.core.logger.error(`Response Headers: `, responseHeaders)
                    }
                })
                request.on("data", (data) => {
                    if ( requestError ) {
                        this.core.logger.error(`=== IOS Notifications:: Data frame ===\n`, data)
                    }
                })
                request.setEncoding("utf8")

                request.write(JSON.stringify(body))
                request.end()
            }
        }
    }


}
