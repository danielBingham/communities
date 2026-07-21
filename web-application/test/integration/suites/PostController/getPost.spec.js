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
const { deleteAllPostsForUser } = require('../../lib/posts')

const userDictionary = require('../../fixtures/users')

describe('GET /post/:id', function() {

    it(`Should return the requested post`, async function() {
        const session = await initialize()

        const user1 = userDictionary['user1']

        const credentials = {
            email: user1.email,
            password: user1.password
        }

        const currentUser = await login(credentials, session)

        // Clear out User1's posts before running out test.
        await deleteAllPostsForUser(session, currentUser.id)

        // Create the post we're going to test.

        const postSubmission = {
            type: 'feed',
            visibility: 'private',
            userId: currentUser.id,
            files: [],
            linkPreviewId: null,
            sharedPostId: null,
            content: 'This is a test post.'
        }
        const createResponse = await fetchEndpoint('POST', '/posts', { session: session, body: postSubmission })

        if ( ! createResponse.ok ) {
            assert.fail('Failed to create post under test.')
        }

        const createdPost = createResponse.content.entity
        assert.equal(postSubmission.type, createdPost.type)
        assert.equal(postSubmission.visibility, createdPost.visibility)
        assert.equal(postSubmission.userId, createdPost.userId)
        assert.deepEqual(postSubmission.files, createdPost.files)
        assert.equal(postSubmission.linkPreviewId, createdPost.linkPreviewId)
        assert.equal(postSubmission.sharedPostId, createdPost.sharedPostId)
        assert.equal(postSubmission.content, createdPost.content)

        const response = await fetchEndpoint('GET', `/post/${encodeURIComponent(createResponse.content.entity.id)}`, { session: session })

        if ( ! response.ok ) {
            assert.fail('Failed to retreive the post under test.')
        }

        const post = response.content.entity

        assert.equal(createdPost.id, post.id)
        assert.equal(postSubmission.type, post.type)
        assert.equal(postSubmission.visibility, post.visibility)
        assert.equal(postSubmission.userId, post.userId)
        assert.deepEqual(postSubmission.files, post.files)
        assert.equal(postSubmission.linkPreviewId, post.linkPreviewId)
        assert.equal(postSubmission.sharedPostId, post.sharedPostId)
        assert.equal(postSubmission.content, post.content)

        // Clear out User1's posts before running out test.
        await deleteAllPostsForUser(session, currentUser.id)

        await logout(session)

    })

})
