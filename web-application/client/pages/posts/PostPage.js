import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'

import { Page } from '/components/generic/Page'

import Post from '/components/posts/Post'

const PostPage = function() {
    const { username, postId } = useParams()

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })
   
    const navigate = useNavigate()
    useEffect(function() {
        if ( ! currentUser ) {
            navigate('/')
        }
    }, [])

    if ( ! currentUser ) {
        return null
    }

    return (
        <Page id={`post-${postId}`}>
            <Post id={postId} /> 
        </Page>
    )
}

export default PostPage
