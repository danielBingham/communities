import { createSlice } from '@reduxjs/toolkit'

import {
    setInDictionary,
    removeEntity,
    setQueryResults,
    clearQuery,
    clearQueries
} from '/state/lib'

export const BlocklistSlice = createSlice({
    name: 'Blocklist',
    initialState: {
        
        // ======== Standard State ============================================

        /**
         * A dictionary of Blocklist we've retrieved from the backend, keyed by
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

    },
    reducers: {
        setBlocklistsInDictionary: setInDictionary,
        removeBlocklist: removeEntity,
        setBlocklistQueryResults: setQueryResults,
        clearBlocklistQuery: clearQuery,
        clearBlocklistQueries: clearQueries
    }
})

export const { 
    setBlocklistsInDictionary, removeBlocklist ,
    setBlocklistQueryResults, clearBlocklistQuery,
    clearBlocklistQueries
}  = BlocklistSlice.actions

export default BlocklistSlice.reducer
