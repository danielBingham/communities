import React from 'react'
import { useSelector } from 'react-redux'

import ModerateForSite from '/components/admin/moderation/ModerateForSite'
import ModerateForGroup from '/components/groups/moderation/ModerateForGroup'

import './PostCommentModeration.css'

const PostCommentModeration = function({ postId, postCommentId }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)

    if ( ! currentUser ) {
        return null
    }

    return (
        <div className="post-comment-moderation">
            <ModerateForGroup postId={postId} postCommentId={postCommentId} /> 
            <ModerateForSite postId={postId} postCommentId={postCommentId} /> 
        </div>
    )
}

export default PostCommentModeration
