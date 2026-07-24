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
const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

const { initialize, login, logout } = require('../../lib/authentication')
const { fetchEndpoint } = require('../../lib/fetchEndpoint')

const userDictionary = require('../../fixtures/users')

describe('DELETE /authentication', function() {
    it('Should log out an authenticated user', async function() {
        const session = await initialize()

        const user1 = userDictionary['user1']

        const credentials = {
            email: user1.email,
            password: user1.password
        }

        await login(credentials, session)

        // Confirm we are actually authenticated before logging out.
        const before = await fetchEndpoint('GET', '/authentication', { session: session })
        assert.equal(before.content?.session?.user?.username, user1.username)

        const response = await fetchEndpoint('DELETE', '/authentication', { session: session })

        // The endpoint regenerates the session and hands back a fresh auth
        // token; track it so subsequent calls use the post-logout session.
        if ( response.raw.headers.has('X-Communities-Auth') ) {
            session.auth = response.raw.headers.get('X-Communities-Auth')
        }

        assert.equal(response.status, 200)
        assert.equal(response.content, null)

        // The session should now be anonymous.
        const after = await fetchEndpoint('GET', '/authentication', { session: session })
        assert.equal(after.status, 200)
        assert.equal(after.content?.session, null)
    })

    it('Should succeed even when the caller is not logged in', async function() {
        // Logging out an anonymous session is a harmless no-op that still
        // regenerates the session.
        const session = await initialize()

        const response = await fetchEndpoint('DELETE', '/authentication', { session: session })

        if ( response.raw.headers.has('X-Communities-Auth') ) {
            session.auth = response.raw.headers.get('X-Communities-Auth')
        }

        assert.equal(response.status, 200)
        assert.equal(response.content, null)

        const after = await fetchEndpoint('GET', '/authentication', { session: session })
        assert.equal(after.status, 200)
        assert.equal(after.content?.session, null)
    })

    it('Should invalidate the previous session token after logout', async function() {
        const session = await initialize()

        const user1 = userDictionary['user1']

        const credentials = {
            email: user1.email,
            password: user1.password
        }

        await login(credentials, session)

        // Capture the authenticated token, then log out (which rotates it).
        const authenticatedToken = session.auth

        await logout(session)

        // Replay a request using the *old*, pre-logout token.  It must not
        // resolve back to the logged-in user.
        const staleSession = { csrf: session.csrf, auth: authenticatedToken }
        const response = await fetchEndpoint('GET', '/authentication', { session: staleSession })

        assert.equal(response.status, 200)
        assert.equal(response.content?.session?.user, undefined)
    })
})
