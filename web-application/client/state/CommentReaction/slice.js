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
     * A dictionary of CommentReactions we've retrieved from the backend, keyed
     * by commentReaction.id.
     *
     * A PostComment's reactions are listed by id in `PostComment.reactions`.
     * The backend leaves out reactions from users who are blocked by, or have
     * blocked, the current user, so only count the reactions that are
     * actually in this dictionary.
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
    queries: {}
}

export const CommentReactionSlice = createSlice({
    name: 'CommentReaction',
    initialState: initialState,
    reducers: {
        setCommentReactionsInDictionary: setInDictionary,
        removeCommentReaction: removeEntity,
        setCommentReactionQueryResults: setQueryResults,
        clearCommentReactionQuery: clearQuery,
        clearCommentReactionQueries: clearQueries,
        resetCommentReactionSlice: () => initialState
    }
})

export const {
    setCommentReactionsInDictionary, removeCommentReaction,
    clearCommentReactionQuery, setCommentReactionQueryResults,
    clearCommentReactionQueries, resetCommentReactionSlice
}  = CommentReactionSlice.actions

export default CommentReactionSlice.reducer
