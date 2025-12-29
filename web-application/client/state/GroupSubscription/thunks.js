import { makeRequest } from '/state/lib/makeRequest'
import { setRelationsInState } from '/state/lib/relations'

import { 
    setGroupSubscriptionsInDictionary, removeGroupSubscription, 
    clearGroupSubscriptionQuery, setGroupSubscriptionQueryResults,
    clearGroupSubscriptionQueries
} from './slice'

/**
 * GET /group/:groupId/subscription
 *
 * Update a group subscription from a partial `subscription` object. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} subscription - A populated subscription object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getGroupSubscription = function(groupId) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('GET', `/group/${encodeURIComponent(groupId)}/subscription`,  null,
            function(response) {
                dispatch(setGroupSubscriptionsInDictionary({ entity: response.entity}))
                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}

/**
 * PATCH /group/:groupId/subscription
 *
 * Update a group subscription from a partial `subscription` object. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} subscription - A populated subscription object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchGroupSubscription = function(subscription) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('PATCH', `/group/${encodeURIComponent(subscription.groupId)}/subscription`, subscription,
            function(response) {
                dispatch(setGroupSubscriptionsInDictionary({ entity: response.entity}))
                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}
