import { createSlice } from '@reduxjs/toolkit'

import { makeTrackedRequest } from '/lib/state/request'

import { reset } from '/state/system'
import { setUsersInDictionary } from '/state/users'
import { setFilesInDictionary } from '/state/files'

export const authenticationSlice = createSlice({
    name: 'authentication',
    initialState: {
        /**
         * A `user` object representing the currentUser.
         *
         * @type {object} 
         */
        currentUser: null
    },
    reducers: {

        setCurrentUser: function(state, action) {
            state.currentUser = action.payload
        }
    }

})

export const setSession = function(session) {
    return function(dispatch, getState) {
        dispatch(authenticationSlice.actions.setCurrentUser(session.user))
        dispatch(setUsersInDictionary({ entity: session.user }))

        if ( session.file ) {
            dispatch(setFilesInDictionary({ entity: session.file }))
        }
    }
}

/**
 * Call getAuthentication and cleanup the created request as soon as it
 * returns.  
 *
 * Use this to refresh authentication in contexts where we don't need to track
 * the request.
 */
export const refreshAuthentication = function() {
    return function(dispatch, getState) {
        dispatch(getAuthentication())
    }
}

/**
 * GET /authentication
 *
 * Retrieve the currently authenticated user from the backend's session.
 *
 * Makes the request async and returns an id that can be used to track the
 * request and get the results of a completed request from this state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getAuthentication = function() {
    return function(dispatch, getState) {
        const endpoint = '/authentication'
        return dispatch(makeTrackedRequest('GET', endpoint, null,
            function(responseBody ) {
                if ( responseBody && responseBody.session !== null) {
                    dispatch(setSession(responseBody.session))
                } else {
                    dispatch(authenticationSlice.actions.setCurrentUser(null))
                }
            }
        ))
    }
}

/**
 * POST /authentication
 *
 * Attempt to authenticate a user with the backend, starting the user's session on success.
 *
 * Makes the request async and returns an id that can be used to track the
 * request and get the results of a completed request from this state slice.
 *
 * @param {string} email - The email of the user we'd like to authenticate.
 * @param {string} password - Their password.
 *
 * @returns {string} A uuid requestId we can use to track this request.
 */
export const postAuthentication = function(email, password) {
    return function(dispatch, getState) {
        const endpoint = '/authentication'
        const body = {
            email: email,
            password: password
        }

        return dispatch(makeTrackedRequest('POST', endpoint, body,
            function(responseBody) {
                if ( responseBody && responseBody.session !== null) {
                    dispatch(setSession(responseBody.session))
                } else {
                    dispatch(authenticationSlice.actions.setCurrentUser(null))
                }
            }
        ))
    }
}

/**
 * PATCH /authentication
 *
 * Check a user's credentials, with out modifying the session.  Does retrieve
 * the user (on authentication) and store them the result. 
 *
 * Makes the request async and returns an id that can be used to track the
 * request and get the results of a completed request from this state slice.
 *
 * @param {string} email - The email of the user we'd like to authenticate.
 * @param {string} password - Their password.
 *
 * @returns {string} A uuid requestId we can use to track this request.
 */
export const patchAuthentication = function(email, password) {
    return function(dispatch, getState) {
       const endpoint = '/authentication'
        const body = {
            email: email,
            password: password
        }
        return dispatch(makeTrackedRequest('PATCH', endpoint, body, 
            function(responseBody) {
                dispatch(setUsersInDictionary({ entity: responseBody.user }))  
            }
        ))
    }
}

/**
 * DELETE /authentication
 *
 * Attempt to logout the current user from the backend, destroying their
 * session on the backend before destroying it on the frontend.
 *
 * Makes the request async and returns an id that can be used to track the
 * request and get the results of a completed request from this state slice.
 *
 * @returns {string} A uuid requestId that we can use to track this request.
 */
export const deleteAuthentication = function() {
    return function(dispatch, getState) {
        const endpoint = '/authentication'

        return dispatch(makeTrackedRequest('DELETE', endpoint, null,
            function(responseBody) {
                dispatch(reset())
                // As soon as we reset the redux store, we need to redirect to
                // the home page.  We don't want to go through anymore render
                // cycles because that could have undefined impacts.
                window.location.href = "/"
            }
        ))
    }
}

export const { setCurrentUser } = authenticationSlice.actions

export default authenticationSlice.reducer
