import { createSlice } from '@reduxjs/toolkit'

import {
    setInDictionary,
    removeEntity,
    setQueryResults,
    clearQuery,
    clearQueries
} from '/state/lib/slice'

export const LinkPreviewSlice = createSlice({
    name: 'LinkPreview',
    initialState: {
        
        // ======== Standard State ============================================

        /**
         * A dictionary of LinkPreview we've retrieved from the backend, keyed by
         * linkPreview.id.
         *
         * @type {object}
         */
        dictionary: {},

        /**
         *
         * An object containing queries made to query supporting endpoints.
         *
         * In the case of LinkPreview: /link-previews, /link-preview/:id/children, and
         * /link-preview/:id/parents
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
        setLinkPreviewsInDictionary: setInDictionary, 
        removeLinkPreview: removeEntity,
        setLinkPreviewQueryResults: setQueryResults,
        clearLinkPreviewQuery: clearQuery,
        clearLinkPreviewQueries: clearQueries
    }
})

export const { 
    setLinkPreviewsInDictionary, removeLinkPreview, 
     clearLinkPreviewQuery, setLinkPreviewQueryResults,
    clearLinkPreviewQueries
}  = LinkPreviewSlice.actions

export default LinkPreviewSlice.reducer
