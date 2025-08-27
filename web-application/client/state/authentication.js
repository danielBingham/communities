import { createSlice } from '@reduxjs/toolkit'

import { makeRequest } from '/state/lib/makeRequest'

import { reset } from '/state/system'
import { setUsersInDictionary } from '/state/User'
import { setFilesInDictionary } from '/state/File'

export const authenticationSlice = createSlice({
    name: 'authentication',
    initialState: {
        /**
         * A `user` object representing the currentUser.
         *
         * @type {object} 
         */
        currentUser: null,

        device: null
    },
    reducers: {

        setCurrentUser: function(state, action) {
            state.currentUser = action.payload
        },

        setDevice: function(state, action) {
            state.device = action.payload
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
        return dispatch(makeRequest('GET', endpoint, null,
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

        return dispatch(makeRequest('POST', endpoint, body,
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

        return dispatch(makeRequest('DELETE', endpoint, null,
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

export const postDevice = function(deviceInfo) {
    return function(dispatch, getState) {
        const endpoint = '/device'

        return dispatch(makeRequest('POST', endpoint, deviceInfo,
            function(responseBody) {
                dispatch(authenticationSlice.actions.setDevice(responseBody.entity))
            }))
    }
}

export const patchDevice = function(deviceInfo) {
    return function(dispatch, getState) {
        const endpoint = '/device'

        return dispatch(makeRequest('PATCH', endpoint, deviceInfo,
            function(responseBody) {
                dispatch(authenticationSlice.actions.setDevice(responseBody.entity))
            }))
    }
}

export const { setCurrentUser, setNotificationPermissions } = authenticationSlice.actions

export default authenticationSlice.reducer
