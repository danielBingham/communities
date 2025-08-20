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

const eventsSlice = createSlice({
    name: 'events',
    initialState: {
        subscriptions: [],
        pendingSubscriptions: [],
        pendingUnsubscriptions: []
    },
    reducers: {
        subscribe: function(state, action) {
            const subscription = action.payload
            state.pendingSubscriptions.push(subscription)
        },
        unsubscribe: function(state, action) {
            const subscription = action.payload
            state.pendingUnsubscriptions.push(subscription)
        },
        confirmSubscription: function(state, action) {
            const subscription = action.payload
            state.pendingSubscriptions = state.pendingSubscriptions.filter((s) => s.entity === subscription.entity && s.action === subscription.action)
            state.subscriptions.push(subscription)
        },
        confirmUnsubscription: function(state, action) {
            state.pendingUnsubscriptions = state.pendingSubscriptions.filter((s) => s.entity === subscription.entity && s.action === subscription.action)
            state.subscriptions = state.subscriptions.filter((s) => s.entity === subscription.entity && s.action === subscription.action)
        },
        clearSubscriptions: function(state, action) {
            state.subscriptions = []
            state.pendingSubscriptions = []
            state.pendingUnsubscriptions = []
        }
    }
})

export const { subscribe, unsubscribe, confirmSubscription, confirmUnsubscription, clearSubscriptions } = eventsSlice.actions
export default eventsSlice.reducer
