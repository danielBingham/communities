/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
import logger from '/logger'

import { makeRequest } from '/state/lib/makeRequest'
import { setRelationsInState }  from '/state/lib/relations'

import { setFilesInDictionary, removeFile, setSource, setSources, setFileNull } from './slice'

const uploadFile = function(type, id, fileData) {
    return function(dispatch, getState) {
        console.log(`UploadFile: `, type,
            `\nid: `, id,
            `\nfileData: `, fileData)
        const formData = new FormData()
        formData.append('file', fileData)

        return dispatch(makeRequest('POST', `/upload/${encodeURIComponent(id)}/${type}`, formData,
            function(response) {
                dispatch(setFilesInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }

}

/**
 * POST /upload/image
 *
 * Upload a new image.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} file - A populated file object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const uploadImage = function(id, fileData) {
    return uploadFile('image', id, fileData)
}

/**
 * POST /upload/video
 *
 * Upload a new video.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} file - A populated file object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const uploadVideo = function(id, fileData) {
    return function(dispatch, getState) {
        console.log(`UploadFile: `, 
            `\nid: `, id,
            `\nfileData: `, fileData)
        const formData = new FormData()
        formData.append('file', fileData)

        return dispatch(makeRequest('POST', `/upload/${encodeURIComponent(id)}/video`, formData,
            function(response) {
                dispatch(setFilesInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}

export const postFiles = function(file) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('POST', `/files`, file,
            function(response) {
                dispatch(setFilesInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }

}

export const getFileSource = function(fileId, variant) {
    return function(dispatch, getState) {
        let path = `/file/${encodeURIComponent(fileId)}/source`
        if ( variant !== null && variant !== undefined ) {
            path += `?variant=${encodeURIComponent(variant)}`
        }

        return dispatch(makeRequest('GET', path, null,
            function(response) {
                dispatch(setFilesInDictionary({ entity: response.entity}))
                dispatch(setSources({ fileId: fileId, sources: response.sources }))

                dispatch(setRelationsInState(response.relations))
            }, 
            function(status, response) {
                let actualVariant = variant || 'full'
                dispatch(setSource({ fileId: fileId, variant: actualVariant, url: null }))
            }
        ))
    }
}


export const getFile = function(fileId, variant) {
    return function(dispatch, getState) {
        let path = `/file/${encodeURIComponent(fileId)}`
        if ( variant !== null && variant !== undefined ) {
            path += `?variant=${encodeURIComponent(variant)}`
        }

        return dispatch(makeRequest('GET', path, null,
            function(response) {
                dispatch(setFilesInDictionary({ entity: response.entity}))
                dispatch(setSources({ fileId: fileId, sources: response.sources }))

                dispatch(setRelationsInState(response.relations))
            },
            function(status, response) {
                dispatch(setFileNull(fileId))

                let actualVariant = variant || 'full'
                dispatch(setSource({ fileId: fileId, variant: actualVariant, url: null }))
            }
        ))
    }
}

export const patchFile = function(fileId, patch) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('PATCH', `/file/${encodeURIComponent(fileId)}`, patch,
            function(response) {
                dispatch(setFilesInDictionary({ entity: response.entity}))
                dispatch(setSource({ fileId: fileId, variant: 'full', url: response.sources['full'] }))

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
                dispatch(removeFile({ entity: response.entity }))
            }
        ))
    }
}
