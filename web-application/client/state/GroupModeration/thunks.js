import * as qs from 'qs'

import { makeRequest } from '/state/lib/makeRequest'
import { setRelationsInState } from '/state/lib/relations'

import {
    setGroupModerationsInDictionary, removeGroupModeration, 
    setGroupModerationQueryResults, clearGroupModerationQuery,
    clearGroupModerationQueries
} from './slice'

/**
 * GET /admin/moderations
 * 
 * Get all GroupModerations in the database.  Populates state.dictionary and state.list.
 * Can be used to run queries.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getGroupModerations = function(groupId, name, params) {
    return function(dispatch, getState) {
        const endpoint = `/group/${encodeURIComponent(groupId)}/moderations${( params ? '?' + qs.stringify(params) : '')}`

        return dispatch(makeRequest('GET', endpoint, null,
            function(response) {
                dispatch(setGroupModerationsInDictionary({ dictionary: response.dictionary}))

                dispatch(setGroupModerationQueryResults({ name: name, meta: response.meta, list: response.list }))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}

/**
 * POST /admin/moderations
 *
 * Moderate a post. 
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} post - A populated post object, minus the `id` member.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postGroupModerations = function(groupModeration) {
    return function(dispatch, getState) {
        const endpoint = `/group/${encodeURIComponent(groupModeration.groupId)}/moderations`
        const body = groupModeration 
        return dispatch(makeRequest('POST', endpoint, body,
            function(response) {
                dispatch(setGroupModerationsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}

/**
 * GET /admin/moderation/:id
 *
 * Get a single GroupModeration.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {int} id - The id of the groupModeration we want to retrieve.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getGroupModeration = function(groupId, id) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('GET', `/group/${encodeURIComponent(groupId)}/moderation/${encodeURIComponent(id)}`, null,
            function(response) {
                dispatch(setGroupModerationsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}

/**
 * PATCH /admin/moderation/:id
 *
 * Update a GroupModeration from a partial `groupModeration` object. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} groupModeration - A populated groupModeration object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchGroupModeration = function(groupModeration) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('PATCH', `/group/${encodeURIComponent(groupModeration.groupId)}/moderation/${encodeURIComponent(groupModeration.id)}`, groupModeration,
            function(response) {
                dispatch(setGroupModerationsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}
