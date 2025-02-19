import { createSlice } from '@reduxjs/toolkit'
import * as qs from 'qs'

import { makeTrackedRequest } from '/lib/state/request'

import setRelationsInState from '/lib/state/relations'

import {
    setInDictionary,
    removeEntity,
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
        queries: {},

        bySlug: {}
    },
    reducers: {
        // ======== State Manipulation Helpers ================================
        // @see ./helpers/state.js

        setGroupsInDictionary: (state, action) => {
            setInDictionary(state, action)

            if ( 'dictionary' in action.payload) {
                for(const [id, group] of Object.entries(action.payload.dictionary)) {
                    state.bySlug[group.slug] = group
                }
            } else if ( 'entity' in action.payload ) {
                state.bySlug[action.payload.entity.slug] = action.payload.entity
            }
        }, 
        removeGroup: (state, action) => {
            removeEntity(state, action)

            delete state.bySlug[action.payload.entity.slug]
        },
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
    clearGroupQuery, setGroupQueryResults
}  = groupsSlice.actions

export default groupsSlice.reducer
