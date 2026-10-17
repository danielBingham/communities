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
 * Preloaded Responses
 *
 * The server sends some pages with the API responses for the requests the
 * page makes as it loads, so we don't have to make them: a News post comes
 * with the response to `GET /news/:slug`.  They're in index.html:
 *
 *  <script type="application/json" id="communities-preloaded-responses">
 *      {"GET /news/a-post":{"status":200,"body":{"entity":{...},"relations":{}}}}
 *  </script>
 *
 * makeRequest() asks takePreloadedResponse() before it goes to the network,
 * so the thunks, slices and hooks don't know the difference.  See
 * `server/controllers/PageController.js` for the other side.
 *
 * A preloaded response is what the API said when the page loaded, so:
 *  - Each one answers one request.  After that, the request goes to the
 *    network like any other, so refreshing gets current data.
 *  - They expire a minute after the page loads.  A request made later than
 *    that, perhaps after navigating away and back, should get current data.
 *
 * The mobile apps load index.html from their bundle, so they never have any.
 ******************************************************************************/
import * as shared from '@communities/shared'

import logger from '/logger'

/**
 * How long after the page starts loading its preloaded responses may be
 * used, in milliseconds.  Long enough for the app to initialize on a slow
 * connection before it requests the page's data.
 */
export const MAX_AGE = 60 * 1000

/**
 * The responses we haven't used yet, keyed by
 * `lib.preloadedResponses.getPreloadedResponseKey()`: `{ status, body }`.
 * Null until we've read them from the page.
 */
let responses = null

/**
 * Read the preloaded responses from the page.  Anything that isn't a
 * response is left out, so a bad block can only cost us the preloading.
 *
 * @return {Map} The responses.
 */
const readPreloadedResponses = function() {
    const found = new Map()

    if ( typeof document === 'undefined' ) {
        return found
    }

    const element = document.getElementById(shared.lib.preloadedResponses.ELEMENT_ID)
    if ( element === null ) {
        return found
    }

    let parsed = null
    try {
        parsed = JSON.parse(element.textContent)
    } catch (error) {
        logger.warn(`PreloadedResponses:: Couldn't read the responses preloaded with the page: `, error)
        return found
    }

    if ( parsed === null || typeof parsed !== 'object' || Array.isArray(parsed) ) {
        return found
    }

    for(const [key, response] of Object.entries(parsed)) {
        if ( response !== null && typeof response === 'object'
            && Number.isInteger(response.status) && response.status >= 200 && response.status <= 599
            && 'body' in response
        ) {
            found.set(key, response)
        }
    }

    return found
}

/**
 * Take the preloaded response for a request, if the page came with one.
 *
 * @param {string} method   The request's method.
 * @param {string} endpoint The request's endpoint, relative to the API's
 * root, as makeRequest() was given it.
 *
 * @return {Response|null} A Response for makeRequest() to handle as if it
 * came from fetch(), or null when there isn't one.
 */
export const takePreloadedResponse = function(method, endpoint) {
    if ( responses === null ) {
        responses = readPreloadedResponses()
    }

    if ( responses.size === 0 ) {
        return null
    }

    // performance.now() counts from when the page started loading.
    if ( performance.now() > MAX_AGE ) {
        responses.clear()
        return null
    }

    const key = shared.lib.preloadedResponses.getPreloadedResponseKey(method, endpoint)
    if ( ! responses.has(key) ) {
        return null
    }

    const preloaded = responses.get(key)
    responses.delete(key)

    logger.debug(`PreloadedResponses:: Answering ${key} with the response preloaded with the page.`)

    return new Response(JSON.stringify(preloaded.body), {
        status: preloaded.status,
        headers: { 'Content-Type': 'application/json' }
    })
}
