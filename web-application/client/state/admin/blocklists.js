import { createSlice } from '@reduxjs/toolkit'
import * as qs from 'qs'

import { makeTrackedRequest } from '/lib/state/request'

import { setRelationsInState } from '/lib/state/relations'

import {
    isQueryUsing,
    setInDictionary,
    removeEntity,
    setQueryResults,
    clearQuery,
    clearQueries
} from '/lib/state'

export const blocklistsSlice = createSlice({
    name: 'blocklists',
    initialState: {
        
        // ======== Standard State ============================================

        /**
         * A dictionary of blocklists we've retrieved from the backend, keyed by
         * post.id.
         *
         * @type {object}
         */
        dictionary: {},

        /**
         *
         * An object containing queries made to query supporting endpoints.
         *
         * In the case of Blocklist: /admin/blocklists
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

    },
    reducers: {
        // ======== State Manipulation Helpers ================================
        // @see ./helpers/state.js

        setBlocklistsInDictionary: setInDictionary,
        removeBlocklist: removeEntity,
        setBlocklistQueryResults: setQueryResults,
        clearBlocklistQuery: clearQuery,
        clearBlocklistQueries: clearQueries
    }
})


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
        const state = getState().blocklists

        if ( key in state.queries ) {
            const query = state.queries[key]
            for(const id of query.list) {
                if ( isQueryUsing(state.queries, id, key) ) {
                    continue
                }

                const entity = id in state.dictionary ? state.dictionary[id] : null
                if ( entity !== null ) {
                    dispatch(blocklistsSlice.actions.removeBlocklist({ entity: entity }))
                }
            }

            dispatch(blocklistsSlice.actions.clearBlocklistQuery({ name: key }))
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

        return dispatch(makeTrackedRequest('GET', endpoint, null,
            function(response) {
                dispatch(blocklistsSlice.actions.setBlocklistsInDictionary({ dictionary: response.dictionary}))

                dispatch(blocklistsSlice.actions.setBlocklistQueryResults({ name: name, meta: response.meta, list: response.list }))

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
        return dispatch(makeTrackedRequest('POST', endpoint, body,
            function(response) {
                dispatch(blocklistsSlice.actions.setBlocklistsInDictionary({ entity: response.entity}))

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
        return dispatch(makeTrackedRequest('GET', `/admin/blocklist/${encodeURIComponent(id)}`, null,
            function(response) {
                dispatch(blocklistsSlice.actions.setBlocklistsInDictionary({ entity: response.entity}))

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
        return dispatch(makeTrackedRequest('PATCH', `/admin/blocklist/${encodeURIComponent(blocklist.id)}`, blocklist,
            function(response) {
                dispatch(blocklistsSlice.actions.setBlocklistsInDictionary({ entity: response.entity}))

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
        return dispatch(makeTrackedRequest('DELETE', `/admin/blocklist/${encodeURIComponent(blocklist.id)}`, null,
            function(response) {
                dispatch(blocklistsSlice.actions.removeBlocklist({ entity: blocklist, clearQueries: true }))
            }
        ))
    }
} 

export const { 
    setBlocklistsInDictionary, removeBlocklist 
}  = blocklistsSlice.actions

export default blocklistsSlice.reducer
