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

export const linkPreviewsSlice = createSlice({
    name: 'linkPreviews',
    initialState: {
        
        // ======== Standard State ============================================

        /**
         * A dictionary of linkPreviews we've retrieved from the backend, keyed by
         * linkPreview.id.
         *
         * @type {object}
         */
        dictionary: {},

        /**
         *
         * An object containing queries made to query supporting endpoints.
         *
         * In the case of linkPreviews: /link-previews, /link-preview/:id/children, and
         * /link-preview/:id/parents
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

        setLinkPreviewsInDictionary: setInDictionary, 
        removeLinkPreview: removeEntity,
        setLinkPreviewQueryResults: setQueryResults,
        clearLinkPreviewQuery: clearQuery,
        clearLinkPreviewQueries: clearQueries
    }
})


/**
 * GET /link-previews or GET /link-previews?...
 *
 * Get all linkPreviews in the database.  Populates state.dictionary and state.list.
 * Can be used to run queries.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getLinkPreviews = function(name, params) {
    return function(dispatch, getState) {
        const endpoint = `/link-previews${( params ? '?' + qs.stringify(params) : '' )}`

        return dispatch(makeTrackedRequest('GET', endpoint, null,
            function(response) {
                dispatch(linkPreviewsSlice.actions.setLinkPreviewsInDictionary({ dictionary: response.dictionary}))

                dispatch(linkPreviewsSlice.actions.setLinkPreviewQueryResults({ name: name, meta: response.meta, list: response.list }))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}

/**
 * POST /link-previews
 *
 * Create a new linkPreview.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} linkPreview - A populated linkPreview object, minus the `id` member.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postLinkPreviews = function(linkPreview) {
    return function(dispatch, getState) {
        const endpoint = '/link-previews'
        return dispatch(makeTrackedRequest('POST', endpoint, linkPreview,
            function(response) {
                dispatch(linkPreviewsSlice.actions.setLinkPreviewsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}


/**
 * GET /link-preview/:id
 *
 * Get a single linkPreview.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {int} id - The id of the linkPreview we want to retrieve.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getLinkPreview = function(id) {
    return function(dispatch, getState) {
        return dispatch(makeTrackedRequest('GET', `/link-preview/${encodeURIComponent(id)}`, null,
            function(response) {
                dispatch(linkPreviewsSlice.actions.setLinkPreviewsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}

/**
 * PATCH /link-preview/:id
 *
 * Update a linkPreview from a partial `linkPreview` object. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} linkPreview - A populate linkPreview object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchLinkPreview = function(linkPreview) {
    return function(dispatch, getState) {
        return dispatch(makeTrackedRequest('PATCH', `/link-preview/${encodeURIComponent(linkPreview.id)}`, linkPreview,
            function(response) {
                dispatch(linkPreviewsSlice.actions.setLinkPreviewsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}


export const { 
    setLinkPreviewsInDictionary, removeLinkPreview, 
     clearLinkPreviewQuery, setLinkPreviewQueryResults
}  = linkPreviewsSlice.actions

export default linkPreviewsSlice.reducer
