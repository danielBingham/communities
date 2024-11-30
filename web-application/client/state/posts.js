import { createSlice } from '@reduxjs/toolkit'

import setRelationsInState from './helpers/relations'

import {
    setInDictionary,
    removeEntity,
    makeQuery,
    setQueryResults,
    clearQuery,
    clearQueries
} from './helpers/state'

import { 
    makeSearchParams,
    makeTrackedRequest,
    startRequestTracking, 
    recordRequestFailure, 
    recordRequestSuccess, 
    useRequest,
    bustRequestCache,
    cleanupRequest as cleanupTrackedRequest, 
    garbageCollectRequests as garbageCollectTrackedRequests } from './helpers/requestTracker'

export const postsSlice = createSlice({
    name: 'posts',
    initialState: {
        
        // ======== Standard State ============================================
        
        /**
         * A dictionary of requests in progress or that we've made and completed,
         * keyed with a uuid requestId.
         *
         * @type {object}
         */
        requests: {},

        /**
         * A dictionary of posts we've retrieved from the backend, keyed by
         * post.id.
         *
         * @type {object}
         */
        dictionary: {},

        /**
         *
         * An object containing queries made to query supporting endpoints.
         *
         * In the case of posts: /posts, /post/:id/children, and
         * /post/:id/parents
         *
         * Structure:
         * {
         *  queryName: {
         *      meta: {
         *          page: <int>,
         *          count: <int>,
         *          pageSize: <int>,
         *          numberOfPages: <int>
         *      },
         *      list: [] 
         *  },
         *  ...
         * }
         */
        queries: {}

    },
    reducers: {
        // ======== State Manipulation Helpers ================================
        // @see ./helpers/state.js

        setPostsInDictionary: setInDictionary,
        removePost: removeEntity,
        makePostQuery: makeQuery,
        setPostQueryResults: setQueryResults,
        clearPostQuery: clearQuery,
        clearPostQueries: clearQueries,

        // ========== Request Tracking Methods =============

        makeRequest: startRequestTracking, 
        failRequest: recordRequestFailure, 
        completeRequest: recordRequestSuccess,
        useRequest: useRequest,
        bustRequestCache: bustRequestCache,
        cleanupRequest: cleanupTrackedRequest, 
        garbageCollectRequests: garbageCollectTrackedRequests
    }
})


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
        const queryString = makeSearchParams(params)
        const endpoint = '/posts' + ( params ? '?' + queryString.toString() : '')

        dispatch(postsSlice.actions.makePostQuery({ name: name }))

        return makeTrackedRequest(dispatch, getState, postsSlice,
            'GET', endpoint, null,
            function(response) {
                dispatch(postsSlice.actions.setPostsInDictionary({ dictionary: response.dictionary}))

                dispatch(postsSlice.actions.setPostQueryResults({ name: name, meta: response.meta, list: response.list }))

                dispatch(setRelationsInState(response.relations))
            }
        )
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
        dispatch(postsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, postsSlice,
            'POST', endpoint, body,
            function(response) {
                dispatch(postsSlice.actions.setPostsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        )
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
        return makeTrackedRequest(dispatch, getState, postsSlice,
            'GET', `/post/${id}`, null,
            function(response) {
                dispatch(postsSlice.actions.setPostsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        )
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
        dispatch(postsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, postsSlice,
            'PATCH', `/post/${post.id}`, post,
            function(response) {
                dispatch(postsSlice.actions.setPostsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        )
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
        dispatch(postsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, postsSlice,
            'DELETE', `/post/${post.id}`, null,
            function(response) {
                dispatch(postsSlice.actions.setPostsInDictionary({ entity: response.entity}))
            }
        )
    }
} 


export const { 
    setPostsInDictionary, removePost, 
    makePostQuery, clearPostQuery, setPostQueryResults,
    cleanupRequest 
}  = postsSlice.actions

export default postsSlice.reducer
