import React from 'react'
import { useParams } from 'react-router-dom'

import Spinner from '/components/Spinner'
import { Page, PageBody, PageHeader, PageTabBar, PageTab } from '/components/generic/Page'

import Post from '/components/posts/Post'

const PostPage = function() {
    const { name, postId } = useParams()

    return (
        <Page id={`post-${postId}`}>
            <Post id={postId} /> 
        </Page>
    )
}

export default PostPage
