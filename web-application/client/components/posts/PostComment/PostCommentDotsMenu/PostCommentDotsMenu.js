import React from 'react'
import { useSelector } from 'react-redux'

import { canModerate as canModerateGroup } from '/lib/group'
import { canModerate as canModerateSite } from '/lib/site'
import { usePost } from '/lib/hooks/post'
import { useGroup, useGroupMember } from '/lib/hooks/group'

import { EllipsisHorizontalIcon } from '@heroicons/react/24/solid'

import { FloatingMenu, FloatingMenuBody, FloatingMenuTrigger } from '/components/generic/floating-menu/FloatingMenu'

import { EditPostComment, DeletePostComment } from '/components/posts/PostComment/PostCommentDotsMenu'

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


    // Only logged in users can see the dots menu.
    if ( ! currentUser || comment === null ) {
        return null
    }

    // Users, Group moderators, and SiteAdmins can view the dots menu.
    if ( currentUser.id !== comment.userId && ! canModerateGroup(group, currentMember) && ! canModerateSite(currentUser) ) {
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
