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

/******************************************************************************
 * Signed links: how long the links each storage driver hands out last.
 *
 * Browsers load stored files from signed links, which the API returns with
 * how many seconds each lasts (`sourceLifetimes`). The client asks for a new
 * link shortly before one runs out, and again if one fails to load
 * (web-application/client/state/File).
 *
 * A driver's `link_lifetime` setting caps its links, in seconds. It defaults
 * to the longest S3 allows, 7 days. Set it low (60, say) in a development
 * configuration to watch the client replace links.
 ******************************************************************************/

/**
 * The longest a link may last: S3's limit for links signed with Signature
 * Version 4, which the filesystem driver keeps to as well.
 */
const MAX_LINK_LIFETIME_SECONDS = 60*60*24*7

/**
 * The shortest `link_lifetime` allowed. The client replaces a link when a
 * quarter of its life is left, so much shorter than this would have it
 * asking almost constantly.
 */
const MIN_LINK_LIFETIME_SECONDS = 60

/**
 * Check a driver's `link_lifetime` setting.
 *
 * @param {number|string|undefined} value   The setting, in seconds: a number,
 * or a string of digits (a value from Parameter Store or the environment).
 * @param {string} block    The driver's configuration block, for the message:
 * e.g. `storage.s3`.
 *
 * @return {number} The lifetime in seconds: the setting, or the longest
 * allowed when it isn't set.
 *
 * @throws {Error} When the setting isn't a whole number of seconds from
 * MIN_LINK_LIFETIME_SECONDS to MAX_LINK_LIFETIME_SECONDS.
 */
const linkLifetimeSetting = function(value, block) {
    if ( value === undefined || value === null || value === '' ) {
        return MAX_LINK_LIFETIME_SECONDS
    }

    const seconds = typeof value === 'number' ? value
        : ( typeof value === 'string' && /^[0-9]+$/.test(value) ? parseInt(value, 10) : NaN )

    if ( ! Number.isInteger(seconds) || seconds < MIN_LINK_LIFETIME_SECONDS || seconds > MAX_LINK_LIFETIME_SECONDS ) {
        throw new Error(`${block}.link_lifetime in the configuration must be a whole number of seconds from `
            + `${MIN_LINK_LIFETIME_SECONDS} to ${MAX_LINK_LIFETIME_SECONDS} (7 days), but it's '${value}'.`)
    }

    return seconds
}

module.exports = {
    MAX_LINK_LIFETIME_SECONDS: MAX_LINK_LIFETIME_SECONDS,
    MIN_LINK_LIFETIME_SECONDS: MIN_LINK_LIFETIME_SECONDS,
    linkLifetimeSetting: linkLifetimeSetting
}
