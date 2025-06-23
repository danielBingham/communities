import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getPost, removePost } from '/state/Post'

export const usePost = function(postId) {
    const post = useSelector((state) => postId && postId in state.Post.dictionary ? state.Post.dictionary[postId] : null)

    const [request, makeRequest, resetRequest] = useRequest()

    const dispatch = useDispatch()
    useEffect(() => {
        if ( postId && post === null && request === null ) {
            makeRequest(getPost(postId))
        }

        return () => {
            if ( post !== null && request !== null && request.state === 'fulfilled' ) {
                dispatch(removePost({ entity: post }))
                resetRequest()
            }
        }
    }, [ postId, post, request ])

    return [post, request]
}
