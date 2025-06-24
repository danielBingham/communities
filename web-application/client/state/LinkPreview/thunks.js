import * as qs from 'qs'

import { makeRequest } from '/state/lib/makeRequest'
import { setRelationsInState } from '/state/lib/relations'

import { setLinkPreviewsInDictionary, removeLinkPreview, clearLinkPreviewQuery, setLinkPreviewQueryResults, clearLinkPreviewQueries } from './slice'

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

        return dispatch(makeRequest('GET', endpoint, null,
            function(response) {
                dispatch(setLinkPreviewsInDictionary({ dictionary: response.dictionary}))

                dispatch(setLinkPreviewQueryResults({ name: name, meta: response.meta, list: response.list }))

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
        return dispatch(makeRequest('POST', endpoint, linkPreview,
            function(response) {
                dispatch(setLinkPreviewsInDictionary({ entity: response.entity}))

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
        return dispatch(makeRequest('GET', `/link-preview/${encodeURIComponent(id)}`, null,
            function(response) {
                dispatch(setLinkPreviewsInDictionary({ entity: response.entity}))

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
        return dispatch(makeRequest('PATCH', `/link-preview/${encodeURIComponent(linkPreview.id)}`, linkPreview,
            function(response) {
                dispatch(setLinkPreviewsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}
