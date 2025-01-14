import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

import { Page } from '/components/generic/Page'

import PostForm from '/components/posts/form/PostForm'
import LoginForm from '/components/authentication/LoginForm'

import WelcomeNotice from '/components/notices/WelcomeNotice'

import Post from '/components/posts/Post'

const PostPage = function() {
    const { username, postId } = useParams()

    const features = useSelector((state) => state.system.features)
    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const editing = useSelector(function(state) {
        return state.posts.editing
    })

    // Protect this page so the user must be logged in.
    if ( ! currentUser ) {
        return (
            <LoginForm />
        )
    }

    let welcomeNotice = null
    if ( '3-notices' in features && currentUser && ! currentUser.notices?.welcomeNotice ) {
        welcomeNotice = ( <WelcomeNotice /> )
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
                { welcomeNotice }
                <Post id={postId} expanded={true} /> 
            </Page>
        )
    }
}

export default PostPage
