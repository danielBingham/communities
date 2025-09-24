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



/***
 * System slice convers data essential for the system to function and that must
 * be queried from the root, rather than the API, during system setup.  All requests
 * from system handlers go to the root rather than the API backend.
 */
const socketSlice = createSlice({
    name: 'socket',
    initialState: {
        isConnected: false,
        inProgress: false
    },
    reducers: {
        connect: (state, action) => {
            state.inProgress = true 
        },
        disconnect: (state, action) => {
            state.inProgress = true
        },
        open: (state, action) => { 
            state.isConnected = true 
            state.inProgress = false
        },
        close: (state, action) => { 
            state.isConnected = false 
            state.inProgress = false
        }
    }
})


export const { connect, disconnect, open, close } = socketSlice.actions
export default socketSlice.reducer
