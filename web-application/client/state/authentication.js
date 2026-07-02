/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
import { createSlice } from '@reduxjs/toolkit'

import { Capacitor } from '@capacitor/core'
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin'

import { isLocalStorageAvailable } from '/lib/localStorage'
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

        pendingUserId: null,

        device: null,

        multifactorSecret: null,

        multifactorRecoveryCodes: null
    },
    reducers: {

        setCurrentUser: function(state, action) {
            state.currentUser = action.payload
        },

        setPendingUserId: function(state, action) {
            state.pendingUserId = action.payload
        },

        setDevice: function(state, action) {
            state.device = action.payload
        },

        setMultifactorSecret: function(state, action) {
            state.multifactorSecret = action.payload
        },

        clearMultifactorSecret: function(state, action) {
            state.multifactorSecret = null
        },

        setMultifactorRecoveryCodes: function(state, action) {
            state.multifactorRecoveryCodes= action.payload
        },

        clearMultifactorRecoveryCodes: function(state, action) {
            state.multifactorRecoveryCodes = null
        }
    }

})

export const setSession = function(session) {
    return function(dispatch, getState) {
        if ( 'user' in session ) {
            dispatch(authenticationSlice.actions.setCurrentUser(session.user))
            dispatch(setUsersInDictionary({ entity: session.user }))

            if ( session.file ) {
                dispatch(setFilesInDictionary({ entity: session.file }))
            }
        } else if ( 'pendingUserId' in session ) {
            dispatch(authenticationSlice.actions.setPendingUserId(session.pendingUserId))
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
 * PATCH /authentication
 *
 * Verify a user's authentication by providing an MFA TOPT.
 *
 * Makes the request async and returns an id that can be used to track the
 * request and get the results of a completed request from this state slice.
 *
 * @param {string} email - The email of the user we'd like to authenticate.
 * @param {string} password - Their password.
 *
 * @returns {string} A uuid requestId we can use to track this request.
 */
export const patchAuthentication = function(token, recoveryCode) {
    return function(dispatch, getState) {
        const endpoint = '/authentication'
        const body = {}

        if ( token !== undefined && token !== null) {
            body.token = token
        } else if ( recoveryCode !== undefined && recoveryCode !== null) {
            body.recoveryCode = recoveryCode
        }

        return dispatch(makeRequest('PATCH', endpoint, body,
            function(responseBody) {
                if ( responseBody && responseBody.session !== null) {
                    dispatch(setSession(responseBody.session))
                } else {
                    dispatch(authenticationSlice.actions.setCurrentUser(null))
                }

                if ( responseBody && ( 'codes' in responseBody) ) {
                    dispatch(authenticationSlice.actions.setMultifactorRecoveryCodes(responseBody.codes))
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
                if ( Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android' ) {
                    SecureStoragePlugin.clear().then(function() {
                        if ( isLocalStorageAvailable() ) {
                            // Clear local storage so their drafts don't carry over to another
                            // login session.
                            localStorage.clear()
                        }

                        dispatch(reset())

                        // As soon as we reset the redux store, we need to redirect to
                        // the home page.  We don't want to go through anymore render
                        // cycles because that could have undefined impacts.
                        window.location.href = "/"
                    })
                } else {
                    if ( isLocalStorageAvailable() ) {
                        // Clear local storage so their drafts don't carry over to another
                        // login session.
                        localStorage.clear()
                    }

                    dispatch(reset())

                    // As soon as we reset the redux store, we need to redirect to
                    // the home page.  We don't want to go through anymore render
                    // cycles because that could have undefined impacts.
                    window.location.href = "/"
                }
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

export const { setCurrentUser, setNotificationPermissions, setMultifactorSecret, clearMultifactorSecret, clearMultifactorRecoveryCodes } = authenticationSlice.actions

export default authenticationSlice.reducer
