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
     * A dictionary of posts we've retrieved from the backend, keyed by
     * post.id.
     *
     * @type {object}
     */
    dictionary: {},

    /**
     *
     * An object containing queries made to query supporting endpoints.
     *
     * In the case of posts: /posts, /post/:id/children, and
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
    queries: {},

    cache: {}

}

export const FileSlice = createSlice({
    name: 'File',
    initialState: initialState,
    reducers: {

        // ======== State Manipulation Helpers ================================
        // @see ./helpers/state.js

        setFilesInDictionary: setInDictionary,
        removeFile: removeEntity,
        setFileQueryResults: setQueryResults,
        clearFileQuery: clearQuery,
        clearFileQueries: clearQueries,
        resetFileSlice: () => initialState,

        setInCache: function(state, action ) {
            const url = action.payload.url
            const objectUrl = action.payload.objectUrl

            state.cache[url] = objectUrl 
        }
    }
})

export const {  setFilesInDictionary, removeFile, resetFileSlice, setInCache }  = FileSlice.actions

export default FileSlice.reducer
