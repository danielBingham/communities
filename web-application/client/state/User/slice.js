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
         * A dictionary of users we've retrieved from the backend, keyed by
         * user.id.
         *
         * @type {object}
         */
        dictionary: {},

        /**
         *
         * An object containing queries made to query supporting endpoints.
         *
         * In this case: GET /users 
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

        byUsername: {}

}

export const UserSlice = createSlice({
    name: 'User',
    initialState: initialState,
    reducers: {
        setUsersInDictionary: (state, action) => {
            setInDictionary(state, action)
            
            if ( 'dictionary' in action.payload) {
                for(const [id, user] of Object.entries(action.payload.dictionary)) {
                    state.byUsername[user.username] = user
                }
            } else if ( 'entity' in action.payload ) {
                state.byUsername[action.payload.entity.username] = action.payload.entity
            }
        },
        removeUser: (state, action) => {
            removeEntity(state, action)

            delete state.byUsername[action.payload.entity.username]
        },
        setUserQueryResults: setQueryResults,
        clearUserQuery: clearQuery,
        clearUserQueries: clearQueries,
        resetUserSlice: function() {
            return initialState
        }

    }
})


export const { 
    setUsersInDictionary, removeUser, 
    setUserQueryResults, clearUserQuery,
    clearUserQueries, resetUserSlice
}  = UserSlice.actions

export default UserSlice.reducer
