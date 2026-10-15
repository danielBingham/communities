import { createSlice } from '@reduxjs/toolkit'

import {
    setQueryNull,
    setQueryResults,
    clearQuery,
    clearQueries
} from '/state/lib/slice'

const initialState = {
    /**
     * A dictionary of News posts we've retrieved from the backend, keyed by
     * news.slug.
     *
     * News posts don't have an `id`, so unlike our other entities this is
     * keyed by slug, and the reducers below don't use the shared
     * `setInDictionary`, `setNull` and `removeEntity` from `/state/lib`.
     *
     * A slug is `null` when we asked for it and it doesn't exist.
     *
     * @type {object}
     */
    dictionary: {},

    /**
     *
     * An object containing queries made to query supporting endpoints.
     *
     * In this case: GET /news
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
     *      list: [] // slugs
     *  },
     *  ...
     * }
     */
    queries: {}
}

export const NewsSlice = createSlice({
    name: 'News',
    initialState: initialState,
    reducers: {
        setNewsInDictionary: (state, action) => {
            if ( 'dictionary' in action.payload && action.payload.dictionary !== undefined ) {
                state.dictionary = { ...state.dictionary, ...action.payload.dictionary }
            } else if ( 'entity' in action.payload && action.payload.entity !== undefined ) {
                const entity = action.payload.entity
                state.dictionary[entity.slug] = entity
            } else {
                throw new Error(`Invalid payload sent to ${action.type}.`)
            }
        },
        setNewsNull: (state, action) => {
            const slug = action.payload
            state.dictionary[slug] = null
        },
        removeNews: (state, action) => {
            const entity = action.payload.entity
            delete state.dictionary[entity.slug]
        },
        setNewsQueryNull: setQueryNull,
        setNewsQueryResults: setQueryResults,
        clearNewsQuery: clearQuery,
        clearNewsQueries: clearQueries,
        resetNewsSlice: function() {
            return initialState
        }
    }
})

export const {
    setNewsInDictionary, setNewsNull, removeNews,
    setNewsQueryNull, setNewsQueryResults, clearNewsQuery,
    clearNewsQueries, resetNewsSlice
} = NewsSlice.actions

export default NewsSlice.reducer
