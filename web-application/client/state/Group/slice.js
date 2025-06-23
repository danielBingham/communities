import { createSlice } from '@reduxjs/toolkit'

import {
    setInDictionary,
    removeEntity,
    setQueryResults,
    clearQuery,
    clearQueries
} from '/state/lib/slice'

export const GroupSlice = createSlice({
    name: 'Group',
    initialState: {
        
        // ======== Standard State ============================================

        /**
         * A dictionary of groups we've retrieved from the backend, keyed by
         * group.id.
         *
         * @type {object}
         */
        dictionary: {},

        /**
         *
         * An object containing queries made to query supporting endpoints.
         *
         * In the case of groups: /groups, /group/:id/children, and
         * /group/:id/parents
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

        bySlug: {}
    },
    reducers: {
        // ======== State Manipulation Helpers ================================
        // @see ./helpers/state.js

        setGroupsInDictionary: (state, action) => {
            setInDictionary(state, action)

            if ( 'dictionary' in action.payload) {
                for(const [id, group] of Object.entries(action.payload.dictionary)) {
                    state.bySlug[group.slug] = group
                }
            } else if ( 'entity' in action.payload ) {
                state.bySlug[action.payload.entity.slug] = action.payload.entity
            }
        }, 
        removeGroup: (state, action) => {
            removeEntity(state, action)

            delete state.bySlug[action.payload.entity.slug]
        },
        setGroupQueryResults: setQueryResults,
        clearGroupQuery: clearQuery,
        clearGroupQueries: clearQueries
    }
})

export const { 
    setGroupsInDictionary, removeGroup, 
    clearGroupQuery, setGroupQueryResults,
    clearGroupQueries
}  = GroupSlice.actions

export default GroupSlice.reducer
