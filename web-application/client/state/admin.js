import { createSlice } from '@reduxjs/toolkit'

import { makeRequest } from '/state/lib/makeRequest'


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
