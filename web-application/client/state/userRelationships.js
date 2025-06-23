import { createSlice } from '@reduxjs/toolkit'
import * as qs from 'qs'

import { makeTrackedRequest } from '/lib/state/request'

import { setRelationsInState } from '/lib/state/relations'

import {
    setInDictionary,
    removeEntity,
    setQueryResults,
    clearQuery,
    clearQueries
} from '/lib/state'

export const userRelationshipsSlice = createSlice({
    name: 'userRelationships',
    initialState: {
        /**
         * A dictionary of userRelationships we've retrieved from the backend, keyed by
         * user.id.
         *
         * @type {object}
         */
        dictionary: {},

        /**
         *
         * An object containing queries made to query supporting endpoints.
         *
         * In this case: GET /userRelationships 
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

        byUserId: {}
        
    },
    reducers: {


        // ======== State Manipulation Helpers ================================
        // @see /lib/state.js

        setUserRelationshipsInDictionary: function(state, action) {
            setInDictionary(state, action)

            if ( 'dictionary' in action.payload ) {
                for(const [id, entity] of Object.entries(action.payload.dictionary)) {
                    if ( entity.userId in state.byUserId ) {
                        state.byUserId[entity.userId][entity.relationId] = entity.id
                    } else {
                        state.byUserId[entity.userId] = {}
                        state.byUserId[entity.userId][entity.relationId] = entity.id
                    }

                    if ( entity.relationId in state.byUserId ) {
                        state.byUserId[entity.relationId][entity.userId] = entity.id
                    } else {
                        state.byUserId[entity.relationId] = {}
                        state.byUserId[entity.relationId][entity.userId] = entity.id
                    }
                }
            } else if ( 'entity' in action.payload ) {
                const entity = action.payload.entity
                if ( entity.userId in state.byUserId ) {
                    state.byUserId[entity.userId][entity.relationId] = entity.id
                } else {
                    state.byUserId[entity.userId] = {}
                    state.byUserId[entity.userId][entity.relationId] = entity.id
                }

                if ( entity.relationId in state.byUserId ) {
                    state.byUserId[entity.relationId][entity.userId] = entity.id
                } else {
                    state.byUserId[entity.relationId] = {}
                    state.byUserId[entity.relationId][entity.userId] = entity.id
                }
            }

        },
        removeUserRelationship: function(state, action) {
            removeEntity(state, action)

            const entity = action.payload.entity
            if ( entity.userId in state.byUserId ) {
                delete state.byUserId[entity.userId][entity.relationId]
            }
            if ( entity.relationId in state.byUserId ) {
                delete state.byUserId[entity.relationId][entity.userId]
            }
        },
        setUserRelationshipQueryResults: setQueryResults,
        clearUserRelationshipQuery: clearQuery,
        clearUserRelationshipQueries: clearQueries
    }
})

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
        return dispatch(makeTrackedRequest('GET', endpoint, null,
            function(response) {
                dispatch(userRelationshipsSlice.actions.setUserRelationshipsInDictionary({ dictionary: response.dictionary }))

                dispatch(userRelationshipsSlice.actions.setUserRelationshipQueryResults({ name: name, meta: response.meta, list: response.list }))

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
        return dispatch(makeTrackedRequest('POST', `/user/${encodeURIComponent(relationship.userId)}/relationships`, relationship,
            function(response) {
                dispatch(userRelationshipsSlice.actions.setUserRelationshipsInDictionary({ entity: response.entity }))

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
        return dispatch(makeTrackedRequest('GET', `/user/${encodeURIComponent(userId)}/relationship/${encodeURIComponent(relationId)}`, null,
            function(response) {
                dispatch(userRelationshipsSlice.actions.setUserRelationshipsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
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
        return dispatch(makeTrackedRequest('PATCH', `/user/${encodeURIComponent(relationship.userId)}/relationship/${encodeURIComponent(relationship.relationId)}`, relationship,
            function(response) {
                dispatch(userRelationshipsSlice.actions.setUserRelationshipsInDictionary({ entity: response.entity }))

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
        return dispatch(makeTrackedRequest('DELETE', `/user/${encodeURIComponent(relationship.userId)}/relationship/${encodeURIComponent(relationship.relationId)}`, null,
            function(response) {
                dispatch(userRelationshipsSlice.actions.removeUserRelationship({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
} 


export const { 
    setUserRelationshipsInDictionary, removeUserRelationship, 
    setUserRelationshipQueryResults, clearUserRelationshipQuery
}  = userRelationshipsSlice.actions

export default userRelationshipsSlice.reducer
