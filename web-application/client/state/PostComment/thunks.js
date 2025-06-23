import * as qs from 'qs'

import { makeRequest } from '/state/lib/makeRequest'
import { setRelationsInState } from '/state/lib/relations'

import { setPostCommentsInDictionary, removePostComment, clearPostCommentQuery, setPostCommentQueryResults, clearPostCommentQueries } from './slice'

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

        return dispatch(makeRequest('GET', endpoint, null,
            function(response) {
                dispatch(setPostCommentsInDictionary({ dictionary: response.dictionary}))

                dispatch(setPostCommentQueryResults({ name: name, meta: response.meta, list: response.list }))

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
        return dispatch(makeRequest('POST', endpoint, comment,
            function(response) {
                dispatch(setPostCommentsInDictionary({ entity: response.entity}))

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
        return dispatch(makeRequest('GET', `/post/${encodeURIComponent(postId)}/comment/${encodeURIComponent(id)}`, null,
            function(response) {
                dispatch(setPostCommentsInDictionary({ entity: response.entity}))

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
        return dispatch(makeRequest('PATCH', `/post/${encodeURIComponent(comment.postId)}/comment/${encodeURIComponent(comment.id)}`, comment,
            function(response) {
                dispatch(setPostCommentsInDictionary({ entity: response.entity}))

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
        return dispatch(makeRequest('DELETE', `/post/${encodeURIComponent(comment.postId)}/comment/${encodeURIComponent(comment.id)}`, null,
            function(response) {
                dispatch(removePostComment({ entity: comment}))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
} 


