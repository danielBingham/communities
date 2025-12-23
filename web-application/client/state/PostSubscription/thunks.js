import { makeRequest } from '/state/lib/makeRequest'
import { setRelationsInState } from '/state/lib/relations'

import { 
    setPostSubscriptionsInDictionary, removePostSubscription, 
    setPostSubscriptionNull, setPostSubscriptionNullByPostId,
    clearPostSubscriptionQuery, setPostSubscriptionQueryResults,
    clearPostSubscriptionQueries
} from './slice'

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
        return dispatch(makeRequest('POST', endpoint, body,
            function(response) {
                dispatch(setPostSubscriptionsInDictionary({ entity: response.entity}))
                dispatch(setRelationsInState(response.relations))
            }
        ))
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
        return dispatch(makeRequest('GET', `/post/${encodeURIComponent(postId)}/subscription`,  null,
            function(response) {
                dispatch(setPostSubscriptionsInDictionary({ entity: response.entity}))
                dispatch(setRelationsInState(response.relations))
            }, 
            function(status, response) {
                if ( status === 404 || status === 403 ) {
                    dispatch(setPostSubscriptionNullByPostId(postId))
                }
            }
        ))
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
        return dispatch(makeRequest('DELETE', `/post/${encodeURIComponent(postId)}/subscription`, null,
            function(response) {
                dispatch(removePostSubscription({ entity: response.entity }))
                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}
