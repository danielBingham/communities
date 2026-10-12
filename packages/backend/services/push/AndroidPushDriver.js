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

/**
 * Sends push notifications to the Android app through Firebase Cloud
 * Messaging.
 *
 * Configured by the `notifications.android` block:
 *
 *   notifications: {
 *       android: {
 *           firebaseServiceAccount: 'aws-ssm-parameter:/notifications/android/firebase-service-account-json'
 *       }
 *   }
 */
module.exports = class AndroidPushDriver {

    /**
     * @param {Core} core
     * @param {Object} settings The `notifications.android` block.
     * @param {string} settings.firebaseServiceAccount  The Firebase service
     * account, as JSON.
     * @param {Logger} [logger] Defaults to the core's logger.
     */
    constructor(core, settings, logger) {
        if ( ! settings?.firebaseServiceAccount ) {
            throw new Error(`The android push driver needs notifications.android.firebaseServiceAccount in the configuration.`)
        }

        this.core = core
        this.logger = logger ?? core.logger

        this.sessionService = new SessionService(core)

        this.app = null
        if ( getApps().length <= 0 ) {
            const serviceAccount = JSON.parse(settings.firebaseServiceAccount)
            this.app = initializeApp({
                credential: cert(serviceAccount)
            }, 'communities')
        } else {
            this.app = getApp('communities')
        }

        this.messaging = getMessaging(this.app)
    }


    /**
     * Send a notification to each of the user's Android devices.
     */
    async send(userId, notification) {
        const sessions = await this.sessionService.getSessions(userId)
        const devices = {}

        for(const session of sessions) {
            if ( ! ('device' in session.data ) ) {
                continue
            } 

            if ( session.data.platform !== 'android' ) {
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

            this.logger.verbose(`Attempting to send notification: `, message)
            this.logger.verbose(`To device: `, session.data.device)

            try { 
                const response = await this.messaging.send(message)
                this.logger.verbose(`Got response: `)
                this.logger.verbose(response)
            } catch (error) {
                this.logger.error(`Failed sending Android Notification: `, error)
                this.logger.error(`Message: `, message)
                this.logger.error(`Device: `, session.data.device)
            }
        }
    }
}
