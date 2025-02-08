import { createSlice } from '@reduxjs/toolkit'

import setRelationsInState from '/lib/state/relations'

import {
    setInDictionary,
    removeEntity,
    makeQuery,
    setQueryResults,
    clearQuery,
    clearQueries
} from '/lib/state'

import { makeTrackedRequest } from '/state/requests'

export const filesSlice = createSlice({
    name: 'files',
    initialState: {
        // ======== Standard State ============================================

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
        clearFileQueries: clearQueries
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

        return dispatch(makeTrackedRequest('POST', `/upload`, formData,
            function(response) {
                dispatch(filesSlice.actions.setFilesInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        ))
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
        return dispatch(makeTrackedRequest('GET', `/file/${id}`, null,
            function(response) {
                dispatch(filesSlice.actions.setFilesInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        ))
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
        return dispatch(makeTrackedRequest('DELETE', `/file/${fileId}`, null,
            function(response) {
                dispatch(filesSlice.actions.removeFile({ entity: response.entity }))
            }
        ))
    }
}



export const {  setFilesInDictionary, removeFile }  = filesSlice.actions

export default filesSlice.reducer
