import { createSlice } from '@reduxjs/toolkit'
import * as qs from 'qs'

import { makeTrackedRequest } from '/lib/state/request'

import { setSession } from '/state/authentication'

export const tokenSlice = createSlice({
    name: 'token',
    initialState: {
        usersByToken: {}
    },
    reducers: {
        setUserForToken(state, action) {
            state.usersByToken[action.payload.token] = action.payload.user
        }
    }

})

export const validateToken = function(token, type) {
    return function(dispatch, getState) {
        const queryString = qs.stringify({type: type}) 
        const endpoint = `/token/${token}?${queryString}`

        return dispatch(makeTrackedRequest('GET', endpoint, null,
            function(responseBody) {
                if ( responseBody.session ) {
                    dispatch(tokenSlice.actions.setUserForToken({ token: token, user: responseBody.session.user }))
                    dispatch(setSession(responseBody.session))
                } else {
                    dispatch(tokenSlice.actions.setUserForToken({ token: token, user: responseBody.user }))
                }
            }
        ))
    }
}

export const createToken = function(params) {
    return function(dispatch, getState) {
        const endpoint = `/tokens`
        return dispatch(makeTrackedRequest('POST', endpoint, params,
            function(responseBody) { }
        ))
    }
}

export const { cleanupRequest} = tokenSlice.actions

export default tokenSlice.reducer
