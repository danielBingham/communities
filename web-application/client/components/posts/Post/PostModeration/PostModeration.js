import React from 'react'
import { useSelector } from 'react-redux'

import ModerateForSite from '/components/admin/moderation/ModerateForSite'
import ModerateForGroup from '/components/groups/moderation/ModerateForGroup'

import './PostModeration.css'

const PostModeration = function({ postId }) {
    const currentUser = useSelector((state) => state.authentication.currentUser)

    if ( ! currentUser ) {
        return null
    }

    return (
        <div className="post-moderation">
            <ModerateForGroup postId={postId} /> 
            <ModerateForSite postId={postId} /> 
        </div>
    )
}

export default PostModeration
