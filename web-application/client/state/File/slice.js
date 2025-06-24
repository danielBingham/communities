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
    queries: {}

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
        resetFileSlice: () => initialState
    }
})

export const {  setFilesInDictionary, removeFile, resetFileSlice }  = FileSlice.actions

export default FileSlice.reducer
