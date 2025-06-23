import { createSlice } from '@reduxjs/toolkit'

import {
    setInDictionary,
    removeEntity,
    setQueryResults,
    clearQuery,
    clearQueries
} from '/state/lib/slice'

export const PostSubscriptionSlice = createSlice({
    name: 'PostSubscription',
    initialState: {
        
        // ======== Standard State ============================================

        /**
         * A dictionary of PostSubscriptions we've retrieved from the backend, keyed by
         * postSubscription.id.
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

        byPostId: {}

    },
    reducers: {
        // ======== State Manipulation Helpers ================================
        // @see ./lib/state.js

        setPostSubscriptionsInDictionary: function(state, action) {
            setInDictionary(state, action)

            if ( 'dictionary' in action.payload ) {
                for(const [id, entity] of Object.entries(action.payload.dictionary)) {
                    state.byPostId[entity.postId] = entity
                }
            } else if ( 'entity' in action.payload ) {
                const entity = action.payload.entity
                state.byPostId[entity.postId] = entity
            }
        },
        removePostSubscription: function(state, action) {
            removeEntity(state, action)

            const entity = action.payload.entity
            delete state.byPostId[entity.postId]
        },
        setPostSubscriptionQueryResults: setQueryResults,
        clearPostSubscriptionQuery: clearQuery,
        clearPostSubscriptionQueries: clearQueries,
    }
})

export const { 
    setPostSubscriptionsInDictionary, removePostSubscription, 
    clearPostSubscriptionQuery, setPostSubscriptionQueryResults,
    clearPostSubscriptionQueries
} = PostSubscriptionSlice.actions

export default PostSubscriptionSlice.reducer
