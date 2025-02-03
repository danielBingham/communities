import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

import { Page } from '/components/generic/Page'

import PostForm from '/components/posts/form/PostForm'

import Post from '/components/posts/Post'

const PostPage = function() {
    const { username, postId } = useParams()

    const editing = useSelector((state) => state.posts.editing)

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
