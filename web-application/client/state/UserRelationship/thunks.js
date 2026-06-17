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
import * as qs from 'qs'

import { makeRequest } from '/state/lib/makeRequest'
import { setRelationsInState } from '/state/lib/relations'
import { resetEntities } from '/state/lib'

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
                // When a relationship is created we need to reset and requery
                // entities.
                dispatch(resetEntities())
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
                // When a relationship is patched we need to reset and requery
                // entities.
                dispatch(resetEntities())

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
                // When a relationship is deleted we need to reset and requery
                // entities.
                dispatch(resetEntities())
            } 
        ))
    }
} 
