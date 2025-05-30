import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getPostComment } from '/state/postComments'

export const usePostComment = function(postId, postCommentId) {
    const postComment = useSelector((state) => postCommentId && postCommentId in state.postComments.dictionary ? state.postComments.dictionary[postCommentId] : null)

    const [request, makeRequest] = useRequest()

    useEffect(() => {
        if ( postId && postCommentId && ! postComment ) {
            console.log(`Retrieving comment for ${postId} and ${postCommentId}`)
            makeRequest(getPostComment(postId, postCommentId))
        }
    }, [ postId, postCommentId, postComment ])

    return [postComment, request]
}
