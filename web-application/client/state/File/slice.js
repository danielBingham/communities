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
        resetFileSlice: (state, action) => {
            // Make sure we revoke all the URLs in the cache so that we
            // don't leak memory.
            for(const [fileId, widths] of Object.entries(state.cache)) {
                for(const [width, url] of Object.entries(widths)) {
                    URL.revokeObjectURL(url)
                }
            }

            return initialState
        },

        setInCache: (state, action ) => {
            const fileId = action.payload.fileId
            const width = action.payload.width

            if ( ! ( fileId in state.cache) ) {
                state.cache[fileId] = {}
            }

            const objectURL = action.payload.objectURL

            if ( width ) {
                state.cache[fileId][width] = objectURL
            } else {
                state.cache[fileId]['full'] = objectURL
            }
        },

        removeFromCache: (state, action) => {
            const fileId = action.payload.fileId


            if ( fileId in state.cache ) {
                for(const [width, url] of Object.entries(state.cache[fileId]) ) {
                    URL.revokeObjectURL(url)
                }
                delete state.cache[fileId]
            }
        }
    }
})

export const {  setFilesInDictionary, removeFile, resetFileSlice, setInCache, removeFromCache }  = FileSlice.actions

export default FileSlice.reducer
