import { createSlice } from '@reduxjs/toolkit'

import { makeRequest } from '/state/lib/makeRequest'

export const jobsSlice = createSlice({
    name: 'jobs',
    initialState: {
        /**
         * A dictionary of job keyed by the job's name.
         */
        dictionary: {}
    },
    reducers: {

        /**
         * Replace the whole dictionary.  
         *
         * @param {Object}  state   The redux state slice.
         * @param {Object}  action  The redux action.
         * @param {Object}  action.payload  The dictionary of jobs we got
         * from the backend.
         */ 
        setDictionary: function(state, action) {
            state.dictionary = action.payload
        },

        /**
         * Set a single item in the dictionary.
         *
         * @param {Object}  state   The redux state slice.
         * @param {Object}  action  The redux action.
         * @param {Object}  action.payload  The job object to add to the
         * dictionary, overriding any set on its `name` key.
         */
        setInDictionary: function(state, action) {
            state.dictionary[action.payload.name] = action.payload
        }
    }

})

/**
 * GET /jobs
 *
 * Get a dictionary containing all the jobs visible to this user.  Fully
 * popoulates state.jobs.dictionary
 *
 * @returns {string}    A uuid requestId that can be used to track this
 * request.
 */
export const getJobs = function() {
    return function(dispatch, getState) {
        const endpoint = '/jobs'

        return dispatch(makeRequest('GET', endpoint, null,
            function(responseBody) {
                dispatch(jobsSlice.actions.setDictionary(responseBody))
            }
        ))
    }
}

/**
 * POST /jobs
 *
 * Trigger a job.
 *
 * @param {string} name The name of the job we want to trigger. 
 * @param {object} data The data needed for this job.
 *
 * @returns {string}    A uuid requestId that can be used to track this
 * request.
 */
export const postJobs = function(name, data) {
    return function(dispatch, getState) {
        const endpoint = '/jobs'

        return dispatch(makeRequest('POST', endpoint, { name: name, data: data },
            function(responseBody) {
                dispatch(jobsSlice.actions.setInDictionary(responseBody))
            }
        ))
    }
}

/**
 * GET /job/:id
 *
 * Get a job.
 *
 * @see client/state/helpers/requestTracker.js
 *
 * @param {int} id  The entity id of the job we want to retrieve.
 *
 * @returns {string}    A uuid requestId that can be used to track this
 * request.
 */
export const getJob = function(id) {
    return function(dispatch, getState) {
        const endpoint = `/job/${encodeUriComponent(id)}`

        return dispatch(makeRequest('GET', endpoint, null,
            function(responseBody) {
                dispatch(jobsSlice.actions.setInDictionary(responseBody))
            }
        ))
    }
}

export default jobsSlice.reducer
