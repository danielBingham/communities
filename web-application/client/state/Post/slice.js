import { createSlice } from '@reduxjs/toolkit'

import {
    setInDictionary,
    removeEntity,
    setQueryResults,
    clearQuery,
    clearQueries
} from '/state/lib/slice'

export const PostSlice = createSlice({
    name: 'Post',
    initialState: {
        
        // ======== Standard State ============================================

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

        /**
         * Posts which are currently being edited.
         *
         * {
         *   [ postId ]: boolean
         * }
         *   
         **/
        editing: {},

        drafts: {},

        /**
         * The id of a post we are actively sharing.
         */
        sharingPost: null
    },
    reducers: {
        // ======== State Manipulation Helpers ================================
        // @see ./helpers/state.js

        setPostsInDictionary: setInDictionary, 
        removePost: removeEntity,
        setPostQueryResults: setQueryResults,
        clearPostQuery: clearQuery,
        clearPostQueries: clearQueries,

        clearInProgress: function(state, action) {
            state.inProgress = null
        },

        startPostEdit: function(state, action) {
            const postId = action.payload
            state.editing[postId] = true
        },

        finishPostEdit: function(state, action) {
            const postId = action.payload
            delete state.editing[postId]
        },

        setDraft: function(state, action) {
            state.drafts[action.payload.id] = action.payload.draft
        },

        clearDraft: function(state, action) {
            delete state.drafts[action.payload.id]
        },

        setSharingPost: function(state, action) {
            state.sharingPost = action.payload
        },

        clearSharingPost: function(state, action) {
            state.sharingPost = null
        }
    }
})

export const { 
    setPostsInDictionary, removePost, 
    clearPostQuery, setPostQueryResults,
    clearPostQueries,
    startPostEdit, finishPostEdit,
    setDraft, clearDraft,
    setSharingPost, clearSharingPost
} = PostSlice.actions

export default PostSlice.reducer
