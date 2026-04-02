import { createSlice } from '@reduxjs/toolkit'

import { makeRequest } from '/state/lib/makeRequest'

/***
 * System slice convers data essential for the admin to function and that must
 * be queried from the root, rather than the API, during admin setup.  All requests
 * from admin handlers go to the root rather than the API backend.
 */
const adminSlice = createSlice({
    name: 'admin',
    initialState: {
        stats: {}
    },
    reducers: {
        setStats: function(state, action) {
            state.stats = action.payload
        }

    }
})

export const getStats = function() {
    return function(dispatch, getState) {
        return dispatch(makeRequest('GET', '/admin/stats', null,
            function(response) {
                dispatch(adminSlice.actions.setStats(response))
            }
        ))
    }
}


export const { } = adminSlice.actions
export default adminSlice.reducer
