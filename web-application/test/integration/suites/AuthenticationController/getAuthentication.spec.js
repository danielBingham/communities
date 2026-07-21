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
const { describe, it} = require('node:test')
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
})
