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

const API_ROOT = process.env.API_ROOT ?? 'https://localhost:3000/api/0.0.0/'

const fetchEndpoint = async function(method, endpoint, options) {

    if ( API_ROOT.startsWith('https://communities.social') || API_ROOT.startsWith('http://communities.social') ) {
        throw new Error('Integration tests may not be run against production!')
    }

    const fetchOptions = {
        method: method,
        headers: {
            'Accept': 'application/json',
            'X-Communities-Platform': 'test',
            'Cache-Control': 'no-store',
        }
    }

    if ( options && typeof options === 'object' ) {
        if ( 'session' in options && options.session ) {
            fetchOptions.headers['X-Communities-CSRF-Token'] = options.session.csrf
            fetchOptions.headers['X-Communities-Auth'] = options.session.auth
        }

        if ( 'body' in options && options.body ) {
            fetchOptions.body = JSON.stringify(options.body)
            fetchOptions.headers['Content-Type'] = 'application/json'
        }
    }


    // Because the URL's weird resolution rules, we need to make sure
    // to convert these into relative URLs that URL can handle.
    let relativeEndpoint = endpoint
    if ( relativeEndpoint.startsWith('/') ) {
        relativeEndpoint = '.' + relativeEndpoint
    }
    let url = new URL(relativeEndpoint, API_ROOT)
    const response = await fetch(url.href, fetchOptions)

    const content = await response.json()
    return { status: response.status, ok: response.ok, content: content, raw: response }
}

module.exports = {
    fetchEndpoint: fetchEndpoint
}
