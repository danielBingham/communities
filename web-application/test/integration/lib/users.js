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

// Fetch a single user by id and return the raw fetchEndpoint result
// ({ status, ok, content, raw }).  Mirrors lib/groups.getGroup and
// lib/posts.getPost -- it does not throw on non-2xx so callers (e.g. the
// permission tests) can assert on the status and error body of a denied read.
const getUser = async function(session, userId) {
    return await fetchEndpoint('GET', `/user/${encodeURIComponent(userId)}`, { session: session })
}

// Resolve a fixture user's runtime id from their username.
//
// Most fixtures hand back their id from loginAs().  Two cannot: a BANNED user
// is rejected by AuthenticationService, and an INVITED user has no password
// set yet.  Neither can they be found through a plain GET /users -- for any
// caller who does not pass `admin=true`, UserController.parseQuery() appends
// `users.status != 'banned' AND users.status != 'invited'`.
//
// Passing `admin=true` skips that status filter, but the endpoint only honors
// it for siteRole 'admin' or 'superadmin' (a 'moderator' gets a 403), so
// `adminSession` MUST belong to the 'user-site-admin' fixture.
//
// NOTE: this cannot find a user whose profile has a *rejected* SiteModeration.
// The `feat-408-flag-profiles-and-groups` clause in parseQuery() filters those
// out for every caller, admins included.  Those fixtures can authenticate, so
// use loginAs() for them instead.
const findUserIdByUsernameAsAdmin = async function(adminSession, username) {
    const response = await fetchEndpoint('GET', `/users?admin=true&username=${encodeURIComponent(username)}`, { session: adminSession })

    if ( ! response.ok ) {
        throw new Error(`Failed to look up User(${username}): ${response.status} ${JSON.stringify(response.content)}`)
    }

    if ( response.content.list.length !== 1 ) {
        throw new Error(`Expected exactly one user for username '${username}', got ${response.content.list.length}.  Check the fixture's manual setup in fixtures/users.js.`)
    }

    return response.content.list[0]
}

module.exports = {
    getUser: getUser,
    findUserIdByUsernameAsAdmin: findUserIdByUsernameAsAdmin
}
