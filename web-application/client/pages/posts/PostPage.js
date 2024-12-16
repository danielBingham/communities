import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'

import { Page } from '/components/generic/Page'

import PostForm from '/components/posts/form/PostForm'

import Post from '/components/posts/Post'

const PostPage = function() {
    const { username, postId } = useParams()

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const editing = useSelector(function(state) {
        return state.posts.editing
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

    const draft = localStorage.getItem(`draft.${postId}`)
    if ( draft || postId in editing ) {
        return (
            <Page id={`post-${postId}`}>
                <PostForm key={postId} postId={postId} />
            </Page>
        )
    } else {
        return (
            <Page id={`post-${postId}`}>
                <Post id={postId} expanded={true} /> 
            </Page>
        )
    }
}

export default PostPage
