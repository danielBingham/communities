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

describe(`POST /authentication`, function() {
    it('Should allow a user to log in', async function() {
        const session = await initialize()

        const user1 = userDictionary['user1']

        const credentials = {
            email: user1.email,
            password: user1.password
        }

        const response = await fetchEndpoint('POST', '/authentication', { body: credentials, session: session })

        // We're not using `login()` here, so we need to do this manually.
        if ( response.raw.headers.has('X-Communities-Auth') ) {
            session.auth = response.raw.headers.get('X-Communities-Auth')
        }

        assert.equal(response.status, 200)
        assert.equal(response.content?.session?.user?.name, user1.name)
        assert.equal(response.content?.session?.user?.email, user1.email)
        assert.equal(response.content?.session?.user?.username, user1.username)

        await logout(session)
    })

    it('Should reject a user with invalid credentials', async function() {
        const session = await initialize()

        const user1 = userDictionary['user1']

        const credentials = {
            email: user1.email,
            password: user1.password+'Password'
        }

        const response = await fetchEndpoint('POST', '/authentication', { body: credentials, session: session })

        assert.equal(response.status, 403)
        assert.equal(response.content?.error?.type, 'authentication-failed')

        await logout(session)
    })

    it(`Should reject a user who does not exist`, async function() {
        const session = await initialize()

        const credentials = {
            email: 'no-user@communities.social',
            password: 'PasswordPassword'
        }

        const response = await fetchEndpoint('POST', '/authentication', { body: credentials, session: session })

        assert.equal(response.status, 403)
        assert.equal(response.content?.error?.type, 'authentication-failed')

        await logout(session)
    })

    it(`Should give the same error for a wrong password and a non-existent user`, async function() {
        // Login should not reveal whether an account with a given email exists.
        // A wrong password and an unknown email must both fail identically.
        const user1 = userDictionary['user1']

        const wrongPasswordSession = await initialize()
        const wrongPassword = await fetchEndpoint('POST', '/authentication', {
            body: { email: user1.email, password: user1.password+'Password' },
            session: wrongPasswordSession
        })
        await logout(wrongPasswordSession)

        const unknownUserSession = await initialize()
        const unknownUser = await fetchEndpoint('POST', '/authentication', {
            body: { email: 'definitely-not-a-user@communities.social', password: 'PasswordPassword' },
            session: unknownUserSession
        })
        await logout(unknownUserSession)

        assert.equal(wrongPassword.status, unknownUser.status)
        assert.equal(wrongPassword.content?.error?.type, unknownUser.content?.error?.type)
        assert.equal(wrongPassword.content?.error?.type, 'authentication-failed')
    })

    it(`Should normalize the email before authenticating`, async function() {
        // AuthenticationController lowercases and trims the submitted email, so
        // surrounding whitespace and mixed case should still authenticate.
        const session = await initialize()

        const user1 = userDictionary['user1']

        const credentials = {
            email: `  ${user1.email.toUpperCase()}  `,
            password: user1.password
        }

        const response = await fetchEndpoint('POST', '/authentication', { body: credentials, session: session })

        if ( response.raw.headers.has('X-Communities-Auth') ) {
            session.auth = response.raw.headers.get('X-Communities-Auth')
        }

        assert.equal(response.status, 200)
        assert.equal(response.content?.session?.user?.username, user1.username)

        await logout(session)
    })

    it(`Should require a password when an email is provided`, async function() {
        // Email present, but no password key at all.
        const session = await initialize()

        const user1 = userDictionary['user1']

        const credentials = {
            email: user1.email
        }

        const response = await fetchEndpoint('POST', '/authentication', { body: credentials, session: session })

        assert.equal(response.status, 400)
        assert.equal(response.content?.error?.type, 'password-required')

        await logout(session)
    })

    it(`Should reject an empty password`, async function() {
        const session = await initialize()

        const user1 = userDictionary['user1']

        const credentials = {
            email: user1.email,
            password: ''
        }

        const response = await fetchEndpoint('POST', '/authentication', { body: credentials, session: session })

        assert.equal(response.status, 400)
        assert.equal(response.content?.error?.type, 'password-required')

        await logout(session)
    })

    it(`Should reject a whitespace-only password`, async function() {
        const session = await initialize()

        const user1 = userDictionary['user1']

        const credentials = {
            email: user1.email,
            password: '     '
        }

        const response = await fetchEndpoint('POST', '/authentication', { body: credentials, session: session })

        assert.equal(response.status, 400)
        assert.equal(response.content?.error?.type, 'password-required')

        await logout(session)
    })

    it(`Should reject an attempt with neither an email nor a token`, async function() {
        const session = await initialize()

        const response = await fetchEndpoint('POST', '/authentication', { body: {}, session: session })

        assert.equal(response.status, 403)
        assert.equal(response.content?.error?.type, 'authentication-failed')

        await logout(session)
    })

    it(`Should reject a banned user`, async function() {
        // See fixtures/users.js -> 'user2' for the required manual setup.
        const session = await initialize()

        const user2 = userDictionary['user2']

        const credentials = {
            email: user2.email,
            password: user2.password
        }

        const response = await fetchEndpoint('POST', '/authentication', { body: credentials, session: session })

        // The banned check runs before the password check and surfaces as a
        // generic authentication failure so as not to leak account state.
        assert.equal(response.status, 403)
        assert.equal(response.content?.error?.type, 'authentication-failed')

        await logout(session)
    })

    it(`Should lock the account out after too many failed attempts`, async function() {
        // After 10 failed attempts within 15 minutes, AuthenticationService
        // stops even checking the password and returns a 429 for ~15 minutes.
        //
        // This test is intentionally destructive, so it runs against its own
        // dedicated fixture (user4) -- see fixtures/users.js.  It is written to
        // be tolerant of an already-locked account so that re-running the suite
        // inside the 15 minute window still passes.
        const session = await initialize()

        const user4 = userDictionary['user4']

        const wrongCredentials = {
            email: user4.email,
            password: user4.password+'Wrong'
        }

        // 10 failures are needed to trip the lock from a cold start (the 11th
        // attempt is the one that reports the timeout); a little headroom keeps
        // this robust regardless of the starting attempt count.
        const MAX_ATTEMPTS = 12

        let lockedOut = false
        for ( let attempt = 0; attempt < MAX_ATTEMPTS; attempt++ ) {
            const response = await fetchEndpoint('POST', '/authentication', { body: wrongCredentials, session: session })

            if ( response.status === 429 ) {
                assert.equal(response.content?.error?.type, 'authentication-timeout')
                lockedOut = true
                break
            }

            // Until the account locks, a wrong password is an ordinary failure.
            assert.equal(response.status, 403)
            assert.equal(response.content?.error?.type, 'authentication-failed')
        }

        assert.ok(lockedOut, `Expected the account to be locked out within ${MAX_ATTEMPTS} attempts.`)

        // While locked out, even the *correct* password is rejected with the
        // same timeout -- the password is never checked.
        const correctCredentials = {
            email: user4.email,
            password: user4.password
        }
        const lockedResponse = await fetchEndpoint('POST', '/authentication', { body: correctCredentials, session: session })

        assert.equal(lockedResponse.status, 429)
        assert.equal(lockedResponse.content?.error?.type, 'authentication-timeout')

        await logout(session)
    })

    it(`Should return a pending session for an MFA-enabled user`, async function() {
        const session = await initialize()

        const user3 = userDictionary['user3']

        const credentials = {
            email: user3.email,
            password: user3.password
        }

        const response = await fetchEndpoint('POST', '/authentication', { body: credentials, session: session })

        if ( response.raw.headers.has('X-Communities-Auth') ) {
            session.auth = response.raw.headers.get('X-Communities-Auth')
        }

        assert.equal(response.status, 200)
        // The user is not fully logged in yet -- only a pending id is returned.
        assert.equal(response.content?.session?.user, undefined)
        assert.ok(response.content?.session?.pendingUserId)

        await logout(session)
    })

    // SKIPPED / DOCUMENTS CURRENT BEHAVIOR: When a `token` (rather than an
    // email) is supplied, the controller runs it through TokenService as an
    // 'invitation' token.  An unknown token throws a ServiceError('not-found')
    // that the controller does not map to a ControllerError, so it currently
    // surfaces as a 500 'server-error' rather than a 4xx.  This looks like a
    // bug (an invalid token from a client should probably be a 4xx); left
    // skipped so it can be triaged rather than locked in as expected behavior.
    it.skip(`Should reject an invalid invitation token`, async function() {
        const session = await initialize()

        const credentials = {
            token: 'this-is-not-a-real-token'
        }

        const response = await fetchEndpoint('POST', '/authentication', { body: credentials, session: session })

        // Current behavior is 500 'server-error'.  If/when this is fixed to a
        // 4xx, update this assertion accordingly and switch xit -> it.
        assert.equal(response.status, 500)
        assert.equal(response.content?.error?.type, 'server-error')

        await logout(session)
    })

})
