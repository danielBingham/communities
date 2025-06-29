import React from 'react'
import { useSelector } from 'react-redux'

import { usePostComment } from '/lib/hooks/PostComment'

import { EllipsisHorizontalIcon } from '@heroicons/react/24/solid'

import { FloatingMenu, FloatingMenuBody, FloatingMenuTrigger } from '/components/generic/floating-menu/FloatingMenu'

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
        <FloatingMenu className="post-comment-dots-menu">
            <FloatingMenuTrigger showArrow={false}><EllipsisHorizontalIcon className="dots" /></FloatingMenuTrigger>
            <FloatingMenuBody>
                <FlagPostComment postId={postId} id={id} />
                <FlagPostCommentForGroup postId={postId} postCommentId={id} />
                { currentUser.id === comment.userId && <EditPostComment postId={postId} id={id} /> }
                { currentUser.id === comment.userId && <DeletePostComment postId={postId} id={id} /> }
            </FloatingMenuBody>
        </FloatingMenu>
    )
}

export default PostCommentDotsMenu
