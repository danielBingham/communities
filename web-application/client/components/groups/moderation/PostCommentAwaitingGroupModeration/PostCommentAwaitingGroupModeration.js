import React from 'react'

import { useGroupModeration } from '/lib/hooks/GroupModeration'
import { usePost, usePostLink } from '/lib/hooks/Post'

import PostComment from '/components/posts/PostComment'

import Card from '/components/ui/Card'

import './PostCommentAwaitingGroupModeration.css'

const PostCommentAwaitingGroupModeration = function({ groupId, id }) {

    const [moderation] = useGroupModeration(groupId, id)
    const [post] = usePost(moderation?.postId)
    const link = usePostLink(post?.id)

    if ( moderation.postId === null || moderation.postCommentId === null ) {
        throw new Error('Invalid GroupModeration for PostCommentAwaitingGroupModeration.')
    }

    if ( moderation === null || post === null ) {
        return
    }

    return (
        <Card className="post-comment-awaiting-group-moderation">
            <div className="post-comment-awaiting-group-moderation__context">
                <a href={`${link}#comment-${moderation.postCommentId}`}>View Context</a>
            </div>
            <PostComment postId={moderation.postId} id={moderation.postCommentId} />
        </Card>
    )
}

export default PostCommentAwaitingGroupModeration
