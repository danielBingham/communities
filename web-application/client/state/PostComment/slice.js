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
     * A dictionary of PostComment we've retrieved from the backend, keyed by
     * postComment.id.
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

    // Specific state
    commentsByPost: {},

    // Which comments are currently being edited?
    //
    // { 
    //  [id]: boolean
    // }
    editing: {}

}

export const PostCommentSlice = createSlice({
    name: 'PostComment',
    initialState: initialState,
    reducers: {
        setPostCommentsInDictionary: function(state, action) {
            setInDictionary(state, action)

            if ( 'dictionary' in action.payload ) {
                const dictionary = action.payload.dictionary
                for(const [id, entity] of Object.entries(dictionary)) {
                    if( ! ( entity.postId in state.commentsByPost )) {
                        state.commentsByPost[entity.postId] = {}
                    } 

                    state.commentsByPost[entity.postId][entity.id] = entity
                }
            } else if ( 'entity' in action.payload ) {
                const entity = action.payload.entity
                if( ! ( entity.postId in state.commentsByPost )) {
                    state.commentsByPost[entity.postId] = {}
                } 

                state.commentsByPost[entity.postId][entity.id] = entity
            }
        },
        removePostComment: function(state, action) {
            removeEntity(state, action)

            const entity = action.payload.entity

            if ( entity.postId in state.commentsByPost && entity.id in state.commentsByPost[entity.postId]) {
                delete state.commentsByPost[entity.postId][entity.id]
            }
        },
        setPostCommentQueryResults: setQueryResults,
        clearPostCommentQuery: clearQuery,
        clearPostCommentQueries: clearQueries,
        resetPostCommentSlice: () => initialState,

        startPostCommentEdit: function(state, action) {
            const commentId = action.payload
            state.editing[commentId] = true
        },

        finishPostCommentEdit: function(state, action) {
            const commentId = action.payload
            delete state.editing[commentId]
        }
    }
})

export const { 
    setPostCommentsInDictionary, removePostComment, 
    clearPostCommentQuery, setPostCommentQueryResults,
    clearPostCommentQueries, resetPostCommentSlice,
    startPostCommentEdit, finishPostCommentEdit
}  = PostCommentSlice.actions

export default PostCommentSlice.reducer
