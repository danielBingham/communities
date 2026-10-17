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
 * When the server already has the data a page is about to request from the
 * API -- because it read it to render the page's metadata -- it sends the API
 * responses with the page, in index.html:
 *
 *  <script type="application/json" id="communities-preloaded-responses">
 *      {"GET /news/a-post":{"status":200,"body":{"entity":{...},"relations":{}}}}
 *  </script>
 *
 * and the client's makeRequest() answers those requests from them instead
 * of the network.  See `web-application/server/controllers/PageController.js`
 * and `web-application/client/state/lib/preloadedResponses.js`.
 *
 * Both sides key the responses with getPreloadedResponseKey(), so they agree
 * on what request a response answers.
 ******************************************************************************/

/**
 * The id of the <script> element that holds the responses.
 */
const ELEMENT_ID = 'communities-preloaded-responses'

/**
 * The key for a request: its method and endpoint, normalized so that the
 * same request always gets the same key.
 *
 * Endpoints are relative to the API's root, the way makeRequest() takes them:
 * '/news/a-post', '/news?page=2'.  The query's parameters are sorted, so the
 * order they were written in doesn't matter.
 *
 * @param {string} method   The request's method, e.g. 'GET'.
 * @param {string} endpoint The request's endpoint, e.g. '/news?page=2'.
 *
 * @return {string} The key, e.g. 'GET /news?page=2'.
 */
const getPreloadedResponseKey = function(method, endpoint) {
    // The origin is a placeholder, only there so URL will parse the endpoint
    // into its path and query for us.
    const url = new URL(endpoint, 'https://preloaded.invalid')
    url.searchParams.sort()

    return `${String(method).toUpperCase()} ${url.pathname}${url.search}`
}

module.exports = {
    ELEMENT_ID: ELEMENT_ID,
    getPreloadedResponseKey: getPreloadedResponseKey
}
