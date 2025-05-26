import { createSlice } from '@reduxjs/toolkit'
import * as qs from 'qs'

import { makeTrackedRequest } from '/lib/state/request'

import setRelationsInState from '/lib/state/relations'

import {
    setInDictionary,
    removeEntity,
    setQueryResults,
    clearQuery,
    clearQueries
} from '/lib/state'

export const siteModerationsSlice = createSlice({
    name: 'siteModerations',
    initialState: {
        
        // ======== Standard State ============================================

        /**
         * A dictionary of siteModerations we've retrieved from the backend, keyed by
         * post.id.
         *
         * @type {object}
         */
        dictionary: {},

        /**
         *
         * An object containing queries made to query supporting endpoints.
         *
         * In the case of SiteModeration: /admin/moderations
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
        queries: {},

        byPostId: {},
        byPostCommentId: {}
    },
    reducers: {
        // ======== State Manipulation Helpers ================================
        // @see ./helpers/state.js

        setSiteModerationsInDictionary: function(state, action) {
            setInDictionary(state, action)

            if ( 'dictionary' in action.payload ) {
                for(const [id, entity] of Object.entries(action.payload.dictionary)) {
                    if ( entity.postId !== null ) {
                        state.byPostId[entity.postId] = entity
                    } else if ( entity.postCommentId !== null ) {
                        state.byPostCommentId[entity.postCommentId] = entity
                    }
                }
            } else if ( 'entity' in action.payload ) {
                const entity = action.payload.entity
                if ( entity.postId !== null ) {
                    state.byPostId[entity.postId] = entity
                } else if ( entity.postCommentId !== null ) {
                    state.byPostCommentId[entity.postCommentId] = entity
                }
            }
        },
        removeSiteModeration: function(state, action) {
            removeEntity(state, action)
            
            if ( action.payload.entity.postId !== null ) {
                delete state.byPostId[action.payload.entity.postId]
            } else if( action.payload.entity.postCommentId !== null ) {
                delete state.byPostCommentId[action.payload.entity.postCommentId]
            }
        },
        setSiteModerationQueryResults: setQueryResults,
        clearSiteModerationQuery: clearQuery,
        clearSiteModerationQueries: clearQueries
    }
})

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

        return dispatch(makeTrackedRequest('GET', endpoint, null,
            function(response) {
                dispatch(siteModerationsSlice.actions.setSiteModerationsInDictionary({ dictionary: response.dictionary}))

                dispatch(siteModerationsSlice.actions.setSiteModerationQueryResults({ name: name, meta: response.meta, list: response.list }))

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
        return dispatch(makeTrackedRequest('POST', endpoint, body,
            function(response) {
                dispatch(siteModerationsSlice.actions.setSiteModerationsInDictionary({ entity: response.entity}))

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
        return dispatch(makeTrackedRequest('GET', `/admin/moderation/${encodeURIComponent(id)}`, null,
            function(response) {
                dispatch(siteModerationsSlice.actions.setSiteModerationsInDictionary({ entity: response.entity}))

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
        return dispatch(makeTrackedRequest('PATCH', `/admin/moderation/${encodeURIComponent(siteModeration.id)}`, siteModeration,
            function(response) {
                dispatch(siteModerationsSlice.actions.setSiteModerationsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}

export const { 
    setSiteModerationsInDictionary, clearSiteModerationQuery
}  = siteModerationsSlice.actions

export default siteModerationsSlice.reducer
