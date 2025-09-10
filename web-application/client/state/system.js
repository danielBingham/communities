import { createSlice } from '@reduxjs/toolkit'

import { makeRequest } from '/state/lib/makeRequest'

let host = document.querySelector('meta[name="communities-host"]').content

let apiPath = document.querySelector('meta[name="communities-api"]').content
if ( ! apiPath.endsWith('/') ) {
    apiPath = apiPath + '/'
}

let api = new URL(apiPath, host).href


/***
 * System slice convers data essential for the system to function and that must
 * be queried from the root, rather than the API, during system setup.  All requests
 * from system handlers go to the root rather than the API backend.
 */
const systemSlice = createSlice({
    name: 'system',
    initialState: {
        host: host,
        api: api,
        csrf: null,
        configuration: null,
        features: {},
        clientVersion: null,
        serverVersion: null
    },
    reducers: {
        reset: function(state, action) { },

        setHost: function(state, action) {
            state.host = action.payload
        },

        setAPI: function(state, action) {
            state.api = action.payload
        },

        setCSRF: function(state, action) {
            state.csrf = action.payload
        },

        setConfiguration: function(state, action) {
            state.configuration = action.payload 
        },

        setFeatures: function(state, action) {
            state.features = action.payload
        },

        setClientVersion: function(state, action) {
            state.clientVersion = action.payload
        },

        setServerVersion: function(state, action) {
            state.serverVersion = action.payload
        }
    }
})

export const getVersion = function() {
    return function(dispatch, getState) {
        return dispatch(makeRequest('GET', '/system/version', null,
            function(response) {
                dispatch(systemSlice.actions.setServerVersion(response.version))
            }
        ))
    }
}

/**
 * GET /initialization
 *
 * Initialize the current session.
 */
export const getInitialization = function() {
    return function(dispatch, getState) {
        return dispatch(makeRequest('GET', '/system/initialization', null,
            function(responseBody) {
                dispatch(systemSlice.actions.setClientVersion(responseBody.version))
                dispatch(systemSlice.actions.setServerVersion(responseBody.version))
                dispatch(systemSlice.actions.setCSRF(responseBody.csrf))
                dispatch(systemSlice.actions.setFeatures(responseBody.features))
                dispatch(systemSlice.actions.setConfiguration(responseBody.config))
            }
        ))
    }
}


export const { reset, setHost, setAPI, setConfiguration, setFeatures } = systemSlice.actions
export default systemSlice.reducer
