import React from 'react'
import { useParams } from 'react-router-dom'

import { Page } from '/components/generic/Page'

import Post from '/components/posts/Post'

const PostPage = function() {
    const { slug, postId } = useParams()

    return (
        <Page id={`post-${postId}`}>
            <Post id={postId} expanded={true} /> 
        </Page>
    )
}

export default PostPage
