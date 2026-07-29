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
        const body = {
            token: token,
            type: type
        }

        return dispatch(makeRequest('PATCH', '/tokens', body,
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
