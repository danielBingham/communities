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

    sources: {}
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

            setNull(state, action)
        }, 
        setFileQueryResults: setQueryResults,
        clearFileQuery: clearQuery,
        clearFileQueries: clearQueries,
        resetFileSlice: (state, action) => initialState,

        setSource: (state, action ) => {
            const fileId = action.payload.fileId
            const width = action.payload.width

            if ( ! ( fileId in state.sources) ) {
                state.sources[fileId] = {}
            }

            const url = action.payload.url

            if ( width ) {
                state.sources[fileId][width] = url
            } else {
                state.sources[fileId]['full'] = url
            }
        },

        removeSource: (state, action) => {
            const fileId = action.payload.fileId

            if ( fileId in state.sources) {
                delete state.sources[fileId]
            }
        }
    }
})

export const {  setFilesInDictionary, removeFile, resetFileSlice, setSource, removeSource }  = FileSlice.actions

export default FileSlice.reducer
