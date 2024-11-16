import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { getPost, cleanupRequest } from '/state/posts'

import Spinner from '/components/Spinner'
import DateTag from '/components/DateTag'
import UserTag from '/components/users/UserTag'

import PostReactions from '/components/posts/widgets/PostReactions'
import PostComments from '/components/posts/comments/PostComments'

import './Post.css'

const Post = function({ id }) {

    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if( requestId in state.posts.requests) {
            return state.posts.requests[requestId]
        } else {
            return null
        }
    })

    const post = useSelector(function(state) {
        return state.posts.dictionary[id]
    })

    const user = useSelector(function(state) {
        if ( post?.userId ) {
            return state.users.dictionary[post.userId]
        } else {
            return null
        }
    })

    const dispatch = useDispatch()

    useEffect(function() {
        if ( ! post ) {
            setRequestId(dispatch(getPost(id)))
        }
    }, [])

    useEffect(function() {
        if ( requestId ) {
            dispatch(cleanupRequest({ requestId: requestId }))
        }
    }, [ requestId ])

    if ( ! post || ! user ) {
        return (
            <div className="post">
                <Spinner local={true} />
            </div>
        )
    }

    return (
        <div id={post.id} className="post">
            <div className="header"> 
                <UserTag id={post.userId} /> posted <a href={`/${user.name}/${id}`}><DateTag timestamp={post.createdDate} /></a>
            </div>
            <div className="content">
                { post.content }
            </div>
            <PostReactions postId={id} />
            <PostComments postId={id} />
        </div>
    )
}

export default Post
