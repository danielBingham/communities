import React from 'react'

import { useGroupModeration } from '/lib/hooks/GroupModeration'
import { usePost, usePostLink } from '/lib/hooks/Post'

import PostComment from '/components/posts/PostComment'

import './PostCommentAwaitingGroupModeration.css'

const PostCommentAwaitingGroupModeration = function({ id }) {

    const [moderation] = useGroupModeration(id)
    const [post] = usePost(moderation?.postId)
    const link = usePostLink(post?.id)

    if ( moderation.postId === null || moderation.postCommentId === null ) {
        throw new Error('Invalid GroupModeration for PostCommentAwaitingGroupModeration.')
    }

    if ( moderation === null || post === null ) {
        return
    }

    return (
        <div key={moderation.id} className="post-comment-awaiting-group-moderation">
            <div className="post-comment-awaiting-group-moderation__context">
                <a href={`${link}#comment-${moderation.postCommentId}`}>View Context</a>
            </div>
            <PostComment postId={moderation.postId} id={moderation.postCommentId} />
        </div>
    )
}

export default PostCommentAwaitingGroupModeration
