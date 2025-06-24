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
}

export const PostReactionSlice = createSlice({
    name: 'PostReaction',
    initialState: initialState,
    reducers: {
        setPostReactionsInDictionary: setInDictionary,
        removePostReaction: removeEntity,
        setPostReactionQueryResults: setQueryResults,
        clearPostReactionQuery: clearQuery,
        clearPostReactionQueries: clearQueries,
        resetPostReactionSlice: () => initialState
    }
})

export const { 
    setPostReactionsInDictionary, removePostReaction, 
    clearPostReactionQuery, setPostReactionQueryResults,
    clearPostReactionQueries, resetPostReactionSlice
}  = PostReactionSlice.actions

export default PostReactionSlice.reducer
