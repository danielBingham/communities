import React from 'react'
import { useSelector } from 'react-redux'

import { canModerate } from '/lib/group'
import { usePost } from '/lib/hooks/post'
import { useGroup, useGroupMember } from '/lib/hooks/group'

import { EllipsisHorizontalIcon } from '@heroicons/react/24/solid'

import { FloatingMenu, FloatingMenuBody, FloatingMenuTrigger, FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

import EditPostComment from '/components/posts/comments/widgets/controls/EditPostComment'
import DeletePostComment from '/components/posts/comments/widgets/controls/DeletePostComment'

import './PostCommentDotsMenu.css'

const PostCommentDotsMenu = function({ postId, id }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const comment = useSelector(function(state) {
        if ( id in state.postComments.dictionary ) {
            return  state.postComments.dictionary[id]
        } else {
            return null
        }
    })

    const [post] = usePost(postId)
    const [group] = useGroup(post?.groupId)
    const [currentMember] = useGroupMember(post?.groupId, currentUser?.id)



    // User can only see the dots menu if this is their comment.
    if ( ! currentUser || comment === null ) {
        return null
    }

    if ( currentUser.id !== comment.userId && ! canModerate(group, currentMember)) {
        return null
    }

    return (
        <FloatingMenu className="post-comment-dots-menu">
            <FloatingMenuTrigger showArrow={false}><EllipsisHorizontalIcon className="dots" /></FloatingMenuTrigger>
            <FloatingMenuBody>
                { currentUser.id === comment.userId && <EditPostComment postId={postId} id={id} /> }
                <DeletePostComment postId={postId} id={id} />
            </FloatingMenuBody>
        </FloatingMenu>
    )
}

export default PostCommentDotsMenu
