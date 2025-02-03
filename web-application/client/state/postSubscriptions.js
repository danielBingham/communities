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

export const postSubscriptionsSlice = createSlice({
    name: 'postSubscriptions',
    initialState: {
        
        // ======== Standard State ============================================

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
        // @see ./lib/state.js

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
        return makeTrackedRequest('POST', endpoint, body,
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
        return makeTrackedRequest('GET', `/post/${encodeURIComponent(postId)}/subscription`,  null,
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
        return makeTrackedRequest('DELETE', `/post/${encodeURIComponent(postId)}/subscription`, null,
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
}  = postSubscriptionsSlice.actions

export default postSubscriptionsSlice.reducer
