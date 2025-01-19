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
    cleanupRequest as cleanupTrackedRequest, 
} from './helpers/requestTracker'

export const postReactionsSlice = createSlice({
    name: 'postReactions',
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
         * A dictionary of postReactions we've retrieved from the backend, keyed by
         * post.id.
         *
         * @type {object}
         */
        dictionary: {},

        /**
         *
         * An object containing queries made to query supporting endpoints.
         *
         * In the case of postReactions: /postReactions, /post/:id/children, and
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

        setPostReactionsInDictionary: setInDictionary,
        removePostReaction: removeEntity,
        makePostReactionQuery: makeQuery,
        setPostReactionQueryResults: setQueryResults,
        clearPostReactionQuery: clearQuery,
        clearPostReactionQueries: clearQueries,

        // ========== Request Tracking Methods =============

        makeRequest: startRequestTracking, 
        failRequest: recordRequestFailure, 
        completeRequest: recordRequestSuccess,
        cleanupRequest: cleanupTrackedRequest
    }
})

/**
 * POST /post/:postId/reaction
 *
 * Add a reaction to a post. 
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} post - A populated post object, minus the `id` member.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postPostReaction = function(reaction) {
    return function(dispatch, getState) {
        const endpoint = `/post/${reaction.postId}/reactions`
        const body = reaction
        return makeTrackedRequest(dispatch, getState, postReactionsSlice,
            'POST', endpoint, body,
            function(response) {
                dispatch(postReactionsSlice.actions.setPostReactionsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * PATCH /post/:postId/reaction
 *
 * Update a post reaction from a partial `reaction` object. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} reaction - A populated reaction object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchPostReaction = function(reaction) {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, postReactionsSlice,
            'PATCH', `/post/${reaction.postId}/reaction`, reaction,
            function(response) {
                dispatch(postReactionsSlice.actions.setPostReactionsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * DELETE /post/:postId/reaction
 *
 * Delete a post reaction. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} reaction - A populated reaction object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const deletePostReaction = function(reaction) {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, postReactionsSlice,
            'DELETE', `/post/${reaction.postId}/reaction`, null,
            function(response) {
                dispatch(postReactionsSlice.actions.removePostReaction({ entity: reaction }))
                dispatch(setRelationsInState(response.relations))
            }
        )
    }
} 


export const { 
    setPostReactionsInDictionary, removePostReaction, 
    makePostReactionQuery, clearPostReactionQuery, setPostReactionQueryResults,
    cleanupRequest 
}  = postReactionsSlice.actions

export default postReactionsSlice.reducer
