import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getPost, removePost } from '/state/posts'

export const usePost = function(postId) {
    const post = useSelector((state) => postId && postId in state.posts.dictionary ? state.posts.dictionary[postId] : null)

    const [request, makeRequest, resetRequest] = useRequest()

    const dispatch = useDispatch()
    useEffect(() => {
        if ( postId && post === null && request === null ) {
            makeRequest(getPost(postId))
        }

        return () => {
            console.log(request)
            if ( post !== null && request !== null && request.state === 'fulfilled' ) {
                dispatch(removePost({ entity: post }))
                resetRequest()
            }
        }
    }, [ postId, post, request ])

    return [post, request]
}
