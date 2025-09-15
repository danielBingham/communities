import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getPost } from '/state/Post'

export const usePost = function(postId) {
    const post = useSelector((state) => postId && postId in state.Post.dictionary ? state.Post.dictionary[postId] : null)

    const [request, makeRequest, resetRequest ] = useRequest()

    const refresh = function() {
        makeRequest(getPost(postId))
    }

    useEffect(() => {
        if ( postId && post === null && request === null ) {
            makeRequest(getPost(postId))
        }
    }, [ postId, post, request ])

    return [post, request, refresh]
}
