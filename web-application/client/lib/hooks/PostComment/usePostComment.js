import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getPostComment } from '/state/PostComment'

export const usePostComment = function(postId, postCommentId) {
    const postComment = useSelector((state) => postCommentId && postCommentId in state.PostComment.dictionary ? state.PostComment.dictionary[postCommentId] : null)

    const [request, makeRequest] = useRequest()

    useEffect(() => {
        if ( postId && postCommentId && ! postComment ) {
            makeRequest(getPostComment(postId, postCommentId))
        }
    }, [ postId, postCommentId, postComment ])

    return [postComment, request]
}
