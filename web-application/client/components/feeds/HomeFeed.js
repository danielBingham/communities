import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { getPosts, cleanupRequest } from '/state/posts'

import PostList from '/components/posts/list/PostList'

const HomeFeed = function() {
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
        let sort = localStorage.getItem(`HomeFeed.sort`) 
        if ( ! sort ) {
            sort = searchParams.get('sort') ? searchParams.get('sort') : 'active'
        } 

        const page = searchParams.get('page') ? searchParams.get('page') : 1
        setRequestId(dispatch(getPosts('HomeFeed', { sort: sort, page: page })))
    }, [ searchParams ])

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])


    return (
        <div className="home-feed">
            <PostList queryName="HomeFeed" />
        </div>
    )

}

export default HomeFeed
