import React from 'react'

import { useSiteModeration } from '/lib/hooks/SiteModeration'
import { usePost, usePostLink } from '/lib/hooks/Post'

import PostComment from '/components/posts/PostComment'

import './PostCommentAwaitingAdminModeration.css'

const PostCommentAwaitingAdminModeration = function({ id }) {

    const [moderation] = useSiteModeration(id)
    const [post] = usePost(moderation?.postId)
    const link = usePostLink(post?.id)

    if ( moderation.postId === null || moderation.postCommentId === null ) {
        throw new Error('Invalid SiteModeration for PostCommentAwaitingAdminModeration.')
    }

    if ( moderation === null || post === null ) {
        return
    }

    return (
        <div key={moderation.id} className="post-comment-awaiting-admin-moderation">
            <div className="post-comment-awaiting-admin-moderation__context">
                <a href={`${link}#comment-${moderation.postCommentId}`}>View Context</a>
            </div>
            <PostComment postId={moderation.postId} id={moderation.postCommentId} />
        </div>
    )
}

export default PostCommentAwaitingAdminModeration
