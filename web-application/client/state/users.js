import { createSlice, current } from '@reduxjs/toolkit'
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

import { setCurrentUser } from '/state/authentication'

export const usersSlice = createSlice({
    name: 'users',
    initialState: {

        /**
         * A dictionary of users we've retrieved from the backend, keyed by
         * user.id.
         *
         * @type {object}
         */
        dictionary: {},

        /**
         *
         * An object containing queries made to query supporting endpoints.
         *
         * In this case: GET /users 
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

        setUsersInDictionary: setInDictionary,
        removeUser: removeEntity,
        makeUserQuery: makeQuery,
        setUserQueryResults: setQueryResults,
        clearUserQuery: clearQuery,
        clearUserQueries: clearQueries
    }
})

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

        dispatch(usersSlice.actions.makeUserQuery({ name: name }))
        return dispatch(makeTrackedRequest('GET', endpoint, null,
            function(response) {
                dispatch(usersSlice.actions.setUsersInDictionary({ dictionary: response.dictionary }))

                dispatch(usersSlice.actions.setUserQueryResults({ name: name, meta: response.meta, list: response.list }))

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
export const postUsers = function(user) {
    return function(dispatch, getState) {
        return dispatch(makeTrackedRequest('POST', '/users', user,
            function(response) {
                dispatch(usersSlice.actions.setUsersInDictionary({ entity: response.entity }))

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
        return dispatch(makeTrackedRequest('GET', `/user/${encodeURIComponent(id)}`, null,
            function(response) {
                dispatch(usersSlice.actions.setUsersInDictionary({ entity: response.entity }))

                dispatch(setRelationsInState(response.relations))

                dispatch(updateCurrentUser(response))
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
        return dispatch(makeTrackedRequest('PATCH', `/user/${encodeURIComponent(user.id)}`, user,
            function(response) {
                dispatch(usersSlice.actions.setUsersInDictionary({ entity: response.entity }))

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
        return dispatch(makeTrackedRequest('DELETE', `/user/${encodeURIComponent(user.id)}`, null,
            function(response) {
                dispatch(usersSlice.actions.removeUser({ entity: user }))
            }
        ))
    }
} 

export const { 
    setUsersInDictionary, removeUser, 
    makeUserQuery, setUserQueryResults, clearUserQuery
}  = usersSlice.actions

export default usersSlice.reducer
