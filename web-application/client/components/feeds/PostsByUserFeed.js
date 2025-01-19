import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { getPosts, cleanupRequest } from '/state/posts'

import PostList from '/components/posts/list/PostList'

import './PostsByUserFeed.css'

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

    const setSort = function(sortBy) {
        searchParams.set('sort', sortBy)
        setSearchParams(searchParams)
    }

    useEffect(function() {
        let sort = searchParams.get('sort') 
        if ( ! sort ) {
            sort = 'newest'
        } 

        setRequestId(dispatch(getPosts('PostsByUser', { userId: id, sort: sort })))
    }, [ id ])

    useEffect(function() {
        let sort = searchParams.get('sort') 
        if ( ! sort ) {
            sort = 'newest'
        } 

        setRequestId(dispatch(getPosts('PostsByUser', { userId: id, sort: sort })))
    }, [ searchParams ])

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    let sort = searchParams.get('sort') 
    if ( ! sort ) {
        sort = 'newest'
    } 

    return (
        <div className="posts-by-user-feed">
            <div className="posts-by-user-feed__controls">
                <div className="posts-by-user-feed__sort-menu">
                    <span className="title">Sort By:</span>
                    <a
                        href=""
                        className={`sort-option ${sort == 'newest' ? 'current' : ''}`} 
                        onClick={(e) => {e.preventDefault(); setSort('newest')}}
                    >
                        New 
                    </a>
                    <a
                        href=""
                        className={`sort-option ${sort == 'active' ? 'current' : ''}`}
                        onClick={(e) => {e.preventDefault(); setSort('active')}}
                    >
                        Active 
                    </a>
                </div>
            </div>
            <PostList queryName="PostsByUser" />
        </div>
    )

}

export default PostsByUserFeed
