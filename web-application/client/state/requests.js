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

import * as Uuid from 'uuid'

import logger from '/logger'

const requestsSlice = createSlice({
    name: 'requests',
    initialState: {
        dictionary: {}
    },
    reducers: {
        setInDictionary: (state, action) => {
            state.dictionary[action.payload.id] = action.payload
        },
        removeRequest: (state, action) => {
            if ( action.payload.id in state.dictionary ) {
                delete state.dictionary[action.payload.id]
            }
        }

    }
})

const createRequest = function() {
    return {
        id: Uuid.v4(),
        state: 'pending',
        request: null,
        response: null,
        error: null
    }
}

export const makePersistedRequest = function(reduxThunk) {
    return function(dispatch, getState) {
        const request = createRequest()
        dispatch(requestsSlice.actions.setInDictionary(request))


        const [promise, controller] = dispatch(reduxThunk)
        promise
            .then((result) => {
                const newRequest = { ...request }
                newRequest.state = result.success ? 'fulfilled': 'failed'
                newRequest.request = result.request
                newRequest.response = result.response
                newRequest.error = result.error
                dispatch(requestsSlice.actions.setInDictionary(newRequest))
            })
            .catch((error) => {
                logger.error(`Request error: `, error)
                const newRequest = { ...request }
                newRequest.state = 'failed'
                newRequest.request = {}
                newRequest.response = {}
                newRequest.error = {
                    type: 'unknown',
                    message: 'Unhandled request error.'
                }
                dispatch(requestsSlice.actions.setInDictionary(newRequest))
            })

        return request.id
    }
}


export const {  setInDictionary, removeRequest } = requestsSlice.actions
export default requestsSlice.reducer
