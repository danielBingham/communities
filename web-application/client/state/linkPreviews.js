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
    cleanupRequest as cleanupTrackedRequest
} from './helpers/requestTracker'

export const linkPreviewsSlice = createSlice({
    name: 'linkPreviews',
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
        makeLinkPreviewQuery: makeQuery,
        setLinkPreviewQueryResults: setQueryResults,
        clearLinkPreviewQuery: clearQuery,
        clearLinkPreviewQueries: clearQueries,

        // ========== Request Tracking Methods =============

        makeRequest: startRequestTracking, 
        failRequest: recordRequestFailure, 
        completeRequest: recordRequestSuccess,
        cleanupRequest: cleanupTrackedRequest, 
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
        const queryString = makeSearchParams(params)
        const endpoint = '/link-previews' + ( params ? '?' + queryString.toString() : '')

        dispatch(linkPreviewsSlice.actions.makeLinkPreviewQuery({ name: name }))

        return makeTrackedRequest(dispatch, getState, linkPreviewsSlice,
            'GET', endpoint, null,
            function(response) {
                dispatch(linkPreviewsSlice.actions.setLinkPreviewsInDictionary({ dictionary: response.dictionary}))

                dispatch(linkPreviewsSlice.actions.setLinkPreviewQueryResults({ name: name, meta: response.meta, list: response.list }))

                dispatch(setRelationsInState(response.relations))
            }
        )
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
        const body = linkPreview
        return makeTrackedRequest(dispatch, getState, linkPreviewsSlice,
            'POST', endpoint, body,
            function(response) {
                dispatch(linkPreviewsSlice.actions.setLinkPreviewsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        )
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
        return makeTrackedRequest(dispatch, getState, linkPreviewsSlice,
            'GET', `/link-preview/${id}`, null,
            function(response) {
                dispatch(linkPreviewsSlice.actions.setLinkPreviewsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        )
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
        return makeTrackedRequest(dispatch, getState, linkPreviewsSlice,
            'PATCH', `/link-preview/${linkPreview.id}`, linkPreview,
            function(response) {
                dispatch(linkPreviewsSlice.actions.setLinkPreviewsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}


export const { 
    setLinkPreviewsInDictionary, removeLinkPreview, 
    makeLinkPreviewQuery, clearLinkPreviewQuery, setLinkPreviewQueryResults,
    cleanupRequest
}  = linkPreviewsSlice.actions

export default linkPreviewsSlice.reducer
