import * as qs from 'qs'

import { makeRequest } from '/state/lib/makeRequest'
import { setRelationsInState } from '/state/lib/relations'

import { setPostsInDictionary, removePost, setPostQueryResults, clearPostQuery, clearPostQueries } from './slice'

/**
 * Cleanup a query and all entities that are only in use by that query.
 * Entities in use by other queries will be left.
 *
 * @param {string} key The name of the query we want to cleanup.
 *
 * @return {void} 
 */
export const cleanupPostQuery = function(key) {
    return function(dispatch, getState) {
        const state = getState().posts

        if ( key in state.queries ) {
            const query = state.queries[key]
            for(const id of query.list) {
                if ( isQueryUsing(state.queries, id, key) ) {
                    continue
                }

                const entity = id in state.dictionary ? state.dictionary[id] : null
                if ( entity !== null ) {
                    dispatch(removePost({ entity: entity }))
                }
            }

            dispatch(clearPostQuery({ name: key }))
        }
    }
}


/**
 * GET /posts or GET /posts?...
 *
 * Get all posts in the database.  Populates state.dictionary and state.list.
 * Can be used to run queries.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getPosts = function(name, params) {
    return function(dispatch, getState) {
        const endpoint = `/posts${( params ? '?' + qs.stringify(params) : '')}`
        return dispatch(makeRequest('GET', endpoint, null,
            function(response) {
                dispatch(setPostsInDictionary({ dictionary: response.dictionary}))

                dispatch(setPostQueryResults({ name: name, meta: response.meta, list: response.list }))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}

/**
 * POST /posts
 *
 * Create a new post.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} post - A populated post object, minus the `id` member.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postPosts = function(post) {
    return function(dispatch, getState) {
        const endpoint = '/posts'
        const body = post
        return dispatch(makeRequest('POST', endpoint, body,
            function(response) {
                dispatch(setPostsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
                dispatch(clearPostQueries())
            }
        ))
    }
}


/**
 * GET /post/:id
 *
 * Get a single post.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {int} id - The id of the post we want to retrieve.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getPost = function(id) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('GET', `/post/${encodeURIComponent(id)}`, null,
            function(response) {
                dispatch(setPostsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}

/**
 * PATCH /post/:id
 *
 * Update a post from a partial `post` object. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} post - A populate post object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchPost = function(post) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('PATCH', `/post/${encodeURIComponent(post.id)}`, post,
            function(response) {
                dispatch(setPostsInDictionary({ entity: response.entity}))
                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}

/**
 * DELETE /post/:id
 *
 * Delete a post. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} post - A populated post object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const deletePost = function(post) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('DELETE', `/post/${encodeURIComponent(post.id)}`, null,
            function(response) {
                dispatch(removePost({ entity: post}))
                dispatch(clearPostQueries())
            }
        ))
    }
} 
