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

export const groupMembersSlice = createSlice({
    name: 'groupMembers',
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
         * A dictionary of groupMembers we've retrieved from the backend, keyed by
         * group.id.
         *
         * @type {object}
         */
        dictionary: {},

        /**
         *
         * An object containing queries made to query supporting endpoints.
         *
         * In the case of groupMembers: /groupMembers, /group/:id/children, and
         * /group/:id/parents
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

        setGroupMembersInDictionary: setInDictionary,
        removeGroupMember: removeEntity,
        makeGroupMemberQuery: makeQuery,
        setGroupMemberQueryResults: setQueryResults,
        clearGroupMemberQuery: clearQuery,
        clearGroupMemberQueries: clearQueries,

        // ========== Request Tracking Methods =============

        makeRequest: startRequestTracking, 
        failRequest: recordRequestFailure, 
        completeRequest: recordRequestSuccess,
        cleanupRequest: cleanupTrackedRequest
    }
})

/**
 * GET /group/:groupId/members or GET /group/:groupId/members?...
 *
 * Get all groupMembers in the database.  Populates state.dictionary and state.list.
 * Can be used to run queries.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getGroupMembers = function(groupId, name, params) {
    return function(dispatch, getState) {
        const queryString = makeSearchParams(params)
        const endpoint = `/group/${encodeURIComponent(groupId)}/members` + ( params ? '?' + queryString.toString() : '')

        dispatch(groupMembersSlice.actions.makeGroupQuery({ name: name }))

        return makeTrackedRequest(dispatch, getState, groupMembersSlice,
            'GET', endpoint, null,
            function(response) {
                dispatch(groupMembersSlice.actions.setGroupMembersInDictionary({ dictionary: response.dictionary}))

                dispatch(groupMembersSlice.actions.setGroupMemberQueryResults({ name: name, meta: response.meta, list: response.list }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * POST /group/:groupId/member
 *
 * Add a member to a group. 
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} group - A populated group object, minus the `id` member.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postGroupMembers = function(member) {
    return function(dispatch, getState) {
        const endpoint = `/group/${encodeURIComponent(member.groupId)}/members`
        const body = member
        return makeTrackedRequest(dispatch, getState, groupMembersSlice,
            'POST', endpoint, body,
            function(response) {
                dispatch(groupMembersSlice.actions.setGroupMembersInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * GET /group/:groupId/member/:userId
 *
 * Get a single group.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {int} id - The id of the group we want to retrieve.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getGroupMember = function(groupId, userId) {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, groupMembersSlice,
            'GET', `/group/${encodeURIComponent(groupId)}/member/${encodeURIComponent(userId)}`, null,
            function(response) {
                dispatch(groupMembersSlice.actions.setGroupMembersInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * PATCH /group/:groupId/member
 *
 * Update a group member from a partial `member` object. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} member - A populated member object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchGroupMember = function(member) {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, groupMembersSlice,
            'PATCH', `/group/${member.groupId}/member/${member.userId}`, member,
            function(response) {
                dispatch(groupMembersSlice.actions.setGroupMembersInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * DELETE /group/:groupId/member
 *
 * Delete a group member. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} member - A populated member object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const deleteGroupMember = function(member) {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, groupMembersSlice,
            'DELETE', `/group/${member.groupId}/member/${member.userId}`, null,
            function(response) {
                dispatch(groupMembersSlice.actions.removeGroupMember({ entity: response.entity}))
                dispatch(setRelationsInState(response.relations))
            }
        )
    }
} 


export const { 
    setGroupMembersInDictionary, removeGroupMember, 
    makeGroupMemberQuery, clearGroupMemberQuery, setGroupMemberQueryResults,
    cleanupRequest 
}  = groupMembersSlice.actions

export default groupMembersSlice.reducer
