import { createSlice } from '@reduxjs/toolkit'

import {
    setInDictionary,
    removeEntity,
    setQueryResults,
    clearQuery,
    clearQueries
} from '/state/lib/slice'

export const PostReactionSlice = createSlice({
    name: 'PostReaction',
    initialState: {
        
        // ======== Standard State ============================================

        /**
         * A dictionary of PostReaction we've retrieved from the backend, keyed by
         * post.id.
         *
         * @type {object}
         */
        dictionary: {},

        /**
         *
         * An object containing queries made to query supporting endpoints.
         *
         * In the case of PostReaction: /PostReaction, /post/:id/children, and
         * /post/:id/parents
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
        queries: {}

    },
    reducers: {
        setPostReactionsInDictionary: setInDictionary,
        removePostReaction: removeEntity,
        setPostReactionQueryResults: setQueryResults,
        clearPostReactionQuery: clearQuery,
        clearPostReactionQueries: clearQueries
    }
})

export const { 
    setPostReactionsInDictionary, removePostReaction, 
    clearPostReactionQuery, setPostReactionQueryResults,
    clearPostReactionQueries
}  = PostReactionSlice.actions

export default PostReactionSlice.reducer
