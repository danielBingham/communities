import * as qs from 'qs'

import { makeRequest } from '/state/lib/makeRequest'
import { setRelationsInState } from '/state/lib/relations'

import {
    setUserRelationshipsInDictionary, setUserRelationshipNull, removeUserRelationship, 
    setUserRelationshipQueryResults, clearUserRelationshipQuery,
    clearUserRelationshipQueries
} from './slice'

/**
 * GET /user/:userId/relatinships?...
 *
 * Get all user relationships in the database. Queryable.   
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getUserRelationships = function(name, userId, params) {
    return function(dispatch, getState) {
        const endpoint = `/user/${encodeURIComponent(userId)}/relationships${( params ? '?' + qs.stringify(params) : '')}`
        return dispatch(makeRequest('GET', endpoint, null,
            function(response) {
                dispatch(setUserRelationshipsInDictionary({ dictionary: response.dictionary }))

                dispatch(setUserRelationshipQueryResults({ name: name, meta: response.meta, list: response.list }))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}

/**
 * POST /user/:userId/relationships
 *
 * Create a new friend request.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} user - A populated user object, minus the `id` member.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postUserRelationships = function(relationship) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('POST', `/user/${encodeURIComponent(relationship.userId)}/relationships`, relationship,
            function(response) {
                dispatch(setUserRelationshipsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}

/**
 * GET /user/:userId/relationship/:relationId
 *
 * Get a single relationship between User(:userId) and User(:relationId).
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {uuid} userId - The id of the requesting user.
 * @param {uuid} relationId - The id of the user on the other side of the relationship.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getUserRelationship = function(userId, relationId) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('GET', `/user/${encodeURIComponent(userId)}/relationship/${encodeURIComponent(relationId)}`, null,
            function(response) {
                dispatch(setUserRelationshipsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            },
            function(status, response) {
                if ( status === 404 || status === 403 ) {
                    dispatch(setUserRelationshipNull({ userId: userId, relationId: relationId }))
                }
            }
        ))
    }
}

/**
 * PATCH /user/:userId/friend/:relationId
 *
 * Update a friend relationship.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} user - A populate user object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchUserRelationship = function(relationship) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('PATCH', `/user/${encodeURIComponent(relationship.userId)}/relationship/${encodeURIComponent(relationship.relationId)}`, relationship,
            function(response) {
                dispatch(setUserRelationshipsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))

            }
        ))
    }
}

/**
 * DELETE /user/:userId/friend/:relationId
 *
 * Delete a friend. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} user - A populated user object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const deleteUserRelationship = function(relationship) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('DELETE', `/user/${encodeURIComponent(relationship.userId)}/relationship/${encodeURIComponent(relationship.relationId)}`, null,
            function(response) {
                dispatch(removeUserRelationship({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            } 
        ))
    }
} 
