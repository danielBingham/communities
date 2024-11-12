import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

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
    useRequest,
    bustRequestCache,
    cleanupRequest as cleanupTrackedRequest, 
    garbageCollectRequests as garbageCollectTrackedRequests } from './helpers/requestTracker'

export const tagsSlice = createSlice({
    name: 'tags',
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
         * A dictionary of tags we've retrieved from the backend, keyed by
         * tag.id.
         *
         * @type {object}
         */
        dictionary: {},

        /**
         *
         * An object containing queries made to query supporting endpoints.
         *
         * In the case of tags: /tags, /tag/:id/children, and
         * /tag/:id/parents
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

        setTagsInDictionary: setInDictionary,
        removeTag: removeEntity,
        makeTagQuery: makeQuery,
        setTagQueryResults: setQueryResults,
        clearTagQuery: clearQuery,
        clearTagQueries: clearQueries,

        // ========== Request Tracking Methods =============

        makeRequest: startRequestTracking, 
        failRequest: recordRequestFailure, 
        completeRequest: recordRequestSuccess,
        useRequest: useRequest,
        bustRequestCache: bustRequestCache,
        cleanupRequest: cleanupTrackedRequest, 
        garbageCollectRequests: garbageCollectTrackedRequests
    }
})


/**
 * GET /tags or GET /tags?...
 *
 * Get all tags in the database.  Populates state.dictionary and state.list.
 * Can be used to run queries.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getTags = function(name, params) {
    return function(dispatch, getState) {

        const queryString = makeSearchParams(params)
        const endpoint = '/tags' + ( params ? '?' + queryString.toString() : '')

        dispatch(tagsSlice.actions.makeTagQuery({ name: name }))

        return makeTrackedRequest(dispatch, getState, tagsSlice,
            'GET', endpoint, null,
            function(response) {
                dispatch(tagsSlice.actions.setTagsInDictionary({ dictionary: response.dictionary}))

                dispatch(tagsSlice.actions.setTagQueryResults({ name: name, meta: response.meta, list: response.list }))

                dispatch(setRelationsInState(response.relations))
            }
        )

    }
}

/**
 * POST /tags
 *
 * Create a new tag.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} tag - A populated tag object, minus the `id` member.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postTags = function(tag) {
    return function(dispatch, getState) {
        const endpoint = '/tags'
        const body = tag
        dispatch(tagsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, tagsSlice,
            'POST', endpoint, body,
            function(response) {
                dispatch(tagsSlice.actions.setTagsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}


/**
 * GET /tag/:id
 *
 * Get a single tag.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {int} id - The id of the tag we want to retrieve.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getTag = function(id) {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, tagsSlice,
            'GET', `/tag/${id}`, null,
            function(response) {
                dispatch(tagsSlice.actions.setTagsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * PUT /tag/:id
 *
 * Replace a tag wholesale. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} tag - A populated tag object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const putTag = function(tag) {
    return function(dispatch, getState) {
        dispatch(tagsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, tagsSlice,
            'PUT', `/tag/${tag.id}`, tag,
            function(response) {
                dispatch(tagsSlice.actions.setTagsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * PATCH /tag/:id
 *
 * Update a tag from a partial `tag` object. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} tag - A populate tag object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchTag = function(tag) {
    return function(dispatch, getState) {
        dispatch(tagsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, tagsSlice,
            'PATCH', `/tag/${tag.id}`, tag,
            function(response) {
                dispatch(tagsSlice.actions.setTagsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * DELETE /tag/:id
 *
 * Delete a tag. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} tag - A populated tag object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const deleteTag = function(tag) {
    return function(dispatch, getState) {
        dispatch(tagsSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, tagsSlice,
            'DELETE', `/tag/${tag.id}`, null,
            function(response) {
                dispatch(tagsSlice.actions.setTagsInDictionary({ entity: response.entity}))
            }
        )
    }
} 


export const { 
    setTagsInDictionary, removeTag, 
    makeTagQuery, clearTagQuery, setTagQueryResults,
    cleanupRequest 
}  = tagsSlice.actions

export default tagsSlice.reducer
