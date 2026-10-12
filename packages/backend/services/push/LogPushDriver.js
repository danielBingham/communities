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

/**
 * Doesn't send push notifications: logs each one instead, for local
 * development.
 *
 * Configured by an empty `notifications.log` block:
 *
 *   notifications: {
 *       log: {}
 *   }
 */
module.exports = class LogPushDriver {

    /**
     * Check the `notifications.log` block. It has no settings, but the
     * driver may only be used in development.
     *
     * @param {Object} [settings]   The `notifications.log` block.
     * @param {string} environment  The configuration's `environment`.
     *
     * @throws {Error} When the environment isn't development.
     */
    static validateConfig(settings, environment) {
        if ( environment !== 'development' ) {
            throw new Error('The log push driver may only be used in development.')
        }
    }

    /**
     * @param {Core} core
     * @param {Object} [settings]   The `notifications.log` block (no
     * settings yet).
     * @param {Logger} [logger] Defaults to the core's logger.
     */
    constructor(core, settings, logger) {
        LogPushDriver.validateConfig(settings, core.config?.environment)

        this.logger = logger ?? core.logger
    }

    /**
     * "Send" a notification to the user's devices.
     */
    async send(userId, notification) {
        this.logger.info(`Push notification not sent (log driver): ${notification.type} to User(${userId}): "${notification.description}"`
            + `\n    path: ${notification.path}`)
    }
}
