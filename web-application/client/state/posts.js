import { createSlice } from '@reduxjs/toolkit'
import * as qs from 'qs'

import { makeTrackedRequest } from '/state/requests'
import setRelationsInState from '/lib/state/relations'

import {
    setInDictionary,
    removeEntity,
    makeQuery,
    setQueryResults,
    clearQuery,
    clearQueries
} from '/lib/state'

export const postsSlice = createSlice({
    name: 'posts',
    initialState: {
        
        // ======== Standard State ============================================

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
        queries: {},

        /**
         * Posts which are currently being edited.
         *
         * {
         *   [ postId ]: boolean
         * }
         *   
         **/
        editing: {},

        drafts: {}
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

        clearInProgress: function(state, action) {
            state.inProgress = null
        },

        startPostEdit: function(state, action) {
            const postId = action.payload
            state.editing[postId] = true
        },

        finishPostEdit: function(state, action) {
            const postId = action.payload
            delete state.editing[postId]
        },

        setDraft: function(state, action) {
            state.drafts[action.payload.id] = action.payload.draft
        },

        clearDraft: function(state, action) {
            delete state.drafts[action.payload.id]
        }
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
        const endpoint = `/posts${( params ? '?' + qs.stringify(params) : '')}`
        dispatch(postsSlice.actions.makePostQuery({ name: name }))
        return dispatch(makeTrackedRequest('GET', endpoint, null,
            function(response) {
                dispatch(postsSlice.actions.setPostsInDictionary({ dictionary: response.dictionary}))

                dispatch(postsSlice.actions.setPostQueryResults({ name: name, meta: response.meta, list: response.list }))

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
        return dispatch(makeTrackedRequest('POST', endpoint, body,
            function(response) {
                dispatch(postsSlice.actions.setPostsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
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
        return dispatch(makeTrackedRequest('GET', `/post/${encodeURIComponent(id)}`, null,
            function(response) {
                dispatch(postsSlice.actions.setPostsInDictionary({ entity: response.entity}))

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
        return dispatch(makeTrackedRequest('PATCH', `/post/${encodeURIComponent(post.id)}`, post,
            function(response) {
                dispatch(postsSlice.actions.setPostsInDictionary({ entity: response.entity}))
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
        return dispatch(makeTrackedRequest('DELETE', `/post/${encodeURIComponent(post.id)}`, null,
            function(response) {
                dispatch(postsSlice.actions.removePost({ entity: post}))
            }
        ))
    }
} 


export const { 
    setPostsInDictionary, removePost, 
    makePostQuery, clearPostQuery, setPostQueryResults,
    startPostEdit, finishPostEdit,
    setDraft, clearDraft
}  = postsSlice.actions

export default postsSlice.reducer
