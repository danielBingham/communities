import { createSlice } from '@reduxjs/toolkit'

import {
    setInDictionary,
    removeEntity,
    setNull,
    setQueryResults,
    clearQuery,
    clearQueries
} from '/state/lib/slice'

const initialState = {
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
}

export const PostSubscriptionSlice = createSlice({
    name: 'PostSubscription',
    initialState: initialState,
    reducers: {
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
        setPostSubscriptionNull: function(state, action) {
            const id = action.payload

            if ( id in state.dictionary && state.dictionary[id] !== null ) {
                const entity = state.dictionary[id]
                state.byPostId[entity.postId] = null
            }

            setNull(state, action)

        },
        setPostSubscriptionNullByPostId: function(state, action) {
            const postId = action.payload

            state.byPostId[postId] = null
        },
        removePostSubscription: function(state, action) {
            removeEntity(state, action)

            const entity = action.payload.entity
            delete state.byPostId[entity.postId]
        },
        setPostSubscriptionQueryResults: setQueryResults,
        clearPostSubscriptionQuery: clearQuery,
        clearPostSubscriptionQueries: clearQueries,
        resetPostSubscriptionSlice: () => initialState
    }
})

export const { 
    setPostSubscriptionsInDictionary, removePostSubscription, 
    setPostSubscriptionNull, setPostSubscriptionNullByPostId,
    clearPostSubscriptionQuery, setPostSubscriptionQueryResults,
    clearPostSubscriptionQueries, resetPostSubscriptionSlice
} = PostSubscriptionSlice.actions

export default PostSubscriptionSlice.reducer
