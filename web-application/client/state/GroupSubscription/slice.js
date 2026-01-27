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

import {
    setInDictionary,
    removeEntity,
    setQueryResults,
    clearQuery,
    clearQueries
} from '/state/lib/slice'

const initialState = {
    /**
     * A dictionary of GroupSubscriptions we've retrieved from the backend, keyed by
     * groupSubscription.id.
     *
     * @type {object}
     */
    dictionary: {},

    /**
     *
     * An object containing queries made to query supporting endpoints.
     *
     * Structure:
     * {
     *  queryName: {
     *      meta: {
     *          page: <int>,
     *          count: <int>,
     *          pageSize: <int>,
     *          numberOfPages: <int>
     *      },
     *      list: [] 
     *  },
     *  ...
     * }
     */
    queries: {},

    byGroupId: {}
}

export const GroupSubscriptionSlice = createSlice({
    name: 'GroupSubscription',
    initialState: initialState,
    reducers: {
        setGroupSubscriptionsInDictionary: function(state, action) {
            setInDictionary(state, action)

            if ( 'dictionary' in action.payload ) {
                for(const [id, entity] of Object.entries(action.payload.dictionary)) {
                    state.byGroupId[entity.groupId] = entity
                }
            } else if ( 'entity' in action.payload ) {
                const entity = action.payload.entity
                state.byGroupId[entity.groupId] = entity
            }
        },
        removeGroupSubscription: function(state, action) {
            removeEntity(state, action)

            const entity = action.payload.entity
            delete state.byGroupId[entity.groupId]
        },
        setGroupSubscriptionQueryResults: setQueryResults,
        clearGroupSubscriptionQuery: clearQuery,
        clearGroupSubscriptionQueries: clearQueries,
        resetGroupSubscriptionSlice: () => initialState
    }
})

export const { 
    setGroupSubscriptionsInDictionary, removeGroupSubscription, 
    clearGroupSubscriptionQuery, setGroupSubscriptionQueryResults,
    clearGroupSubscriptionQueries, resetGroupSubscriptionSlice
} = GroupSubscriptionSlice.actions

export default GroupSubscriptionSlice.reducer
