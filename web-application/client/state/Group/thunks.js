import * as qs from 'qs'

import { makeRequest } from '/state/lib/makeRequest'
import { setRelationsInState } from '/state/lib/relations'

import { setGroupsInDictionary, removeGroup, setGroupQueryResults, clearGroupQuery, clearGroupQueries } from './slice'

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

        return dispatch(makeRequest('GET', endpoint, null,
            function(response) {
                dispatch(setGroupsInDictionary({ dictionary: response.dictionary}))

                dispatch(setGroupQueryResults({ name: name, meta: response.meta, list: response.list }))

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

        return dispatch(makeRequest('POST', endpoint, group,
            function(response) {
                dispatch(setGroupsInDictionary({ entity: response.entity}))

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
        return dispatch(makeRequest('GET', `/group/${encodeURIComponent(id)}`, null,
            function(response) {
                dispatch(setGroupsInDictionary({ entity: response.entity}))

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
        return dispatch(makeRequest('PATCH', `/group/${encodeURIComponent(group.id)}`, group,
            function(response) {
                dispatch(setGroupsInDictionary({ entity: response.entity}))
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
        return dispatch(makeRequest('DELETE', `/group/${encodeURIComponent(group.id)}`, null,
            function(response) {
                dispatch(removeGroup({ entity: group}))
            }
        ))
    }
} 
