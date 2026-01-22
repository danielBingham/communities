import { createSlice } from '@reduxjs/toolkit'

import {
    setInDictionary,
    removeEntity,
    setNull
} from '/state/lib/slice'

import { makeRequest } from '/state/lib/makeRequest'

export const jobsSlice = createSlice({
    name: 'jobs',
    initialState: {
        /**
         * A dictionary of job keyed by the job's id.
         */
        dictionary: { 
            'process-video': {},
            'resize-image': {},
            'send-notifications': {}
        }
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
        setJobsInDictionary: (state, action) => {
            const name = action.payload.name
            if ( ! (name in state.dictionary ) ) {
                throw new Error(`Invalid queue: ${name}.`)
            }

            if ( 'dictionary' in action.payload && action.payload.dictionary !== undefined) {
                state.dictionary[name] = { ...state.dictionary, ...action.payload.dictionary }
            } else if( 'entity' in action.payload && action.payload.entity !== undefined) {
                const entity = action.payload.entity
                state.dictionary[name][entity.id] = entity 
            } else {
                console.log(action)
                throw new Error(`Invalid payload sent to ${action.type}.`)
            }

        },
        removeJob: (state, action) => {
            const name = action.payload.name
            if ( ! (name in state.dictionary ) ) {
                throw new Error(`Invalid queue: ${name}.`)
            }

            const entity = action.payload.entity
            delete state.dictionary[entity.id]
        },
        setJobNull: (state, action) => {
            const name = action.payload.name
            if ( ! (name in state.dictionary ) ) {
                throw new Error(`Invalid queue: ${name}.`)
            }

            state.dictionary[name][action.payload.id] = null

        }
    }

})

export const handleJobEvent = function(event) {
    return function(dispatch, getState) {
        if ( event.action === 'update' ) {
            console.log(`Job event: `, event)
            if ( 'entity' in event.context ) {
                dispatch(jobsSlice.actions.setJobsInDictionary({ name: event.context.queue, entity: event.context.entity }))
            } else if ( 'dictionary' in event.context ) {
                dispatch(jobsSlice.actions.setJobsInDictionary({ name: event.context.queue, dictionary: event.context.dictionary }))
            }
        }
    }
}


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
    throw new Error('Not implemented.')
    /*return function(dispatch, getState) {
        const endpoint = '/jobs'

        return dispatch(makeRequest('GET', endpoint, null,
            function(responseBody) {
                dispatch(jobsSlice.actions.setJobsInDictionary({ dictionary: responseBody }))
            }
        ))
    }*/
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
export const getJob = function(name, id) {
    return function(dispatch, getState) {
        const endpoint = `/queue/${encodeURIComponent(name)}/job/${encodeURIComponent(id)}`

        return dispatch(makeRequest('GET', endpoint, null,
            function(responseBody) {
                dispatch(jobsSlice.actions.setJobsInDictionary({ name: name, entity: responseBody }))
            },
            function(status, response) {
                dispatch(jobsSlice.actions.setJobNull({ name: name, id: id }))
            }
        ))
    }
}

export const { setJobsInDictionary, removeJob } = jobsSlice.actions
export default jobsSlice.reducer
