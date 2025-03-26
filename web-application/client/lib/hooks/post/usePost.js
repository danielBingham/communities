import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getPost } from '/state/posts'

export const usePost = function(postId) {
    const [error, setError] = useState(null)

    const post = useSelector((state) => postId && postId in state.posts.dictionary ? state.posts.dictionary[postId] : null)

    const [request, makeRequest] = useRequest()

    useEffect(() => {
        if ( postId && ! post ) {
            makeRequest(getPost(postId))
        }
    }, [ postId, post ])

    useEffect(() => {
        if ( request && request.state == 'failed' ) {
            setError(request.error)
        }
    }, [ request ])

    return [post, error, request]
}
