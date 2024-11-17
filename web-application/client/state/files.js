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
    makeTrackedRequest,
    startRequestTracking, 
    recordRequestFailure, 
    recordRequestSuccess, 
    bustRequestCache,
    useRequest,
    cleanupRequest as cleanupTrackedRequest, 
    garbageCollectRequests as garbageCollectTrackedRequests } from './helpers/requestTracker'

export const filesSlice = createSlice({
    name: 'files',
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
         * A dictionary of posts we've retrieved from the backend, keyed by
         * post.id.
         *
         * @type {object}
         */
        dictionary: {},

        /**
         *
         * An object containing queries made to query supporting endpoints.
         *
         * In the case of posts: /posts, /post/:id/children, and
         * /post/:id/parents
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

        setFilesInDictionary: setInDictionary,
        removeFile: removeEntity,
        makeFileQuery: makeQuery,
        setFileQueryResults: setQueryResults,
        clearFileQuery: clearQuery,
        clearFileQueries: clearQueries,

        // ========== Request Tracking Methods =============

        makeRequest: startRequestTracking, 
        failRequest: recordRequestFailure, 
        completeRequest: recordRequestSuccess,
        bustRequestCache: bustRequestCache,
        useRequest: useRequest,
        cleanupRequest: cleanupTrackedRequest, 
        garbageCollectRequests: garbageCollectTrackedRequests
    }
})

/**
 * POST /upload
 *
 * Upload a new file.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} file - A populated file object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const uploadFile = function(file) {
    return function(dispatch, getState) {
        const formData = new FormData()
        formData.append('file', file)

        dispatch(filesSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, filesSlice,
            'POST', `/upload`, formData,
            function(response) {
                dispatch(filesSlice.actions.setFilesInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * GET /file/:id
 *
 * Get a single file.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {int} id - The id of the file we want to retrieve.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getFile = function(id) {
    return function(dispatch, getState) {
        return makeTrackedRequest(dispatch, getState, filesSlice,
            'GET', `/file/${id}`, null,
            function(response) {
                dispatch(filesSlice.actions.setFilesInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        )
    }
}

/**
 * DELETE /file/:id 
 *
 * Delete a file.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {int} fileId - The Id of the file we want to delete. 
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const deleteFile = function(fileId) {
    return function(dispatch, getState) {
        dispatch(filesSlice.actions.bustRequestCache())
        return makeTrackedRequest(dispatch, getState, filesSlice,
            'DELETE', `/file/${fileId}`, null,
            function(response) {
                dispatch(filesSlice.actions.removeFile({ entity: response.entity }))
            }
        )
    }
}



export const {  addFilesToDictionary, removeFile, makeRequest, failRequest, completeRequest, cleanupRequest }  = filesSlice.actions

export default filesSlice.reducer
