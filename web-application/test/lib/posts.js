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

const getPost = async function(session, postId) {
    return await fetchEndpoint('GET', `/post/${encodeURIComponent(postId)}`, { session: session })
}

// Send a PATCH to /post/:id and return the raw response (without throwing on
// non-2xx) so callers can assert on the status.  `body` should be a partial
// Post entity and MUST include an `id` matching `postId` -- the controller
// rejects a patch whose body id doesn't match the existing post.
const patchPost = async function(session, postId, body) {
    return await fetchEndpoint('PATCH', `/post/${encodeURIComponent(postId)}`, { session: session, body: body })
}

// Create a feed post for the currently authenticated user and return the
// created entity.  `overrides` may set any of the post submission fields; by
// default this creates a private feed post owned by `userId`.
const createPost = async function(session, userId, overrides = {}) {
    const submission = {
        type: 'feed',
        visibility: 'private',
        userId: userId,
        groupId: null,
        files: [],
        linkPreviewId: null,
        sharedPostId: null,
        content: 'This is a test post.',
        ...overrides
    }

    const response = await fetchEndpoint('POST', '/posts', { session: session, body: submission })
    if ( ! response.ok ) {
        throw new Error(`Failed to create post: ${response.status} ${JSON.stringify(response.content)}`)
    }

    return response.content.entity
}

// Create a post in a group for the currently authenticated user and return the
// created entity.  The post's visibility is defaulted to match what the group
// type requires ('public' for open groups, 'private' otherwise) unless
// overridden.  `groupType` is only used to pick a sensible default visibility.
const createGroupPost = async function(session, userId, groupId, groupType = 'open', overrides = {}) {
    const submission = {
        type: 'group',
        visibility: groupType === 'open' ? 'public' : 'private',
        userId: userId,
        groupId: groupId,
        files: [],
        linkPreviewId: null,
        sharedPostId: null,
        content: 'This is a test group post.',
        ...overrides
    }

    const response = await fetchEndpoint('POST', '/posts', { session: session, body: submission })
    if ( ! response.ok ) {
        throw new Error(`Failed to create group post: ${response.status} ${JSON.stringify(response.content)}`)
    }

    return response.content.entity
}

// Delete a single post by id.
const deletePost = async function(session, postId) {
    const response = await fetchEndpoint('DELETE', `/post/${encodeURIComponent(postId)}`, { session: session })
    if ( ! response.ok ) {
        throw new Error(`Failed to delete Post(${postId}): ${response.status}`)
    }
    return response.content
}

// Delete all posts belonging to a test user so that we can run a fresh test
// with a clean slate. Must have already acquired a session for the test user.
const deleteAllPostsForUser = async function(session, userId) {

    let page = 1
    let numberOfPages = 1

    while( page <= numberOfPages ) {
        const response = await fetchEndpoint('GET', `/posts?userId=${encodeURIComponent(userId)}&page=${page}`, { session: session })

        if ( response.content.meta.numberOfPages !== numberOfPages ) {
            numberOfPages = response.content.meta.numberOfPages
        }

        for(const postId of response.content.list ) {
            const post = response.content.dictionary[postId]
            if ( post.userId !== userId) {
                throw new Error('GET /posts?userId= returned a post not beloning to user!')
            }

            const deleteResponse = await fetchEndpoint('DELETE', `/post/${encodeURIComponent(postId)}`, { session: session })
        }

        page = page + 1
    }
}

module.exports = {
    getPost: getPost,
    patchPost: patchPost,
    createPost: createPost,
    createGroupPost: createGroupPost,
    deletePost: deletePost,
    deleteAllPostsForUser: deleteAllPostsForUser
}
