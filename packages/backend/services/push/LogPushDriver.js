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
     * @param {Core} core
     * @param {Object} [settings]   The `notifications.log` block (no
     * settings yet).
     * @param {Logger} [logger] Defaults to the core's logger.
     */
    constructor(core, settings, logger) {
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
