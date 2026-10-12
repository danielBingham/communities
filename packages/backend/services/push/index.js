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
const AndroidPushDriver = require('./AndroidPushDriver')
const IOSPushDriver = require('./IOSPushDriver')
const LogPushDriver = require('./LogPushDriver')

/**
 * Create the push notification drivers the configuration turns on.
 *
 * Each block under `notifications` turns on the driver with the same name,
 * with the block as its settings, and every driver that's on gets each push
 * notification. An empty or missing `notifications` block turns push
 * notifications off.
 *
 *   notifications: {
 *       ios: { privateCert: ..., publicCert: ..., applicationBundleID: ..., endpoint: ... },
 *       android: { firebaseServiceAccount: ... },
 *       log: {}
 *   }
 *
 * @param {Core} core   A core with `config` and `logger`.
 * @param {Logger} [logger] The logger the drivers use; defaults to the core's.
 *
 * @return {Object[]} The drivers: objects with `async send(userId,
 * notification)`.
 *
 * @throws {Error} When a block isn't a known driver, a driver's settings are
 * incomplete, or the log driver is used outside development.
 */
const createPushDrivers = function(core, logger) {
    const drivers = []

    for (const [name, settings] of Object.entries(core.config.notifications ?? {})) {
        if ( name === 'ios' ) {
            drivers.push(new IOSPushDriver(core, settings, logger))
        } else if ( name === 'android' ) {
            drivers.push(new AndroidPushDriver(core, settings, logger))
        } else if ( name === 'log' ) {
            if ( core.config.environment === 'development' ) {
                drivers.push(new LogPushDriver(core, settings, logger))
            } else {
                throw new Error('The log push driver may only be used in development.')
            }
        } else {
            throw new Error(`notifications.${name} in the configuration isn't a push driver. `
                + `Each block under notifications must be one of 'ios', 'android' or 'log'.`)
        }
    }

    return drivers
}

module.exports = {
    AndroidPushDriver: AndroidPushDriver,
    IOSPushDriver: IOSPushDriver,
    LogPushDriver: LogPushDriver,
    createPushDrivers: createPushDrivers
}
