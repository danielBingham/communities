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

const { fetchEndpoint } = require('./fetchEndpoint')

const initialize = async function() {
    const response = await fetchEndpoint('GET', '/system/initialization')

    if ( ! response.ok ) {
        throw new Error('Initialization failed.')
    }

    const csrf = response.content.csrf

    if ( ! response.raw.headers.has('X-Communities-Auth') ) {
        throw new Error('Missing authentication header.')
    }
    const auth = response.raw.headers.get('X-Communities-Auth')

    return {
        csrf: csrf,
        auth: auth
    }
}

const login = async function(credentials, session) {
    const response = await fetchEndpoint('POST', '/authentication', {
        body: credentials,
        session: session
    })

    if ( ! response.ok ) {
        throw new Error('Authentication failed.')
    }

    if ( response.raw.headers.has('X-Communities-Auth') ) {
        session.auth = response.raw.headers.get('X-Communities-Auth')
    }

    return response.content.session.user
}

const logout = async function(session) {
    const response = await fetchEndpoint('DELETE', '/authentication', { session: session })

    if ( ! response.ok ) {
        throw new Error('Failed to destroy the session.')
    }

    if ( response.raw.headers.has('X-Communities-Auth') ) {
        session.auth = response.raw.headers.get('X-Communities-Auth')
    }

    return response.content
}

module.exports = {
    initialize: initialize,
    login: login,
    logout: logout
}
