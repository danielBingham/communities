import React from 'react'
import { useSelector } from 'react-redux'

import { usePostComment } from '/lib/hooks/PostComment'

import { DotsMenu } from '/components/ui/DotsMenu'

import EditPostComment from './EditPostComment'
import DeletePostComment from './DeletePostComment'
import FlagPostComment from './FlagPostComment'
import FlagPostCommentForGroup from './FlagPostCommentForGroup'

import './PostCommentDotsMenu.css'

const PostCommentDotsMenu = function({ postId, id }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [comment] = usePostComment(postId, id)

    // Only logged in users can see the dots menu.
    if ( ! currentUser || comment === null ) {
        return null
    }

    return (
        <DotsMenu className="post-comment-dots-menu">
            <FlagPostComment postId={postId} id={id} />
            <FlagPostCommentForGroup postId={postId} postCommentId={id} />
            { currentUser.id === comment.userId && <EditPostComment postId={postId} id={id} /> }
            { currentUser.id === comment.userId && <DeletePostComment postId={postId} id={id} /> }
        </DotsMenu>
    )
}

export default PostCommentDotsMenu
