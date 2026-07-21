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
const { describe, it, xit, before, after } = require('node:test')
const assert = require('node:assert/strict')

const { initialize, login, logout } = require('../../lib/authentication')
const { fetchEndpoint } = require('../../lib/fetchEndpoint')

describe(`POST /authentication`, function() {
    it('Should allow a user to log in', async function() {
        const session = await initialize()

        const credentials = {
            email: 'communities-john-doe@mailinator.com',
            password: 'PasswordPass'
        }

        const response = await fetchEndpoint('POST', '/authentication', { body: credentials, session: session })

        // We're not using `login()` here, so we need to do this manually.
        if ( response.raw.headers.has('X-Communities-Auth') ) {
            session.auth = response.raw.headers.get('X-Communities-Auth')
        }


        assert.equal(response.status, 200)
        assert.equal(response.content?.session?.user?.username, 'john-doe')

        await logout(session)
    })

    it('Should reject a user with invalid credentials', async function() {
        const session = await initialize()

        const credentials = {
            email: 'communities-john-doe@mailinator.com',
            password: 'PasswordPassword'
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

})
