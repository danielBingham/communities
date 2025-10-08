import * as qs from 'qs'

import { makeRequest } from '/state/lib/makeRequest'
import { setRelationsInState } from '/state/lib/relations'
import { queryIsUsing } from '/state/lib/queryIsUsing'

import { setCurrentUser } from '/state/authentication'

import { setUsersInDictionary, setUserNull, removeUser, setUserQueryResults, clearUserQuery, clearUserQueries } from './slice'

const updateCurrentUser = function(response) {
    return function(dispatch, getState) {
        // If the user we just got is the same as the one in the session,
        // update the session.  The server will have already done this for
        // the backend, doubling the login on the frontend just saves us a
        // request.
        const state = getState()
        if ( 
            state.authentication.currentUser 
            && state.authentication.currentUser.id == response.entity.id
            && 'status' in response.entity // We only want to update the currentUser if we got the fullUser record back.
        ) { 
            dispatch(setCurrentUser(response.entity))
        }
    }
}

/**
 * Cleanup a query and all entities that are only in use by that query.
 * Entities in use by other queries will be left.
 *
 * @param {string} key The name of the query we want to cleanup.
 *
 * @return {void} 
 */
export const cleanupUserQuery = function(key) {
    return function(dispatch, getState) {
        const state = getState().User

        if ( key in state.queries ) {
            const query = state.queries[key]
            for(const id of query.list) {
                if ( queryIsUsing(state.queries, id, key) ) {
                    continue
                }

                const entity = id in state.dictionary ? state.dictionary[id] : null
                if ( entity !== null ) {
                    dispatch(removeUser({ entity: entity, ignoreQuery: key }))
                }
            }

            dispatch(clearUserQuery({ name: key }))
        }
    }
}

/**
 * GET /users?...
 *
 * Get all users in the database. Queryable.  Populates state.dictionary and
 * state.list.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getUsers = function(name, params) {
    return function(dispatch, getState) {
        const endpoint = `/users${( params ? '?' + qs.stringify(params) : '')}`
        return dispatch(makeRequest('GET', endpoint, null,
            function(response) {
                dispatch(setUsersInDictionary({ dictionary: response.dictionary }))

                dispatch(setUserQueryResults({ name: name, meta: response.meta, list: response.list }))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}

/**
 * POST /users
 *
 * Create a new user.
 *  
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} user - A populated user object, minus the `id` member.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const postUsers = function(users) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('POST', '/users', users,
            function(response) {
                dispatch(setUsersInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))

                dispatch(updateCurrentUser(response))
            }
        ))
    }
}

/**
 * GET /user/:id
 *
 * Get a single user.
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {int} id - The id of the user we want to retrieve.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getUser = function(id) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('GET', `/user/${encodeURIComponent(id)}`, null,
            function(response) {
                dispatch(setUsersInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))

                dispatch(updateCurrentUser(response))
            },
            function(status, response) {
                if ( status === 404 || status === 403 ) {
                    dispatch(setUserNull(id))
                } else if ( status === 500 ) {
                    // Avoid infinite looping on server error.
                    dispatch(setUserNull(id))
                }
            }
        ))
    }
}

/**
 * PATCH /user/:id
 *
 * Update a user from a partial `user` object. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} user - A populate user object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const patchUser = function(user) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('PATCH', `/user/${encodeURIComponent(user.id)}`, user,
            function(response) {
                dispatch(setUsersInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))

                dispatch(updateCurrentUser(response))
            }
        ))
    }
}

/**
 * DELETE /user/:id
 *
 * Delete a user. 
 *
 * Makes the request asynchronously and returns a id that can be used to track
 * the request and retreive the results from the state slice.
 *
 * @param {object} user - A populated user object.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const deleteUser = function(user) {
    return function(dispatch, getState) {
        return dispatch(makeRequest('DELETE', `/user/${encodeURIComponent(user.id)}`, null,
            function(response) {
                dispatch(clearUserQueries())
                dispatch(removeUser({ entity: user }))
            }
        ))
    }
} 
