import { makeRequest } from '/state/lib/makeRequest'
import { setRelationsInState } from '/state/lib/relations'

import {
    setCommentReactionsInDictionary, removeCommentReaction
} from './slice'

/**
 * POST /post/:postId/comment/:commentId/reactions
 *
 * Add the current user's reaction to a comment.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} reaction - A populated reaction object, minus the `id`
 * member: `postId`, `commentId`, and `reaction`.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postCommentReaction = function(reaction) {
    return function(dispatch, getState) {
        const endpoint = `/post/${encodeURIComponent(reaction.postId)}/comment/${encodeURIComponent(reaction.commentId)}/reactions`
        const body = { reaction: reaction.reaction }
        return dispatch(makeRequest('POST', endpoint, body,
            function(response) {
                dispatch(setCommentReactionsInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}

/**
 * DELETE /post/:postId/comment/:commentId/reaction
 *
 * Remove the current user's reaction from a comment.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} reaction - The reaction to remove.  Must include `postId`
 * and `commentId`.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const deleteCommentReaction = function(reaction) {
    return function(dispatch, getState) {
        const endpoint = `/post/${encodeURIComponent(reaction.postId)}/comment/${encodeURIComponent(reaction.commentId)}/reaction`
        return dispatch(makeRequest('DELETE', endpoint, null,
            function(response) {
                dispatch(removeCommentReaction({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}
