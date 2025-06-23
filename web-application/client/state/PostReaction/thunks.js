import { makeRequest } from '/state/lib/makeRequest'
import { setRelationsInState } from '/lib/state/relations'

import { 
    setPostReactionsInDictionary, removePostReaction, 
    clearPostReactionQuery, setPostReactionQueryResults,
    clearPostReactionQueries
} from './slice'

/**
 * POST /post/:postId/reaction
 *
 * Add a reaction to a post. 
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} post - A populated post object, minus the `id` member.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postPostReaction = function(reaction) {
    return function(dispatch, getState) {
        const endpoint = `/post/${encodeURIComponent(reaction.postId)}/reactions`
        const body = reaction
        return dispatch(makeRequest('POST', endpoint, body,
            function(response) {
                dispatch(setPostReactionsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}

/**
 * PATCH /post/:postId/reaction
 *
 * Update a post reaction from a partial `reaction` object. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} reaction - A populated reaction object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchPostReaction = function(reaction) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('PATCH', `/post/${encodeURIComponent(reaction.postId)}/reaction`, reaction,
            function(response) {
                dispatch(setPostReactionsInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}

/**
 * DELETE /post/:postId/reaction
 *
 * Delete a post reaction. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} reaction - A populated reaction object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const deletePostReaction = function(reaction) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('DELETE', `/post/${encodeURIComponent(reaction.postId)}/reaction`, null,
            function(response) {
                dispatch(removePostReaction({ entity: reaction }))
                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
} 
