import { createSlice } from '@reduxjs/toolkit'
import * as qs from 'qs'

import { makeTrackedRequest } from '/lib/state/request'

import { setRelationsInState } from '/lib/state/relations'

import {
    setInDictionary,
    removeEntity,
    setQueryResults,
    clearQuery,
    clearQueries
} from '/lib/state'

export const postCommentsSlice = createSlice({
    name: 'postComments',
    initialState: {
        
        // ======== Standard State ============================================

        /**
         * A dictionary of postComments we've retrieved from the backend, keyed by
         * postComment.id.
         *
         * @type {object}
         */
        dictionary: {},

        /**
         *
         * An object containing queries made to query supporting endpoints.
         *
         * In the case of postComments: /postComments, /postComment/:id/children, and
         * /postComment/:id/parents
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

        // Specific state
        commentsByPost: {},

        // Which comments are currently being edited?
        //
        // { 
        //  [id]: boolean
        // }
        editing: {}

    },
    reducers: {
        // ======== State Manipulation Helpers ================================
        // @see ./helpers/state.js

        setPostCommentsInDictionary: function(state, action) {
            setInDictionary(state, action)

            if ( 'dictionary' in action.payload ) {
                const dictionary = action.payload.dictionary
                for(const [id, entity] of Object.entries(dictionary)) {
                    if( ! ( entity.postId in state.commentsByPost )) {
                        state.commentsByPost[entity.postId] = {}
                    } 

                    state.commentsByPost[entity.postId][entity.id] = entity
                }
            } else if ( 'entity' in action.payload ) {
                const entity = action.payload.entity
                if( ! ( entity.postId in state.commentsByPost )) {
                    state.commentsByPost[entity.postId] = {}
                } 

                state.commentsByPost[entity.postId][entity.id] = entity
            }
        },
        removePostComment: function(state, action) {
            removeEntity(state, action)

            const entity = action.payload.entity

            if ( entity.postId in state.commentsByPost && entity.id in state.commentsByPost[entity.postId]) {
                delete state.commentsByPost[entity.postId][entity.id]
            }
        },
        setPostCommentQueryResults: setQueryResults,
        clearPostCommentQuery: clearQuery,
        clearPostCommentQueries: clearQueries,

        startPostCommentEdit: function(state, action) {
            const commentId = action.payload
            state.editing[commentId] = true
        },

        finishPostCommentEdit: function(state, action) {
            const commentId = action.payload
            delete state.editing[commentId]
        }
    }
})


/**
 * GET /post/:postId/comments or GET /post/:postId/comments?...
 *
 * Get all postComments in the database.  Populates state.dictionary and state.list.
 * Can be used to run queries.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getPostComments = function(postId, name, params) {
    return function(dispatch, getState) {
        const endpoint = `/post/${encodeURIComponent(postId)}/comments${( params ? '?' + qs.stringify(params) : '')}`

        return dispatch(makeTrackedRequest('GET', endpoint, null,
            function(response) {
                dispatch(postCommentsSlice.actions.setPostCommentsInDictionary({ dictionary: response.dictionary}))

                dispatch(postCommentsSlice.actions.setPostCommentQueryResults({ name: name, meta: response.meta, list: response.list }))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}

/**
 * POST /post/:postId/comments
 *
 * Create a new postComment.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} postComment - A populated postComment object, minus the `id` member.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postPostComments = function(comment) {
    return function(dispatch, getState) {
        const endpoint = `/post/${encodeURIComponent(comment.postId)}/comments`
        return dispatch(makeTrackedRequest('POST', endpoint, comment,
            function(response) {
                dispatch(postCommentsSlice.actions.setPostCommentsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}


/**
 * GET /post/:postId/comment/:id
 *
 * Get a single PostComment.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {int} id - The id of the postComment we want to retrieve.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getPostComment = function(postId, id) {
    return function(dispatch, getState) {
        return dispatch(makeTrackedRequest('GET', `/post/${encodeURIComponent(postId)}/comment/${encodeURIComponent(id)}`, null,
            function(response) {
                dispatch(postCommentsSlice.actions.setPostCommentsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}

/**
 * PATCH /post/:postId/comment/:id
 *
 * Update a postComment from a partial `postComment` object. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} postComment - A populate postComment object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchPostComment = function(comment) {
    return function(dispatch, getState) {
        return dispatch(makeTrackedRequest('PATCH', `/post/${encodeURIComponent(comment.postId)}/comment/${encodeURIComponent(comment.id)}`, comment,
            function(response) {
                dispatch(postCommentsSlice.actions.setPostCommentsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}

/**
 * DELETE /post/:postId/comment/:id
 *
 * Delete a PostComment. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} postComment - A populated postComment object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const deletePostComment = function(comment) {
    return function(dispatch, getState) {
        return dispatch(makeTrackedRequest('DELETE', `/post/${encodeURIComponent(comment.postId)}/comment/${encodeURIComponent(comment.id)}`, null,
            function(response) {
                dispatch(postCommentsSlice.actions.removePostComment({ entity: comment}))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
} 


export const { 
    setPostCommentsInDictionary, removePostComment, 
    clearPostCommentQuery, setPostCommentQueryResults,
    startPostCommentEdit, finishPostCommentEdit
}  = postCommentsSlice.actions

export default postCommentsSlice.reducer
