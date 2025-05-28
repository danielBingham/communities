import React from 'react'
import { useSelector } from 'react-redux'

import { useGroupMember } from '/lib/hooks/group'

import { EllipsisHorizontalIcon } from '@heroicons/react/24/solid'

import { FloatingMenu, FloatingMenuBody, FloatingMenuTrigger, FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

import SubscribeToPost from '/components/posts/widgets/SubscribeToPost'
import EditPost from '/components/posts/widgets/EditPost'
import DeletePost from '/components/posts/widgets/DeletePost'
import FlagPost from '/components/posts/widgets/FlagPost'

import './PostDotsMenu.css'

const PostDotsMenu = function({ postId }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const post = useSelector((state) => postId && postId in state.posts.dictionary ? state.posts.dictionary[postId] : null) 

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
                { currentUser && <FlagPost postId={postId} /> }
                { isAuthor && <EditPost postId={postId} /> }
                { (isAuthor || isModerator) && <DeletePost postId={postId} /> }
            </FloatingMenuBody>
        </FloatingMenu>
    )
}

export default PostDotsMenu
