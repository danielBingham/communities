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
    shouldQuery: {},

    byGroupAndUser: {}

}

export const GroupMemberSlice = createSlice({
    name: 'GroupMember',
    initialState: initialState,
    reducers: {
        setGroupMembersInDictionary: (state, action) => {
            // Utilty to manage the map.
            const setByGroupAndUser = (entity) => {
                if ( ! (entity.groupId in state.byGroupAndUser) ) {
                    state.byGroupAndUser[entity.groupId] = {}
                }
                state.byGroupAndUser[entity.groupId][entity.userId] = entity
            }

            if ( 'dictionary' in action.payload ) {
                setInDictionary(state, action)
                for(const [id, entity] of Object.entries(action.payload.dictionary)) {
                    if ( entity !== null ) {
                        setByGroupAndUser(entity)
                    }
                }
            } else if ('entity' in action.payload ) {
                setInDictionary(state, action)
                setByGroupAndUser(action.payload.entity)
            }
        },
        setGroupMembersNull : (state, action) => {
            const payload = action.payload

            if ( 'groupId' in payload && 'userId' in payload ) {
                if ( ! (payload.groupId in state.byGroupAndUser ) ) {
                    state.byGroupAndUser[payload.groupId] = {}
                }
                state.byGroupAndUser[payload.groupId][payload.userId] = null
            } else {
                setNull(state, action)
            }
        },
        removeGroupMember: (state, action) => {
            removeEntity(state, action)

            delete state.byGroupAndUser[action.payload.entity.groupId][action.payload.entity.userId]
        },
        setGroupMemberShouldQuery: (state, action) => {
            state.shouldQuery[action.payload.name] = action.payload.value
        },
        setGroupMemberQueryResults: setQueryResults,
        setGroupMemberQueryNull: (state, action) => {
            setQueryNull(state, action)
        },
        clearGroupMemberQuery: clearQuery,
        clearGroupMemberQueries: clearQueries,
        resetGroupMemberSlice: () => initialState
    }
})

export const { 
    setGroupMembersInDictionary, setGroupMembersNull, removeGroupMember, 
    setGroupMemberShouldQuery, clearGroupMemberQuery, setGroupMemberQueryResults, setGroupMemberQueryNull,
    clearGroupMemberQueries, resetGroupMemberSlice
}  = GroupMemberSlice.actions

export default GroupMemberSlice.reducer
