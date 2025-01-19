import { createSlice, current } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

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

export const userRelationshipsSlice = createSlice({
    name: 'userRelationships',
    initialState: {
        /**
         * A dictionary of requests in progress or that we've made and completed,
         * keyed with a uuid requestId.
         *
         * @type {object}
         */
        requests: {},

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
        // @see ./helpers/state.js

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
        makeUserRelationshipQuery: makeQuery,
        setUserRelationshipQueryResults: setQueryResults,
        clearUserRelationshipQuery: clearQuery,
        clearUserRelationshipQueries: clearQueries,

        // ========== Request Tracking Methods =============

        makeRequest: startRequestTracking, 
        failRequest: recordRequestFailure, 
        completeRequest: recordRequestSuccess,
        cleanupRequest: cleanupTrackedRequest 
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
        const queryString = makeSearchParams(params)
        const endpoint = `/user/${encodeURIComponent(userId)}/relationships` + ( params ? '?' + queryString.toString() : '')

        dispatch(userRelationshipsSlice.actions.makeUserRelationshipQuery({ name: name }))

        return makeTrackedRequest(dispatch, getState, userRelationshipsSlice,
            'GET', endpoint, null,
            function(response) {
                dispatch(userRelationshipsSlice.actions.setUserRelationshipsInDictionary({ dictionary: response.dictionary }))

                dispatch(userRelationshipsSlice.actions.setUserRelationshipQueryResults({ name: name, meta: response.meta, list: response.list }))

                dispatch(setRelationsInState(response.relations))
            }
        )
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
        return makeTrackedRequest(dispatch, getState, userRelationshipsSlice,
            'POST', `/user/${encodeURIComponent(relationship.userId)}/relationships`, relationship,
            function(response) {
                dispatch(userRelationshipsSlice.actions.setUserRelationshipsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
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
        return makeTrackedRequest(dispatch, getState, userRelationshipsSlice,
            'GET', `/user/${encodeURIComponent(userId)}/relationship/${encodeURIComponent(relationId)}`, null,
            function(response) {
                dispatch(userRelationshipsSlice.actions.setUserRelationshipsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
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
        return makeTrackedRequest(dispatch, getState, userRelationshipsSlice,
            'PATCH', `/user/${relationship.userId}/relationship/${relationship.relationId}`, relationship,
            function(response) {
                dispatch(userRelationshipsSlice.actions.setUserRelationshipsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))

            }
        )
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
        return makeTrackedRequest(dispatch, getState, userRelationshipsSlice,
            'DELETE', `/user/${relationship.userId}/relationship/${relationship.relationId}`, null,
            function(response) {
                dispatch(userRelationshipsSlice.actions.removeUserRelationship({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
} 


export const { 
    setUserRelationshipsInDictionary, removeUserRelationship, 
    makeUserRelationshipQuery, setUserRelationshipQueryResults, clearUserRelationshipQuery,
    cleanupRequest 
}  = userRelationshipsSlice.actions

export default userRelationshipsSlice.reducer
