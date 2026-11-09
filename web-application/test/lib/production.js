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
 * Keeps the tests off production.
 *
 * The tests create and delete users and post as them, so they may only run
 * against a local environment or staging. Every request the integration
 * tests make goes through fetchEndpoint.js, which checks API_ROOT here; the
 * end-to-end tests also check the browser's BASE_URL and refuse any request
 * the page itself makes to production (see test/e2e/lib/browser.js).
 *
 * Production is communities.social and every host under it, except staging.
 * Anything else (localhost, another machine on your network) is allowed.
 ******************************************************************************/

const PRODUCTION_DOMAIN = 'communities.social'

// The only hosts under the production domain the tests may use.
const ALLOWED_HOSTS = [ 'staging.communities.social' ]

/**
 * Whether `url` (a string or a URL) is on production. Throws if it isn't a
 * URL, so a mistyped one fails rather than slipping through.
 */
const isProduction = function(url) {
    // The trailing dot of a fully qualified name ('communities.social.') is
    // still production.
    const hostname = new URL(url).hostname.toLowerCase().replace(/\.$/, '')

    if ( ALLOWED_HOSTS.includes(hostname) ) {
        return false
    }

    return hostname === PRODUCTION_DOMAIN || hostname.endsWith(`.${PRODUCTION_DOMAIN}`)
}

/**
 * Throw if `url` is on production. `name` says where it came from, for the
 * message.
 */
const refuseProduction = function(url, name) {
    if ( isProduction(url) ) {
        throw new Error(`Tests may not be run against production! ${name} is ${url}.`)
    }
}

module.exports = {
    isProduction: isProduction,
    refuseProduction: refuseProduction
}
