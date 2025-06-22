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

export const groupMembersSlice = createSlice({
    name: 'groupMembers',
    initialState: {
        
        // ======== Standard State ============================================

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
        queries: {},

        byGroupAndUser: {}

    },
    reducers: {
        // ======== State Manipulation Helpers ================================
        // @see ./helpers/state.js

        setGroupMembersInDictionary: (state, action) => {
            setInDictionary(state, action)

            const setByGroupAndUser = (entity) => {
                if ( ! (entity.groupId in state.byGroupAndUser) ) {
                    state.byGroupAndUser[entity.groupId] = {}
                }
                state.byGroupAndUser[entity.groupId][entity.userId] = entity
            }

            if ( 'dictionary' in action.payload ) {
                for(const [id, entity] of Object.entries(action.payload.dictionary)) {
                    setByGroupAndUser(entity)
                }
            } else if ('entity' in action.payload ) {
                setByGroupAndUser(action.payload.entity)
            }
        },
        removeGroupMember: (state, action) => {
            removeEntity(state, action)

            delete state.byGroupAndUser[action.payload.entity.groupId][action.payload.entity.userId]
        },
        setGroupMemberQueryResults: setQueryResults,
        clearGroupMemberQuery: clearQuery,
        clearGroupMemberQueries: clearQueries
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
        const endpoint = `/group/${encodeURIComponent(groupId)}/members${( params ? '?' + qs.stringify(params) : '' )}` 

        return dispatch(makeTrackedRequest('GET', endpoint, null,
            function(response) {
                dispatch(groupMembersSlice.actions.setGroupMembersInDictionary({ dictionary: response.dictionary}))

                dispatch(groupMembersSlice.actions.setGroupMemberQueryResults({ name: name, meta: response.meta, list: response.list }))

                dispatch(setRelationsInState(response.relations))
            }
        ))
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
        return dispatch(makeTrackedRequest('POST', endpoint, body,
            function(response) {
                dispatch(groupMembersSlice.actions.setGroupMembersInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
                dispatch(groupMembersSlice.actions.clearGroupMemberQueries())
            }
        ))
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
        return dispatch(makeTrackedRequest('GET', `/group/${encodeURIComponent(groupId)}/member/${encodeURIComponent(userId)}`, null,
            function(response) {
                dispatch(groupMembersSlice.actions.setGroupMembersInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        ))
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
        return dispatch(makeTrackedRequest('PATCH', `/group/${encodeURIComponent(member.groupId)}/member/${encodeURIComponent(member.userId)}`, member,
            function(response) {
                dispatch(groupMembersSlice.actions.setGroupMembersInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        ))
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
        return dispatch(makeTrackedRequest('DELETE', `/group/${encodeURIComponent(member.groupId)}/member/${encodeURIComponent(member.userId)}`, null,
            function(response) {
                dispatch(groupMembersSlice.actions.removeGroupMember({ entity: response.entity}))
                dispatch(setRelationsInState(response.relations))
                dispatch(groupMembersSlice.actions.clearGroupMemberQueries())
            }
        ))
    }
} 


export const { 
    setGroupMembersInDictionary, removeGroupMember, 
    clearGroupMemberQuery, setGroupMemberQueryResults
}  = groupMembersSlice.actions

export default groupMembersSlice.reducer
