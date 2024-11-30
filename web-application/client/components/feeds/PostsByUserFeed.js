import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { getPosts, cleanupRequest } from '/state/posts'

import PostList from '/components/posts/list/PostList'

const PostsByUserFeed = function({ id }) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    const [requestId,setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId in state.posts.requests) {
            return state.posts.requests[requestId]
        } else {
            return null
        }
    })

    const dispatch = useDispatch()

    useEffect(function() {
        setRequestId(dispatch(getPosts('PostsByUser', { userId: id })))
    }, [ ])

    useEffect(function() {
        const sort = searchParams.get('sort') ? searchParams.get('sort') : 'active'
        setRequestId(dispatch(getPosts('PostsByUser', { userId: id, sort: sort })))
    }, [ searchParams ])

    useEffect(function() {
        if ( requestId ) {
            dispatch(cleanupRequest({ requestId: requestId }))
        }
    }, [ requestId ])



    return (
        <div className="posts-by-user-feed">
            <PostList queryName="PostsByUser" />
        </div>
    )

}

export default PostsByUserFeed
