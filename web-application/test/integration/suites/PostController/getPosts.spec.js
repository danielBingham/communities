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
const { deleteAllPostsForUser } = require('../../lib/posts')

const userDictionary = require('../../fixtures/users')

describe('GET /posts', function() {

    it(`Should return a list of all public posts for a user with no posts`, async function() {
        const session = await initialize()

        const user1 = userDictionary['user1']

        const credentials = {
            email: user1.email,
            password: user1.password
        }

        const currentUser = await login(credentials, session)

        // Clear out User1's posts before running out test.
        await deleteAllPostsForUser(session, currentUser.id)

        let page = 1
        let numberOfPages = 1
        let count = 0
        let metaCount = 0


        while ( page <= numberOfPages ) {
            const response = await fetchEndpoint('GET', `/posts?page=${page}`, { session: session })
            const content = response.content

            if ( content.meta.numberOfPages !== numberOfPages ) {
                numberOfPages = content.meta.numberOfPages
            }

            if ( content.meta.count !== metaCount ) {
                metaCount = parseInt(content.meta.count, 10)
            }

            for(const postId of content.list) {
                const post = content.dictionary[postId]
                if ( post.visibility !== 'public' ) {
                    assert.fail('Non-public post returned!')
                }
                count = count + 1
            }


            page = page + 1
        }

        assert.equal(count, metaCount)

        await logout(session)

    })

})
