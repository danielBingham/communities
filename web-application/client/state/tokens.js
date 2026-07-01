import { createSlice } from '@reduxjs/toolkit'
import * as qs from 'qs'

import { makeRequest } from '/state/lib/makeRequest'

import { setSession } from '/state/authentication'

export const tokenSlice = createSlice({
    name: 'token',
    initialState: {
        userIdsByToken: {}
    },
    reducers: {
        setUserForToken(state, action) {
            state.userIdsByToken[action.payload.token] = action.payload.userId
        }
    }

})

export const validateToken = function(token, type) {
    return function(dispatch, getState) {
        const queryString = qs.stringify({type: type}) 
        const endpoint = `/token/${token}?${queryString}`

        return dispatch(makeRequest('GET', endpoint, null,
            function(responseBody) {
                if ( responseBody.session ) {
                    dispatch(tokenSlice.actions.setUserForToken({ token: token, userId: responseBody.session.user.id}))
                    dispatch(setSession(responseBody.session))
                } else {
                    dispatch(tokenSlice.actions.setUserForToken({ token: token, userId: responseBody.userId }))
                }
            }
        ))
    }
}

export const createToken = function(params) {
    return function(dispatch, getState) {
        const endpoint = `/tokens`
        return dispatch(makeRequest('POST', endpoint, params,
            function(responseBody) { }
        ))
    }
}

export default tokenSlice.reducer
