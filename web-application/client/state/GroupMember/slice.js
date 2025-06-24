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
     * A dictionary of groupMembers we've retrieved from the backend, keyed by
     * group.id.
     *
     * @type {object}
     */
    dictionary: {},

    /**
     *
     * An object containing queries made to query supporting endpoints.
     *
     * In the case of groupMembers: /groupMembers, /group/:id/children, and
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

    byGroupAndUser: {}

}

export const GroupMemberSlice = createSlice({
    name: 'GroupMember',
    initialState: initialState,
    reducers: {
        setGroupMembersInDictionary: (state, action) => {
            setInDictionary(state, action)

            const setByGroupAndUser = (entity) => {
                if ( ! (entity.groupId in state.byGroupAndUser) ) {
                    state.byGroupAndUser[entity.groupId] = {}
                }
                state.byGroupAndUser[entity.groupId][entity.userId] = entity
            }

            if ( 'dictionary' in action.payload ) {
                for(const [id, entity] of Object.entries(action.payload.dictionary)) {
                    setByGroupAndUser(entity)
                }
            } else if ('entity' in action.payload ) {
                setByGroupAndUser(action.payload.entity)
            }
        },
        removeGroupMember: (state, action) => {
            removeEntity(state, action)

            delete state.byGroupAndUser[action.payload.entity.groupId][action.payload.entity.userId]
        },
        setGroupMemberQueryResults: setQueryResults,
        clearGroupMemberQuery: clearQuery,
        clearGroupMemberQueries: clearQueries,
        resetGroupMemberSlice: () => initialState
    }
})

export const { 
    setGroupMembersInDictionary, removeGroupMember, 
    clearGroupMemberQuery, setGroupMemberQueryResults,
    clearGroupMemberQueries, resetGroupMemberSlice
}  = GroupMemberSlice.actions

export default GroupMemberSlice.reducer
