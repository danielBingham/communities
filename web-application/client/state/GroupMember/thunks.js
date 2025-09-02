import * as qs from 'qs'

import { makeRequest } from '/state/lib/makeRequest'
import { setRelationsInState } from '/state/lib/relations'

import { setGroupMembersInDictionary, setGroupMembersNull, removeGroupMember, setGroupMemberQueryResults, clearGroupMemberQueries } from './slice'

/**
 * GET /group/:groupId/members or GET /group/:groupId/members?...
 *
 * Get all groupMembers in the database.  Populates state.dictionary and state.list.
 * Can be used to run queries.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getGroupMembers = function(groupId, name, params) {
    return function(dispatch, getState) {
        const endpoint = `/group/${encodeURIComponent(groupId)}/members${( params ? '?' + qs.stringify(params) : '' )}` 

        return dispatch(makeRequest('GET', endpoint, null,
            function(response) {
                dispatch(setGroupMembersInDictionary({ dictionary: response.dictionary}))

                dispatch(setGroupMemberQueryResults({ name: name, meta: response.meta, list: response.list }))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}

/**
 * POST /group/:groupId/member
 *
 * Add a member to a group. 
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} group - A populated group object, minus the `id` member.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postGroupMembers = function(groupId, members) {
    return function(dispatch, getState) {
        const endpoint = `/group/${encodeURIComponent(groupId)}/members`
        const body = members
        return dispatch(makeRequest('POST', endpoint, body,
            function(response) {
                if ( 'entity' in response ) {
                    dispatch(setGroupMembersInDictionary({ entity: response.entity}))
                } 
                if ( 'dictionary' in response ) {
                    dispatch(setGroupMembersInDictionary({ dictionary: response.dictionary }))
                }

                dispatch(setRelationsInState(response.relations))
                dispatch(clearGroupMemberQueries())
            }
        ))
    }
}

/**
 * GET /group/:groupId/member/:userId
 *
 * Get a single group.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {int} id - The id of the group we want to retrieve.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getGroupMember = function(groupId, userId) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('GET', `/group/${encodeURIComponent(groupId)}/member/${encodeURIComponent(userId)}`, null,
            function(response) {
                dispatch(setGroupMembersInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            },
            function(status, response) {
                if ( status === 404 || status === 403 ) {
                    dispatch(setGroupMembersNull({ groupId: groupId, userId: userId }))
                }
            }
        ))
    }
}

/**
 * PATCH /group/:groupId/member
 *
 * Update a group member from a partial `member` object. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} member - A populated member object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchGroupMember = function(member) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('PATCH', `/group/${encodeURIComponent(member.groupId)}/member/${encodeURIComponent(member.userId)}`, member,
            function(response) {
                dispatch(setGroupMembersInDictionary({ entity: response.entity}))

                dispatch(setRelationsInState(response.relations))
            },
            function(status, response) {
                if ( status === 404 || status === 403 ) {
                    dispatch(setGroupMembersNull({ groupId: member.groupId, userId: member.userId }))
                }
            }
        ))
    }
}

/**
 * DELETE /group/:groupId/member
 *
 * Delete a group member. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} member - A populated member object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const deleteGroupMember = function(member) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('DELETE', `/group/${encodeURIComponent(member.groupId)}/member/${encodeURIComponent(member.userId)}`, null,
            function(response) {
                dispatch(removeGroupMember({ entity: response.entity}))
                dispatch(setRelationsInState(response.relations))
                dispatch(clearGroupMemberQueries())
            },
            function(status, response) {
                if ( status === 404 || status === 403 ) {
                    dispatch(setGroupMembersNull({ groupId: member.groupId, userId: member.userId }))
                    dispatch(clearGroupMemberQueries())
                }
            }
        ))
    }
} 
