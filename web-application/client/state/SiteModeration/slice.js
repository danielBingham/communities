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
         * A dictionary of siteModerations we've retrieved from the backend, keyed by
         * post.id.
         *
         * @type {object}
         */
        dictionary: {},

        /**
         *
         * An object containing queries made to query supporting endpoints.
         *
         * In the case of SiteModeration: /admin/moderations
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

        byPostId: {},
        byPostCommentId: {}
}

export const SiteModerationSlice = createSlice({
    name: 'SiteModeration',
    initialState: initialState,
    reducers: {
        // ======== State Manipulation Helpers ================================
        // @see ./helpers/state.js

        setSiteModerationsInDictionary: function(state, action) {
            setInDictionary(state, action)

            // Add the entity to the byPostId and byPostCommentId indexes.
            const addEntityToIndexes = function(entity) {
                // When only postId is set, the moderation references a Post.
                if ( entity.postId !== null && entity.postCommentId === null ) {
                    state.byPostId[entity.postId] = entity
                } 
                // When both postId and postCommentId are set, it references a PostComment. 
                else if ( entity.postId !== null && entity.postCommentId !== null ) {
                    if ( ! (entity.postId in state.byPostCommentId) ) {
                        state.byPostCommentId[entity.postId] = {}
                    }
                    state.byPostCommentId[entity.postId][entity.postCommentId] = entity
                }
            }

            if ( 'dictionary' in action.payload ) {
                for(const [id, entity] of Object.entries(action.payload.dictionary)) {
                    addEntityToIndexes(entity)
                }
            } else if ( 'entity' in action.payload ) {
                const entity = action.payload.entity
                addEntityToIndexes(entity)
            }
        },
        removeSiteModeration: function(state, action) {
            removeEntity(state, action)
            
            if ( action.payload.entity.postId !== null ) {
                delete state.byPostId[action.payload.entity.postId]
            } else if( action.payload.entity.postCommentId !== null ) {
                if ( action.payload.entity.postId in state.byPostCommentId ) {
                    delete state.byPostCommentId[action.payload.entity.postId][action.payload.entity.postCommentId]
                }
            }
        },
        setSiteModerationQueryResults: setQueryResults,
        clearSiteModerationQuery: clearQuery,
        clearSiteModerationQueries: clearQueries,
        resetSiteModerationSlice: function() {
            return initialState
        }
    }
})

export const { 
    setSiteModerationsInDictionary, removeSiteModeration, 
    setSiteModerationQueryResults, clearSiteModerationQuery,
    clearSiteModerationQueries, resetSiteModerationSlice
}  = SiteModerationSlice.actions

export default SiteModerationSlice.reducer
