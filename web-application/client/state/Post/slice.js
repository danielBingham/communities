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
     * A dictionary of Post we've retrieved from the backend, keyed by
     * post.id.
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

    drafts: {},
}

export const PostSlice = createSlice({
    name: 'Post',
    initialState: initialState,
    reducers: {
        setPostsInDictionary: setInDictionary, 
        removePost: removeEntity,
        setPostQueryResults: setQueryResults,
        clearPostQuery: clearQuery,
        clearPostQueries: clearQueries,
        resetPostSlice: () => initialState,

        setDraft: function(state, action) {
            state.drafts[action.payload.key] = action.payload.draft
        },

        clearDraft: function(state, action) {
            delete state.drafts[action.payload.key]
        }
    }
})

export const { 
    setPostsInDictionary, removePost, 
    clearPostQuery, setPostQueryResults,
    clearPostQueries, resetPostSlice,
    setDraft, clearDraft,
} = PostSlice.actions

export default PostSlice.reducer
