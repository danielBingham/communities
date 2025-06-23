import React from 'react'
import { useSelector } from 'react-redux'

import { useGroupMember } from '/lib/hooks/GroupMember'
import { useFeature } from '/lib/hooks/feature'

import { EllipsisHorizontalIcon } from '@heroicons/react/24/solid'

import { FloatingMenu, FloatingMenuBody, FloatingMenuTrigger, FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

import SubscribeToPost from './SubscribeToPost/SubscribeToPost'
import EditPost from './EditPost/EditPost'
import DeletePost from './DeletePost/DeletePost'
import FlagPost from './FlagPost/FlagPost'

import './PostDotsMenu.css'

const PostDotsMenu = function({ postId }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const post = useSelector((state) => postId && postId in state.Post.dictionary ? state.Post.dictionary[postId] : null) 
    const hasAdminModeration = useFeature('62-admin-moderation-controls')

    const [currentMember] = useGroupMember(post?.groupId, currentUser?.id) 

    // Must have a user and a post to show dots menu.
    if ( ! currentUser || post === null ) {
        return null
    }

    const isAuthor = currentUser && currentUser.id == post.userId
    const isModerator = currentMember && (currentMember.role == 'admin' || currentMember.role == 'moderator')

    return (
        <FloatingMenu className="post-dots-menu" closeOnClick={true}>
            <FloatingMenuTrigger showArrow={false}><EllipsisHorizontalIcon className="dots" /></FloatingMenuTrigger>
            <FloatingMenuBody>
                { currentUser && <SubscribeToPost postId={postId} /> }
                { hasAdminModeration && currentUser && <FlagPost postId={postId} /> }
                { isAuthor && <EditPost postId={postId} /> }
                { (isAuthor || isModerator) && <DeletePost postId={postId} /> }
            </FloatingMenuBody>
        </FloatingMenu>
    )
}

export default PostDotsMenu
