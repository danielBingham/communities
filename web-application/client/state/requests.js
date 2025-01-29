import { createSlice } from '@reduxjs/toolkit'
import { v4 as uuidv4 } from 'uuid'

import RequestError from '/errors/RequestError'

import { 
    startRequestTracking, 
    recordRequestFailure, 
    recordRequestSuccess, 
    cleanupRequest as cleanupTrackedRequest } from './helpers/requestTracker'


export const requestsSlice = createSlice({
    name: 'requests',
    initialState: {
        /**
         * A dictionary of RequestTracker objects as returned by
         * RequestTracker.getRequestTracker, keyed by uuid requestIds.
         * 
         * @type {object}
         */
        requests: {},

        /**
         * A `user` object representing the currentUser.
         *
         * @type {object} 
         */
        currentUser: null
    },
    reducers: {
        // ========== Request Tracking Methods =============

        makeRequest: startRequestTracking, 
        failRequest: recordRequestFailure, 
        completeRequest: recordRequestSuccess,
        cleanupRequest: cleanupTrackedRequest
    }

})

/**
 * Make a request to an API endpoint.  Manages tracking the request, reusing
 * from the cache, and handling any errors.
 *  
 * Provides an `onSuccess` method, which will be called when the request
 * succeeds.  Errors are recorded on the request tracker object, which can be
 * retrieved from the provided Redux slice's `requests` dictionary using the
 * returned `requestId`.
 *
 * @param {string} method       The HTTP verb to use as the request method (eg.
 * GET, POST, etc)
 * @param {string} endpoint     The endpoint we want to make a request to.
 * @param {function} onSuccess  A function to be called with the response's
 * body, parsed from JSON to a js object.
 *
 * @return {uuid}   A requestId that can be used to retrieve the request
 * tracker from the `slice`.  It will be stored in the `requests` object keyed
 * by the `requestId`, and can be found at `state.<slice-name>.requests[requestId]`
 */
export const makeTrackedRequest = function(method, endpoint, body, onSuccess, onFailure) {
    return function(dispatch, getState) {
        const configuration = getState().system.configuration

        const requestId = uuidv4()
        let status = 0
        let responseOk = false

        const fetchOptions = {
            method: method,
            headers: {
                'Accept': 'application/json'
            }
        }
        if ((method == 'POST' || method == 'PUT' || method == 'PATCH') && body ) {
            if ( body instanceof FormData ) {
                fetchOptions.body = body
            } else {
                fetchOptions.body = JSON.stringify(body)
                fetchOptions.headers['Content-Type'] = 'application/json'
            }
        }

        let fullEndpoint = ''
        // System requestsSlice requests need to go to the root, rather than the API
        // backend.  These requests include querying for the configuration that
        // contains the API backend itself, as well as for feature flags.
        if ( requestsSlice.name == 'system') {
            fullEndpoint = endpoint
        } else if (configuration == null ) {
            // If we're querying from anything other than the system requestsSlice before
            // we've got our configuration, then we have an error.
            throw new Error('Attempting to query from the API before the configuration is set!')
        } else {
            fullEndpoint = configuration.backend + endpoint
        }

        dispatch(requestsSlice.actions.makeRequest({requestId: requestId, method: method, endpoint: endpoint}))
        fetch(fullEndpoint, fetchOptions).then(function(response) {
            status = response.status
           
            // If they've been logged out, send them to the home page, which will
            // let them log back in again.
            if ( status === 401 ) {
                window.location.href = "/"
            }

            responseOk = response.ok
            return response.json()
        }).then(function(responseBody) {
            // If the request doesn't exist, then bail out before completing
            // `onSuccess`.  This means it has already been cleaned up, and its
            // results are probably invalid.
            //
            // In any case, there's nothing to complete and nothing to fail.
            const state = getState()
            if( ! state[requestsSlice.name].requests[requestId] ) {
                return
            }

            if ( responseOk ) {
                if ( onSuccess ) {
                    try {
                        onSuccess(responseBody)
                    } catch (error) {
                        return Promise.reject(error)
                    }
                }
                dispatch(requestsSlice.actions.completeRequest({ requestId: requestId, status: status, result: responseBody }))
            } else {
                dispatch(requestsSlice.actions.failRequest({ requestId: requestId, status: status, error: responseBody.error, errorMessage: responseBody.message, errorData: responseBody.data }))
                if ( onFailure ) {
                    try {
                        onFailure(responseBody)
                    } catch (error) {
                        return Promise.reject(error)
                    }
                }
            }
        }).catch(function(error) {
            logger.error(error)
            dispatch(requestsSlice.actions.failRequest({ requestId: requestId, status: status, error: 'frontend-request-error' }))
        })

        return requestId
    }
}

export const { cleanupRequest} = requestsSlice.actions

export default requestsSlice.reducer
