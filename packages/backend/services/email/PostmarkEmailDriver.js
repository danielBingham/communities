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
const Postmark = require('postmark')

const ServiceError = require('../../errors/ServiceError')

/**
 * Sends email through the Postmark API.
 *
 * Configured by the `email.postmark` block:
 *
 *   email: {
 *       driver: 'postmark',
 *       postmark: {
 *           api_token: 'aws-ssm-parameter:/postmark/api-token'
 *       }
 *   }
 */
module.exports = class PostmarkEmailDriver {

    /**
     * @param {Core} core
     * @param {Object} settings The `email.postmark` block.
     * @param {string} settings.api_token   The Postmark server API token.
     * @param {Object} [client] A Postmark client to use instead of
     * constructing one.
     */
    constructor(core, settings, client) {
        if ( ! settings?.api_token ) {
            throw new Error(`The postmark email driver needs email.postmark.api_token in the configuration.`)
        }

        this.client = client ?? new Postmark.ServerClient(settings.api_token)
    }

    /**
     * Send one message.
     *
     * @param {Object} message  A Postmark message: From, To, Subject,
     * HtmlBody, MessageStream.
     *
     * @throws {ServiceError} `invalid-email` when Postmark reports the
     * recipient as inactive (it bounced), otherwise `email-failed`.
     */
    async send(message) {
        try {
            await this.client.sendEmail(message)
        } catch (error) {
            // Inactive recipients error.  The message bounced because that
            // email address doesn't exist or isn't valid.
            if ( error.code === 406 ) {
                throw new ServiceError('invalid-email',
                    `Message bounced.  That email doesn't exist or isn't valid.`)
            } else {
                throw new ServiceError('email-failed',
                    `Attempt to send an email failed with message: ${error.message}.`)
            }
        }
    }
}
