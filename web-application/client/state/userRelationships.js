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
    useRequest,
    bustRequestCache,
    cleanupRequest as cleanupTrackedRequest, 
    garbageCollectRequests as garbageCollectTrackedRequests } from './helpers/requestTracker'

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

        byUserId: {},

        byFriendId: {}
    },
    reducers: {


        // ======== State Manipulation Helpers ================================
        // @see ./helpers/state.js

        setUserRelationshipsInDictionary: function(state, action) {
            setInDictionary(state, action) 

            if ( 'dictionary' in action.payload) {
                for( const [id, entity] of Object.entries(action.payload.dictionary)) {
                    state.byUserId[entity.userId] = entity
                    state.byFriendId[entity.friendId] = entity
                }
            } else if ( 'entity' in action.payload ) {
                state.byUserId[action.payload.entity.userId] = action.payload.entity
                state.byFriendId[action.payload.entity.friendId] = action.payload.entity
            }
        },
        removeUserRelationship: function(state, action) {
            removeEntity(state, action)

            if ( action.payload.entity.userId in state.byUserId ) {
                delete state.byUserId[action.payload.entity.userId]
            } 
            if ( action.payload.entity.friendId in state.byFriendId ) {
                delete state.byFriendId[action.payload.entity.friendId]
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
        useRequest: useRequest,
        bustRequestCache: bustRequestCache,
        cleanupRequest: cleanupTrackedRequest, 
        garbageCollectRequests: garbageCollectTrackedRequests
    }
})

/**
 * POST /user/:userId/friends
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
export const postFriends = function(relationship) {
    return function(dispatch, getState) {
        dispatch(userRelationshipsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, userRelationshipsSlice,
            'POST', `/user/${relationship.userId}/friends`, relationship,
            function(response) {
                dispatch(userRelationshipsSlice.actions.setUserRelationshipsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * PATCH /user/:userId/friend/:friendId
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
export const patchFriend = function(relationship) {
    return function(dispatch, getState) {
        dispatch(userRelationshipsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, userRelationshipsSlice,
            'PATCH', `/user/${relationship.userId}/friend/${relationship.friendId}`, relationship,
            function(response) {
                dispatch(userRelationshipsSlice.actions.setUserRelationshipsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))

            }
        )
    }
}

/**
 * DELETE /user/:userId/friend/:friendId
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
export const deleteFriend = function(relationship) {
    return function(dispatch, getState) {
        dispatch(userRelationshipsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, userRelationshipsSlice,
            'DELETE', `/user/${relationship.userId}/friend/${relationship.friendId}`, null,
            function(response) {
                dispatch(userRelationshipsSlice.actions.setUserRelationshipsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
} 


export const { 
    setUsersInDictionary, removeUser, 
    makeUserQuery, setUserQueryResults, clearUserQuery,
    cleanupRequest 
}  = userRelationshipsSlice.actions

export default userRelationshipsSlice.reducer
