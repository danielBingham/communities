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

export const postSubscriptionsSlice = createSlice({
    name: 'postSubscriptions',
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
         * A dictionary of postSubscriptions we've retrieved from the backend, keyed by
         * postSubscription.id.
         *
         * @type {object}
         */
        dictionary: {},

        /**
         *
         * An object containing queries made to query supporting endpoints.
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

        byPostId: {}

    },
    reducers: {
        // ======== State Manipulation Helpers ================================
        // @see ./helpers/state.js

        setPostSubscriptionsInDictionary: function(state, action) {
            setInDictionary(state, action)

            if ( 'dictionary' in action.payload ) {
                for(const [id, entity] of Object.entries(action.payload.dictionary)) {
                    state.byPostId[entity.postId] = entity
                }
            } else if ( 'entity' in action.payload ) {
                const entity = action.payload.entity
                state.byPostId[entity.postId] = entity
            }
        },
        removePostSubscription: function(state, action) {
            removeEntity(state, action)

            const entity = action.payload.entity
            delete state.byPostId[entity.postId]
        },
        makePostSubscriptionQuery: makeQuery,
        setPostSubscriptionQueryResults: setQueryResults,
        clearPostSubscriptionQuery: clearQuery,
        clearPostSubscriptionQueries: clearQueries,

        // ========== Request Tracking Methods =============

        makeRequest: startRequestTracking, 
        failRequest: recordRequestFailure, 
        completeRequest: recordRequestSuccess,
        cleanupRequest: cleanupTrackedRequest
    }
})

/**
 * POST /post/:postId/subscription
 *
 * Add a subscription to a post. 
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} post - A populated post object, minus the `id` member.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postPostSubscriptions = function(subscription) {
    return function(dispatch, getState) {
        const endpoint = `/post/${encodeURIComponent(subscription.postId)}/subscriptions`
        const body = subscription
        return makeTrackedRequest(dispatch, getState, postSubscriptionsSlice,
            'POST', endpoint, body,
            function(response) {
                dispatch(postSubscriptionsSlice.actions.setPostSubscriptionsInDictionary({ entity: response.entity}))
                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * GET /post/:postId/subscription
 *
 * Update a post subscription from a partial `subscription` object. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} subscription - A populated subscription object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getPostSubscription = function(postId) {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, postSubscriptionsSlice,
            'GET', `/post/${encodeURIComponent(postId)}/subscription`,  null,
            function(response) {
                dispatch(postSubscriptionsSlice.actions.setPostSubscriptionsInDictionary({ entity: response.entity}))
                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * DELETE /post/:postId/subscription
 *
 * Delete a post subscription. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} subscription - A populated subscription object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const deletePostSubscription = function(postId) {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, postSubscriptionsSlice,
            'DELETE', `/post/${encodeURIComponent(postId)}/subscription`, null,
            function(response) {
                dispatch(postSubscriptionsSlice.actions.removePostSubscription({ entity: response.entity }))
                dispatch(setRelationsInState(response.relations))
            }
        )
    }
} 


export const { 
    setPostSubscriptionsInDictionary, removePostSubscription, 
    makePostSubscriptionQuery, clearPostSubscriptionQuery, setPostSubscriptionQueryResults,
    cleanupRequest 
}  = postSubscriptionsSlice.actions

export default postSubscriptionsSlice.reducer
