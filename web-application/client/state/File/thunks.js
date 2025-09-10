import logger from '/logger'

import { makeRequest } from '/state/lib/makeRequest'
import { setRelationsInState }  from '/state/lib/relations'

import { setFilesInDictionary, removeFile, setInCache, removeFromCache } from './slice'

export const loadFile = function(fileId, width) {
    return async function(dispatch, getState) {
        const state = getState()

        if ( fileId in state.File.cache && width in state.File.cache[fileId] ) {
            return
        }

        dispatch(setInCache({ fileId: fileId, width: width, objectURL: null }))

        const path = `./file/${encodeURIComponent(fileId)}`
        const params = { fileId: fileId }
        if ( width ) {
            params.width = width
        }
        const query = new URLSearchParams(params)
        const url = new URL(path, state.system.api).href + '?' + query

        dispatch(makeRequest('GET', url, null,
            function(response) {
                dispatch(setInCache({ fileId: fileId, width: width, objectURL: response.fileURL }))
            }, 
        null,
        { isFile: true }))
    }
}

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

        return dispatch(makeRequest('POST', `/upload`, formData,
            function(response) {
                dispatch(setFilesInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}

export const patchFile = function(fileId, patch) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('PATCH', `/file/${encodeURIComponent(fileId)}`, patch,
            function(response) {
                dispatch(removeFromCache({ fileId: fileId }))
                dispatch(setFilesInDictionary({ entity: response.entity}))

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
        return dispatch(makeRequest('DELETE', `/file/${encodeURIComponent(fileId)}`, null,
            function(response) {
                dispatch(removeFromCache({ fileId: fileId }))
                dispatch(removeFile({ entity: response.entity }))
            }
        ))
    }
}
