import * as qs from 'qs'

import { makeRequest } from '/state/lib/makeRequest'
import { setRelationsInState } from '/state/lib/relations'
import { queryIsUsing } from '/state/lib/queryIsUsing'

import {
    setBlocklistsInDictionary, removeBlocklist ,
    setBlocklistQueryResults, clearBlocklistQuery,
    clearBlocklistQueries
} from './slice'

/**
 * Cleanup a query and all entities that are only in use by that query.
 * Entities in use by other queries will be left.
 *
 * @param {string} key The name of the query we want to cleanup.
 *
 * @return {void} 
 */
export const cleanupBlocklistQuery = function(key) {
    return function(dispatch, getState) {
        const state = getState().Blocklist

        if ( key in state.queries ) {
            const query = state.queries[key]
            for(const id of query.list) {
                if ( queryIsUsing(state.queries, id, key) ) {
                    continue
                }

                const entity = id in state.dictionary ? state.dictionary[id] : null
                if ( entity !== null ) {
                    dispatch(removeBlocklist({ entity: entity }))
                }
            }

            dispatch(clearBlocklistQuery({ name: key }))
        }
    }
}

/**
 * GET /admin/blocklists
 * 
 * Get all Blocklists in the database.  Populates state.dictionary and state.list.
 * Can be used to run queries.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getBlocklists = function(name, params) {
    return function(dispatch, getState) {
        const endpoint = `/admin/blocklists${( params ? '?' + qs.stringify(params) : '')}`

        return dispatch(makeRequest('GET', endpoint, null,
            function(response) {
                dispatch(setBlocklistsInDictionary({ dictionary: response.dictionary}))

                dispatch(setBlocklistQueryResults({ name: name, meta: response.meta, list: response.list }))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}

/**
 * POST /admin/blocklists
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
export const postBlocklists = function(blocklist) {
    return function(dispatch, getState) {
        const endpoint = `/admin/blocklists`
        const body = blocklist 
        return dispatch(makeRequest('POST', endpoint, body,
            function(response) {
                dispatch(setBlocklistsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        )).catch(function(error) {
            throw error
        })
    }
}

/**
 * GET /admin/blocklist/:id
 *
 * Get a single Blocklist.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {int} id - The id of the blocklist we want to retrieve.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getBlocklist = function(id) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('GET', `/admin/blocklist/${encodeURIComponent(id)}`, null,
            function(response) {
                dispatch(setBlocklistsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}

/**
 * PATCH /admin/blocklist/:id
 *
 * Update a Blocklist from a partial `blocklist` object. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} blocklist - A populated blocklist object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchBlocklist = function(blocklist) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('PATCH', `/admin/blocklist/${encodeURIComponent(blocklist.id)}`, blocklist,
            function(response) {
                dispatch(setBlocklistsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}

/**
 * DELETE /blocklist/:id
 *
 * Delete a blocklist. 
 *
 * @param {object} blocklist - A populated blocklist object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const deleteBlocklist = function(blocklist) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('DELETE', `/admin/blocklist/${encodeURIComponent(blocklist.id)}`, null,
            function(response) {
                dispatch(removeBlocklist({ entity: blocklist, clearQueries: true }))
            }
        ))
    }
}
