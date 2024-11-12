import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { getPosts, cleanupRequest } from '/state/posts'

import Post from '/components/posts/Post'
import Spinner from '/components/Spinner'

const PostList = function() {

    const [requestId,setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId in state.posts.requests) {
            return state.posts.requests[requestId]
        } else {
            return null
        }
    })
    const postIds = useSelector(function(state) {
        if ( 'post-list' in state.posts.queries ) {
            return state.posts.queries['post-list'].list
        } else {
            return null 
        }
    })

    const dispatch = useDispatch()

    useEffect(function() {
        if ( ! request ) {
            setRequestId(dispatch(getPosts('post-list')))
        }
    }, [ request ])

    useEffect(function() {
        if ( requestId ) {
            dispatch(cleanupRequest({ requestId: requestId }))
        }
    }, [ requestId ])

    if ( postIds === null ) {
        return (
            <div className="post-list">
                <Spinner local={true} />
            </div>
        )
    }

    const postViews = []
    for(const postId of postIds) {
        postViews.push(<Post key={postId} id={postId} />)
    }

    return (
        <div className="post-list">
            { postViews }
        </div>
    )

}

export default PostList
