import * as qs from 'qs'

import { makeRequest } from '/state/lib/makeRequest'
import { setRelationsInState } from '/state/lib/relations'

import {
    setLinkPreviewsInDictionary,
    setLinkPreviewNull,
    removeLinkPreview,
    clearLinkPreviewQuery,
    setLinkPreviewQueryResults,
    clearLinkPreviewQueries
} from './slice'

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
        dispatch(setLinkPreviewNull(id))
        return dispatch(makeRequest('GET', `/link-preview/${encodeURIComponent(id)}`, null,
            function(response) {
                dispatch(setLinkPreviewsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            },
            function(status, response) {
                if ( status === 404 || status === 403 ) {
                    dispatch(setLinkPreviewNull(id))
                }
            }
        ))
    }
}
