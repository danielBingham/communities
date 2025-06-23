import * as qs from 'qs'

import { makeRequest } from '/state/lib/makeRequest'
import { setRelationsInState } from '/state/lib/relations'

import {
    setSiteModerationsInDictionary, removeSiteModeration, 
    setSiteModerationQueryResults, clearSiteModerationQuery,
    clearSiteModerationQueries
} from './slice'

/**
 * GET /admin/moderations
 * 
 * Get all SiteModerations in the database.  Populates state.dictionary and state.list.
 * Can be used to run queries.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getSiteModerations = function(name, params) {
    return function(dispatch, getState) {
        const endpoint = `/admin/moderations${( params ? '?' + qs.stringify(params) : '')}`

        return dispatch(makeRequest('GET', endpoint, null,
            function(response) {
                dispatch(setSiteModerationsInDictionary({ dictionary: response.dictionary}))

                dispatch(setSiteModerationQueryResults({ name: name, meta: response.meta, list: response.list }))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}

/**
 * POST /admin/moderations
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
export const postSiteModerations = function(siteModeration) {
    return function(dispatch, getState) {
        const endpoint = `/admin/moderations`
        const body = siteModeration 
        return dispatch(makeRequest('POST', endpoint, body,
            function(response) {
                dispatch(setSiteModerationsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        )).catch(function(error) {
            throw error
        })
    }
}

/**
 * GET /admin/moderation/:id
 *
 * Get a single SiteModeration.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {int} id - The id of the siteModeration we want to retrieve.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getSiteModeration = function(id) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('GET', `/admin/moderation/${encodeURIComponent(id)}`, null,
            function(response) {
                dispatch(setSiteModerationsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}

/**
 * PATCH /admin/moderation/:id
 *
 * Update a SiteModeration from a partial `siteModeration` object. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} siteModeration - A populated siteModeration object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchSiteModeration = function(siteModeration) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('PATCH', `/admin/moderation/${encodeURIComponent(siteModeration.id)}`, siteModeration,
            function(response) {
                dispatch(setSiteModerationsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}
