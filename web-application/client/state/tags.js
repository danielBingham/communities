import { createSlice } from '@reduxjs/toolkit'
import * as qs from 'qs'

import { makeTrackedRequest } from '/state/requests'

import setRelationsInState from '/lib/state/relations'

import {
    setInDictionary,
    removeEntity,
    makeQuery,
    setQueryResults,
    clearQuery,
    clearQueries
} from '/lib/state'

export const tagsSlice = createSlice({
    name: 'tags',
    initialState: {
        
        // ======== Standard State ============================================

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
        // @see /lib/state.js

        setTagsInDictionary: setInDictionary,
        removeTag: removeEntity,
        makeTagQuery: makeQuery,
        setTagQueryResults: setQueryResults,
        clearTagQuery: clearQuery,
        clearTagQueries: clearQueries
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
        const endpoint = `/tags${( params ? '?' + qs.stringify(params) : '')}`
        dispatch(tagsSlice.actions.makeTagQuery({ name: name }))
        return makeTrackedRequest('GET', endpoint, null,
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
        return makeTrackedRequest('POST', '/tags', tag,
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
        return makeTrackedRequest('GET', `/tag/${encodeURIComponent(id)}`, null,
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
        return makeTrackedRequest('PATCH', `/tag/${encodeURIComponent(tag.id)}`, tag,
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
        return makeTrackedRequest('DELETE', `/tag/${encodeURIComponent(tag.id)}`, null,
            function(response) {
                dispatch(tagsSlice.actions.setTagsInDictionary({ entity: response.entity}))
            }
        )
    }
} 


export const { 
    setTagsInDictionary, removeTag, 
    makeTagQuery, clearTagQuery, setTagQueryResults
}  = tagsSlice.actions

export default tagsSlice.reducer
