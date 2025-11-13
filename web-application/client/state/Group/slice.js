import { createSlice } from '@reduxjs/toolkit'

import {
    setInDictionary,
    setNull,
    removeEntity,
    setQueryNull,
    setQueryResults,
    clearQuery,
    clearQueries
} from '/state/lib/slice'

const initialState = {
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
}

export const GroupSlice = createSlice({
    name: 'Group',
    initialState: initialState,
    reducers: {
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
        setGroupNull: (state, action) => {
            const id = action.payload

            if ( id in state.dictionary && state.dictionary[id] !== null ) {
                const entity = state.dictionary[id]
                state.bySlug[entity.slug] = null
            }

            setNull(state, action)
        },
        removeGroup: (state, action) => {
            removeEntity(state, action)

            delete state.bySlug[action.payload.entity.slug]
        },
        setGroupQueryNull: setQueryNull,
        setGroupQueryResults: setQueryResults,
        clearGroupQuery: clearQuery,
        clearGroupQueries: clearQueries,
        resetGroupSlice: () => initialState
    }
})

export const { 
    setGroupsInDictionary, setGroupNull, removeGroup, 
    clearGroupQuery, setGroupQueryResults, setGroupQueryNull,
    clearGroupQueries, resetGroupSlice
}  = GroupSlice.actions

export default GroupSlice.reducer
