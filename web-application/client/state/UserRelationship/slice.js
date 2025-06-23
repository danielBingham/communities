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
     * A dictionary of userRelationships we've retrieved from the backend, keyed by
     * user.id.
     *
     * @type {object}
     */
    dictionary: {},

    /**
     *
     * An object containing queries made to query supporting endpoints.
     *
     * In this case: GET /userRelationships 
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

    byUserId: {}
}
        

export const UserRelationshipSlice = createSlice({
    name: 'UserRelationship',
    initialState: initialState,
    reducers: {
        setUserRelationshipsInDictionary: function(state, action) {
            setInDictionary(state, action)

            if ( 'dictionary' in action.payload ) {
                for(const [id, entity] of Object.entries(action.payload.dictionary)) {
                    if ( entity.userId in state.byUserId ) {
                        state.byUserId[entity.userId][entity.relationId] = entity.id
                    } else {
                        state.byUserId[entity.userId] = {}
                        state.byUserId[entity.userId][entity.relationId] = entity.id
                    }

                    if ( entity.relationId in state.byUserId ) {
                        state.byUserId[entity.relationId][entity.userId] = entity.id
                    } else {
                        state.byUserId[entity.relationId] = {}
                        state.byUserId[entity.relationId][entity.userId] = entity.id
                    }
                }
            } else if ( 'entity' in action.payload ) {
                const entity = action.payload.entity
                if ( entity.userId in state.byUserId ) {
                    state.byUserId[entity.userId][entity.relationId] = entity.id
                } else {
                    state.byUserId[entity.userId] = {}
                    state.byUserId[entity.userId][entity.relationId] = entity.id
                }

                if ( entity.relationId in state.byUserId ) {
                    state.byUserId[entity.relationId][entity.userId] = entity.id
                } else {
                    state.byUserId[entity.relationId] = {}
                    state.byUserId[entity.relationId][entity.userId] = entity.id
                }
            }

        },
        removeUserRelationship: function(state, action) {
            removeEntity(state, action)

            const entity = action.payload.entity
            if ( entity.userId in state.byUserId ) {
                delete state.byUserId[entity.userId][entity.relationId]
            }
            if ( entity.relationId in state.byUserId ) {
                delete state.byUserId[entity.relationId][entity.userId]
            }
        },
        setUserRelationshipQueryResults: setQueryResults,
        clearUserRelationshipQuery: clearQuery,
        clearUserRelationshipQueries: clearQueries,
        resetUserRelationshipSlice: function() { 
            return initialState
        }
    }
})

export const { 
    setUserRelationshipsInDictionary, removeUserRelationship, 
    setUserRelationshipQueryResults, clearUserRelationshipQuery,
    clearUserRelationshipQueries, resetUserRelationshipSlice
}  = UserRelationshipSlice.actions

export default UserRelationshipSlice.reducer
