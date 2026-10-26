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

// PATCH /authentication is the multi-factor verification endpoint.  It covers
// the guard clauses (not logged in, missing token, already logged in) and the
// second step of logging in an MFA user, with a TOTP token or a recovery code.
//
// The 'user-mfa' fixture is created with a real TOTP secret and ten recovery
// codes (see fixtures/users.js), so this suite generates tokens from the
// secret, as an authenticator app would (lib/multifactor.js), and uses the
// codes directly.  Recovery codes are single-use: each test takes its own.

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

const { initialize, login, logout } = require('../../../lib/authentication')
const { fetchEndpoint } = require('../../../lib/fetchEndpoint')
const { currentToken, wrongToken } = require('../../../lib/multifactor')

const { getFixture } = require('../../../lib/fixtures')

// Which of the fixture's recovery codes each test spends.
const RECOVERY_CODE_FOR_LOGIN = 0
const RECOVERY_CODE_FOR_REUSE = 1

// Keep the session's auth header current: logging in regenerates the session.
const useAuthHeader = function(response, session) {
    if ( response.raw.headers.has('X-Communities-Auth') ) {
        session.auth = response.raw.headers.get('X-Communities-Auth')
    }
}

// Log the MFA fixture in as far as its password goes.  The session is left
// pending, waiting for a TOTP token or a recovery code.
const beginMultifactorLogin = async function() {
    const fixture = getFixture('user-mfa')
    const session = await initialize()

    const response = await fetchEndpoint('POST', '/authentication', {
        body: { email: fixture.email, password: fixture.password },
        session: session
    })
    useAuthHeader(response, session)

    assert.equal(response.status, 200)
    assert.equal(response.content?.session?.user, undefined)
    assert.equal(response.content?.session?.pendingUserId, fixture.id)

    return { session, fixture }
}

const verify = async function(session, body) {
    const response = await fetchEndpoint('PATCH', '/authentication', { body: body, session: session })
    useAuthHeader(response, session)
    return response
}

// Who GET /authentication says the session belongs to, if anyone.
const currentSession = async function(session) {
    const response = await fetchEndpoint('GET', '/authentication', { session: session })
    assert.equal(response.status, 200)
    return response.content?.session
}

describe('PATCH /authentication', function() {
    it('Should reject a request that has not logged in yet', async function() {
        // An initialized-but-anonymous session carries a valid CSRF token (so
        // we get past the CSRF middleware) but has neither a user nor a
        // pendingUserId, so verification should report that no login is in
        // progress.
        const session = await initialize()

        const response = await fetchEndpoint('PATCH', '/authentication', {
            body: { token: '123456' },
            session: session
        })

        assert.equal(response.status, 401)
        assert.equal(response.content?.error?.type, 'not-authenticated')

        await logout(session)
    })

    it('Should reject a logged-in user who omits the token', async function() {
        const session = await initialize()

        const user1 = getFixture('user1')

        const credentials = {
            email: user1.email,
            password: user1.password
        }

        await login(credentials, session)

        // A fully logged-in user hitting the verify endpoint without a token
        // is a bad request.
        const response = await fetchEndpoint('PATCH', '/authentication', {
            body: {},
            session: session
        })

        assert.equal(response.status, 400)
        assert.equal(response.content?.error?.type, 'invalid')

        await logout(session)
    })

    it('Should reject verification from a user who is not mid-MFA-setup', async function() {
        const session = await initialize()

        const user1 = getFixture('user1')

        const credentials = {
            email: user1.email,
            password: user1.password
        }

        await login(credentials, session)

        // user1 is a normal, fully-authenticated user whose MFA state is not
        // 'pending', so submitting a token to "verify" is not authorized --
        // they're already logged in.
        const response = await fetchEndpoint('PATCH', '/authentication', {
            body: { token: '123456' },
            session: session
        })

        assert.equal(response.status, 403)
        assert.equal(response.content?.error?.type, 'not-authorized')

        await logout(session)
    })

    describe('for a user mid-MFA-login', function() {
        it('Should complete login for a valid TOTP token', async function() {
            const { session, fixture } = await beginMultifactorLogin()

            const response = await verify(session, { token: await currentToken(fixture.multifactorSecret) })

            assert.equal(response.status, 200)
            assert.equal(response.content?.session?.user?.id, fixture.id)

            // The session is fully logged in now.
            const after = await currentSession(session)
            assert.equal(after?.user?.id, fixture.id)

            await logout(session)
        })

        it('Should reject an incorrect TOTP token', async function() {
            const { session, fixture } = await beginMultifactorLogin()

            const response = await verify(session, { token: await wrongToken(fixture.multifactorSecret) })

            assert.equal(response.status, 404)
            assert.equal(response.content?.error?.type, 'not-found')

            // Still only pending: no user on the session.
            const after = await currentSession(session)
            assert.equal(after?.user, undefined)
            assert.equal(after?.pendingUserId, fixture.id)

            await logout(session)
        })

        it('Should reject a token that is not six characters', async function() {
            const { session } = await beginMultifactorLogin()

            const response = await verify(session, { token: '12345' })

            assert.equal(response.status, 400)
            assert.equal(response.content?.error?.type, 'invalid')

            await logout(session)
        })

        it('Should reject a request with neither a token nor a recovery code', async function() {
            const { session } = await beginMultifactorLogin()

            const response = await verify(session, {})

            assert.equal(response.status, 400)
            assert.equal(response.content?.error?.type, 'invalid')

            await logout(session)
        })

        it('Should complete login for a valid recovery code', async function() {
            const { session, fixture } = await beginMultifactorLogin()

            const response = await verify(session, {
                recoveryCode: fixture.recoveryCodes[RECOVERY_CODE_FOR_LOGIN]
            })

            assert.equal(response.status, 200)
            assert.equal(response.content?.session?.user?.id, fixture.id)

            const after = await currentSession(session)
            assert.equal(after?.user?.id, fixture.id)

            await logout(session)
        })

        it('Should reject an invalid recovery code', async function() {
            const { session } = await beginMultifactorLogin()

            const response = await verify(session, { recoveryCode: 'not-a-recovery-code' })

            assert.equal(response.status, 404)
            assert.equal(response.content?.error?.type, 'not-found')

            await logout(session)
        })

        it('Should accept a recovery code only once', async function() {
            const code = getFixture('user-mfa').recoveryCodes[RECOVERY_CODE_FOR_REUSE]

            const first = await beginMultifactorLogin()
            const used = await verify(first.session, { recoveryCode: code })
            assert.equal(used.status, 200)
            await logout(first.session)

            const second = await beginMultifactorLogin()
            const reused = await verify(second.session, { recoveryCode: code })
            assert.equal(reused.status, 404)
            assert.equal(reused.content?.error?.type, 'not-found')
            await logout(second.session)
        })
    })
})
