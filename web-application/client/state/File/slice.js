/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
import { createSlice } from '@reduxjs/toolkit'

import logger from '/logger'

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

    /**
     * Signed links to each file, by file id, then variant ('full' or a
     * width). A file that couldn't be found is null; a variant that couldn't
     * be, null within it.
     */
    sources: {},

    /**
     * When to replace each link in `sources`, in milliseconds, with the same
     * keys. A link without one is kept. See ./sourceRefresh.js.
     */
    sourceRefreshTimes: {},

    requests: {}
}

/**
 * Record a link's refresh time, or forget it when there isn't one.
 */
const setRefreshTime = function(state, fileId, variant, time) {
    if ( typeof time === 'number' ) {
        if ( ! ( fileId in state.sourceRefreshTimes ) ) {
            state.sourceRefreshTimes[fileId] = {}
        }
        state.sourceRefreshTimes[fileId][variant] = time
    } else if ( fileId in state.sourceRefreshTimes ) {
        delete state.sourceRefreshTimes[fileId][variant]
    }
}

export const FileSlice = createSlice({
    name: 'File',
    initialState: initialState,
    reducers: {

        // ======== State Manipulation Helpers ================================
        // @see ./helpers/state.js

        setFilesInDictionary: setInDictionary,
        removeFile: removeEntity,
        setFileNull: function(state, action) {
            const fileId = action.payload
            state.sources[fileId] = null
            delete state.sourceRefreshTimes[fileId]

            setNull(state, action)
        }, 
        setFileQueryResults: setQueryResults,
        clearFileQuery: clearQuery,
        clearFileQueries: clearQueries,
        resetFileSlice: (state, action) => initialState,

        /**
         * Set one link: `{ fileId, variant, url, refreshTime }`, with the
         * variant 'full' when it's missing. A null `url` means the variant
         * couldn't be found. `refreshTime` comes from refreshTimeFor(), and
         * without it the link is kept until the page reloads.
         */
        setSource: (state, action ) => {
            const fileId = action.payload.fileId
            const variant = action.payload.variant

            if ( ! ( fileId in state.sources) ) {
                state.sources[fileId] = {}
            }

            // We failed to retrieve the file, but we're somehow trying to set a source on it.
            // Log an error and bail out.
            if ( state.sources[fileId] === null ) {
                logger.error(`== File::setSource() :: Attempting to set a source on a null file.`)
                return
            }

            const url = action.payload.url

            const key = variant ? variant : 'full'
            state.sources[fileId][key] = url
            setRefreshTime(state, fileId, key, typeof url === 'string' ? action.payload.refreshTime : undefined)
        },

        /**
         * Set a response's links: `{ fileId, sources, refreshTimes }`, the
         * response's `sources` and their refreshTimesFor().
         */
        setSources: (state, action) => {
            const fileId = action.payload.fileId
            if ( ! ( fileId in state.sources) ) {
                state.sources[fileId] = {}
            }

            // We failed to retrieve the file, but we're somehow trying to set a source on it.
            // Log an error and bail out.
            if ( state.sources[fileId] === null ) {
                logger.error(`== File::setSource() :: Attempting to set a source on a null file.`)
                return
            }

            for(const [variant, source] of Object.entries(action.payload.sources)) {
                state.sources[fileId][variant] = source
                setRefreshTime(state, fileId, variant, action.payload.refreshTimes?.[variant])
            }
        },

        removeSource: (state, action) => {
            const fileId = action.payload.fileId

            if ( fileId in state.sources) {
                delete state.sources[fileId]
            }
            delete state.sourceRefreshTimes[fileId]
        },

        setRequest: (state, action) => {
            state.requests[action.payload.fileId] = {
                requestId: action.payload.requestId,
                fileName: action.payload.fileName
            }
        },

        removeRequest: (state, action) => {
            if ( action.payload.fileId in state.requests ) {
                delete state.requests[action.payload.fileId]
            }
        }
    }
})

export const {  setFilesInDictionary, removeFile, setFileNull, resetFileSlice, setSource, setSources, removeSource, setRequest, removeRequest }  = FileSlice.actions

export default FileSlice.reducer
