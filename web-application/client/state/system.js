import { createSlice } from '@reduxjs/toolkit'

import { makeRequest } from '/state/lib/makeRequest'

/***
 * System slice convers data essential for the system to function and that must
 * be queried from the root, rather than the API, during system setup.  All requests
 * from system handlers go to the root rather than the API backend.
 */
const systemSlice = createSlice({
    name: 'system',
    initialState: {
        requests: {},
        configuration: null,
        features: {}
    },
    reducers: {
        reset: function(state, action) { },

        setConfiguration: function(state, action) {
            state.configuration = action.payload 
        },

        setFeatures: function(state, action) {
            state.features = action.payload
        }
    }
})

/**
 * GET /config
 *
 * Get the configuration from the backend.
 *
 * Makes the request async and returns an id that can be used to track the
 * request and get the results of a completed request from this state slice.
 *
 * @returns {string} A uuid requestId that can be used to track this request.
 */
export const getConfiguration = function() {
    return function(dispatch, getState) {
        return dispatch(makeRequest('GET', '/config', null,
            function(config) {
                dispatch(systemSlice.actions.setFeatures(config.features))
                delete config.features
                dispatch(systemSlice.actions.setConfiguration(config))
            }
        ))
    }
}


export const { reset, setConfiguration, setFeatures } = systemSlice.actions
export default systemSlice.reducer
