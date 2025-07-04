import React from 'react'
import { useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'

import { useGroupPermission, GroupPermissions } from '/lib/hooks/permission'

import Post from '/components/posts/Post'

import './PostView.css'

import Error404 from '/components/errors/Error404'
import Button from '/components/generic/button/Button'

const PostView = function({ groupId }) {
    const { slug, postId } = useParams()
    const navigate = useNavigate()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const canViewGroup = useGroupPermission(currentUser, GroupPermissions.VIEW, groupId)

    if ( groupId !== undefined && canViewGroup !== true ) {
        return ( <Error404 /> ) 
    }

    let backlink = `/${slug}`
    if ( groupId !== undefined ) {
        backlink = `/group/${slug}`
    }
    return (
        <div id={`post-${postId}`}>
            <div className="post-page__header"><Button onClick={(e) => navigate(backlink)}>Back to { groupId !== undefined ? 'Group' : 'Profile' }</Button></div>
            <Post id={postId} expanded={true} /> 
        </div>
    )
}

export default PostView
