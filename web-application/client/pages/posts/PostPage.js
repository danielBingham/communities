import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import { Page } from '/components/generic/Page'

import Post from '/components/posts/Post'

import './PostPage.css'

import Button from '/components/generic/button/Button'

const PostPage = function({ group }) {
    const { slug, postId } = useParams()
    const navigate = useNavigate()

    let backlink = `/${slug}`
    if ( group === true ) {
        backlink = `/group/${slug}`
    }
    return (
        <div id={`post-${postId}`}>
            <div className="post-page__header"><Button onClick={(e) => navigate(backlink)}>Back to { group === true ? 'Group' : 'Profile' }</Button></div>
            <Post id={postId} expanded={true} /> 
        </div>
    )
}

export default PostPage
