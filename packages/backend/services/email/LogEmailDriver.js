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
const crypto = require('node:crypto')
const fs = require('node:fs/promises')
const path = require('node:path')

/**
 * Decode the HTML entities a template leaves in an href (Handlebars escapes
 * `=` as `&#x3D;`, for example), so a logged link can be used as is.
 */
const decodeEntities = function(text) {
    const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }
    return text.replace(/&(?:#x([0-9a-f]+)|#([0-9]+)|([a-z]+));/gi, (entity, hex, decimal, name) => {
        if ( hex ) return String.fromCodePoint(parseInt(hex, 16))
        if ( decimal ) return String.fromCodePoint(parseInt(decimal, 10))
        return Object.hasOwn(named, name.toLowerCase()) ? named[name.toLowerCase()] : entity
    })
}

/**
 * Doesn't send email: logs each message instead, for local development.
 *
 * Configured by the `email.log` block:
 *
 *   email: {
 *       driver: 'log',
 *       log: {
 *           directory: 'tmp/email'
 *       }
 *   }
 *
 * Every message is logged with its recipient, subject, stream and the links
 * in its body (so you can follow an email confirmation link from the log).
 * When `directory` is set, each message is also written there in full as a
 * JSON file; otherwise the full HTML body is logged too. A relative
 * directory is relative to the app's working directory.
 */
module.exports = class LogEmailDriver {

    /**
     * @param {Core} core
     * @param {Object} [settings]   The `email.log` block.
     * @param {string} [settings.directory] Where to write each message.
     */
    constructor(core, settings) {
        this.logger = core.logger
        this.directory = settings?.directory || null
    }

    /**
     * "Send" one message.
     *
     * @param {Object} message  A Postmark message: From, To, Subject,
     * HtmlBody, MessageStream.
     */
    async send(message) {
        let file = null
        if ( this.directory !== null ) {
            await fs.mkdir(this.directory, { recursive: true })

            const date = new Date()
            const name = `${date.toISOString().replace(/[:.]/g, '-')}-${message.MessageStream ?? 'email'}-${crypto.randomBytes(3).toString('hex')}.json`
            file = path.join(this.directory, name)
            await fs.writeFile(file, JSON.stringify({ Date: date.toISOString(), ...message }, null, 2) + '\n')
        }

        const links = [ ...(message.HtmlBody ?? '').matchAll(/href="([^"]+)"/g) ].map((match) => decodeEntities(match[1]))

        let entry = `Email not sent (log driver): ${message.MessageStream} to ${message.To}: "${message.Subject}"`
        for (const link of links) {
            entry += `\n    link: ${link}`
        }
        entry += file !== null
            ? `\n    saved to ${file}`
            : `\n${message.HtmlBody}`

        this.logger.info(entry)
    }
}
