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
 * When to replace a file's signed link.
 *
 * The API returns each link in `sources` with how many seconds it's signed
 * for in `sourceLifetimes` (the storage block's `link_lifetime`, 7 days
 * unless set), and the app keeps links for as long as the page is open, so
 * they need replacing. On staging and production a link can also stop
 * working sooner, when the credentials it's signed with expire
 * (S3Storage.getSignedLink() in packages/backend); File replaces those when
 * they fail to load.
 *
 * Each link gets a refresh time, kept in the File slice's
 * `sourceRefreshTimes`: a little before it runs out. A link past its refresh
 * time is replaced before it's shown again (useFileSource), and one that
 * fails to load is replaced once (File).
 *
 * Times are this device's clock, counted from when the response arrived, so
 * a device whose clock is wrong still replaces links on time.
 ******************************************************************************/

/**
 * How long before a link runs out it's replaced: 5 minutes, or a quarter of
 * its life if that's shorter (a development configuration's short
 * `link_lifetime`).
 */
export const REFRESH_AHEAD_MS = 5 * 60 * 1000

/**
 * When a link that lasts `lifetime` seconds, received at `receivedAt`,
 * should be replaced.
 *
 * @param {number} lifetime     Seconds, from the response's `sourceLifetimes`.
 * @param {number} receivedAt   When the response arrived, in milliseconds
 * (Date.now()).
 *
 * @return {number|undefined} The time in milliseconds, or undefined when
 * `lifetime` isn't a positive number (a server that doesn't send it).
 */
export const refreshTimeFor = function(lifetime, receivedAt) {
    if ( typeof lifetime !== 'number' || ! Number.isFinite(lifetime) || lifetime <= 0 ) {
        return undefined
    }

    const lifetimeMs = lifetime * 1000
    return receivedAt + lifetimeMs - Math.min(REFRESH_AHEAD_MS, lifetimeMs / 4)
}

/**
 * The refresh time of each link in a response.
 *
 * @param {Object} sources      The response's `sources`: link by variant.
 * @param {Object} [lifetimes]  The response's `sourceLifetimes`: seconds by
 * variant.
 * @param {number} receivedAt   When the response arrived, in milliseconds.
 *
 * @return {Object} Refresh time by variant, for each link with a lifetime.
 */
export const refreshTimesFor = function(sources, lifetimes, receivedAt) {
    const times = {}
    for (const variant of Object.keys(sources ?? {})) {
        const time = refreshTimeFor(lifetimes?.[variant], receivedAt)
        if ( typeof sources[variant] === 'string' && time !== undefined ) {
            times[variant] = time
        }
    }
    return times
}

/**
 * Whether a link with this refresh time should be replaced before it's
 * shown. A link without one (from a server that doesn't send lifetimes) is
 * kept.
 *
 * @param {number|undefined} refreshTime
 * @param {number} now  Date.now()
 *
 * @return {boolean}
 */
export const isDueForRefresh = function(refreshTime, now) {
    return typeof refreshTime === 'number' && now >= refreshTime
}
