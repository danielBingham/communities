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

const path = require('path')
const fs = require('fs')

const { initializeApp, getApp, getApps, cert } = require('firebase-admin/app')
const { getMessaging } = require('firebase-admin/messaging')

const SessionService = require('../SessionService')

module.exports = class AndroidNotifications {

    constructor(core) {
        this.core = core

        this.sessionService = new SessionService(core)

        this.app = null
        if ( getApps().length <= 0 ) {
            const serviceAccount = JSON.parse(fs.readFileSync(path.join(process.cwd(), this.core.config.notifications.android.firebaseServiceAccount)))
            this.app = initializeApp({
                credential: cert(serviceAccount)
            }, 'communities')
        } else {
            this.app = getApp('communities')
        }

        this.messaging = getMessaging(this.app)
    }


    async sendAndroidNotification(userId, notification) {
        const sessions = await this.sessionService.getSessions(userId)

        for(const session of sessions) {
            if ( 'device' in session.data 
                && session.data.platform === 'android' 
                && 'deviceToken' in session.data.device) 
            {

                const token = session.data.device.deviceToken
                const message = {
                    token: token,
                    notification: {
                        title: "You have a new notification on Communities",
                        body: notification.description
                    },
                    data: {
                        path: notification.path,
                        notificationId: notification.id
                    }
                }
                
                this.core.logger.debug(`Attempting to send notification: `, message)
                this.core.logger.debug(`To device: `, session.data.device)

                try { 
                    const response = await this.messaging.send(message)
                    this.core.logger.debug(`Got response: `)
                    this.core.logger.debug(response)
                } catch (error) {
                    this.core.logger.error(`Failed sending Android Notification: `, error)
                    this.core.logger.error(`Message: `, message)
                    this.core.logger.error(`Device: `, session.data.device)
                }
            }
        }
    }
}
