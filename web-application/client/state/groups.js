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

export const groupsSlice = createSlice({
    name: 'groups',
    initialState: {
        
        // ======== Standard State ============================================

        /**
         * A dictionary of groups we've retrieved from the backend, keyed by
         * group.id.
         *
         * @type {object}
         */
        dictionary: {},

        /**
         *
         * An object containing queries made to query supporting endpoints.
         *
         * In the case of groups: /groups, /group/:id/children, and
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

        setGroupsInDictionary: setInDictionary, 
        removeGroup: removeEntity,
        makeGroupQuery: makeQuery,
        setGroupQueryResults: setQueryResults,
        clearGroupQuery: clearQuery,
        clearGroupQueries: clearQueries
    }
})


/**
 * GET /groups or GET /groups?...
 *
 * Get all groups in the database.  Populates state.dictionary and state.list.
 * Can be used to run queries.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getGroups = function(name, params) {
    return function(dispatch, getState) {
        const endpoint = `/groups${( params ? '?' + qs.stringify(params) : '' )}`

        dispatch(groupsSlice.actions.makeGroupQuery({ name: name }))

        return dispatch(makeTrackedRequest('GET', endpoint, null,
            function(response) {
                dispatch(groupsSlice.actions.setGroupsInDictionary({ dictionary: response.dictionary}))

                dispatch(groupsSlice.actions.setGroupQueryResults({ name: name, meta: response.meta, list: response.list }))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}

/**
 * POST /groups
 *
 * Create a new group.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} group - A populated group object, minus the `id` member.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postGroups = function(group) {
    return function(dispatch, getState) {
        const endpoint = '/groups'

        return dispatch(makeTrackedRequest('POST', endpoint, group,
            function(response) {
                dispatch(groupsSlice.actions.setGroupsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}


/**
 * GET /group/:id
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
export const getGroup = function(id) {
    return function(dispatch, getState) {
        return dispatch(makeTrackedRequest('GET', `/group/${encodeURIComponent(id)}`, null,
            function(response) {
                dispatch(groupsSlice.actions.setGroupsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}

/**
 * PATCH /group/:id
 *
 * Update a group from a partial `group` object. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} group - A populate group object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchGroup = function(group) {
    return function(dispatch, getState) {
        return dispatch(makeTrackedRequest('PATCH', `/group/${encodeURIComponent(group.id)}`, group,
            function(response) {
                dispatch(groupsSlice.actions.setGroupsInDictionary({ entity: response.entity}))
                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}

/**
 * DELETE /group/:id
 *
 * Delete a group. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} group - A populated group object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const deleteGroup = function(group) {
    return function(dispatch, getState) {
        return dispatch(makeTrackedRequest('DELETE', `/group/${encodeURIComponent(group.id)}`, null,
            function(response) {
                dispatch(groupsSlice.actions.removeGroup({ entity: group}))
            }
        ))
    }
} 


export const { 
    setGroupsInDictionary, removeGroup, 
    makeGroupQuery, clearGroupQuery, setGroupQueryResults
}  = groupsSlice.actions

export default groupsSlice.reducer
