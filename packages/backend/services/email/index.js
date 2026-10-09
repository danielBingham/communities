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
const LogEmailDriver = require('./LogEmailDriver')
const PostmarkEmailDriver = require('./PostmarkEmailDriver')

/**
 * Create the email driver the configuration selects.
 *
 * `email.driver` names the driver, and the block with the same name holds
 * that driver's settings; blocks for other drivers aren't used.
 *
 *   email: {
 *       driver: 'postmark',
 *       postmark: { api_token: 'aws-ssm-parameter:/postmark/api-token' }
 *   }
 *
 * @param {Core} core   A core with `config` and `logger`.
 *
 * @return {Object} The driver: an object with `async send(message)`.
 *
 * @throws {Error} When `email.driver` isn't a known driver, or the driver's
 * settings are incomplete.
 */
const createEmailDriver = function(core) {
    const driver = core.config.email?.driver

    if ( driver === 'postmark' ) {
        return PostmarkEmailDriver(core, core.config.email.postmark)
    } else if ( driver === 'log' ) {
        if ( core.config.environment === 'development' ) {
            return LogEmailDriver(core, core.config.email.log)
        } else {
            throw new Error('The log email driver may only be used in development.')
        }
    } else {
        throw new Error(`email.driver in the configuration must be one of 'postmark' or 'log'.`
            + `but it's '${driver ?? ''}'.`)
    }
}

module.exports = {
    LogEmailDriver: LogEmailDriver,
    PostmarkEmailDriver: PostmarkEmailDriver,
    createEmailDriver: createEmailDriver
}
