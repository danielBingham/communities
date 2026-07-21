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

describe('GET /authentication', function() {
    it('Should return the current session', async function() {
        const session = await initialize()

        const user1 = userDictionary['user1']

        const credentials = {
            email: user1.email,
            password: user1.password
        }

        const currentUser = await login(credentials, session)

        const response = await fetchEndpoint('GET', '/authentication', { session: session })

        assert.equal(response.status, 200)
        assert.equal(response.content?.session?.user?.username, user1.username)
        assert.equal(response.content?.session?.user?.username, currentUser.username)

        await logout(session)
    })

    it('Should return the full user record (minus password) for the current session', async function() {
        const session = await initialize()

        const user1 = userDictionary['user1']

        const credentials = {
            email: user1.email,
            password: user1.password
        }

        const currentUser = await login(credentials, session)

        const response = await fetchEndpoint('GET', '/authentication', { session: session })

        assert.equal(response.status, 200)
        assert.equal(response.content?.session?.user?.id, currentUser.id)
        assert.equal(response.content?.session?.user?.username, user1.username)
        assert.equal(response.content?.session?.user?.email, user1.email)
        assert.equal(response.content?.session?.user?.password, null)

        await logout(session)
    })

    it('Should return a null session when the request is not authenticated', async function() {
        // A freshly initialized session is anonymous -- it has a CSRF token and
        // an auth token, but no logged in user.
        const session = await initialize()

        const response = await fetchEndpoint('GET', '/authentication', { session: session })

        assert.equal(response.status, 200)
        assert.equal(response.content?.session, null)

        await logout(session)
    })

    it('Should return a null session with no session credentials at all', async function() {
        // No session -> no CSRF/auth headers are sent.  GET is exempt from CSRF
        // checks, so this should simply report an anonymous (null) session.
        const response = await fetchEndpoint('GET', '/authentication')

        assert.equal(response.status, 200)
        assert.equal(response.content?.session, null)
    })

    it('Should return a null session after the user logs out', async function() {
        const session = await initialize()

        const user1 = userDictionary['user1']

        const credentials = {
            email: user1.email,
            password: user1.password
        }

        await login(credentials, session)

        // Confirm we're authenticated first.
        const authenticated = await fetchEndpoint('GET', '/authentication', { session: session })
        assert.equal(authenticated.content?.session?.user?.username, user1.username)

        // `logout()` updates `session.auth` to the post-logout token.
        await logout(session)

        const response = await fetchEndpoint('GET', '/authentication', { session: session })

        assert.equal(response.status, 200)
        assert.equal(response.content?.session, null)
    })

    it('Should return the pending session for a user mid-MFA-login', async function() {
        const session = await initialize()

        const user3 = userDictionary['user3']

        const credentials = {
            email: user3.email,
            password: user3.password
        }

        // For an MFA-enabled user, POST /authentication does not fully log them
        // in -- it returns a pending session and stashes `pendingUserId`.
        const postResponse = await fetchEndpoint('POST', '/authentication', { body: credentials, session: session })
        if ( postResponse.raw.headers.has('X-Communities-Auth') ) {
            session.auth = postResponse.raw.headers.get('X-Communities-Auth')
        }

        assert.equal(postResponse.status, 200)
        assert.equal(postResponse.content?.session?.user, undefined)
        assert.ok(postResponse.content?.session?.pendingUserId)

        const response = await fetchEndpoint('GET', '/authentication', { session: session })

        assert.equal(response.status, 200)
        assert.equal(response.content?.session?.user, undefined)
        assert.ok(response.content?.session?.pendingUserId)

        await logout(session)
    })
})
