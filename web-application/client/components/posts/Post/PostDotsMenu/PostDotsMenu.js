import React from 'react'
import { useSelector } from 'react-redux'

import { useGroupMember } from '/lib/hooks/GroupMember'
import { useFeature } from '/lib/hooks/feature'

import { EllipsisHorizontalIcon } from '@heroicons/react/24/solid'

import { DotsMenu } from '/components/ui/DotsMenu'

import SubscribeToPost from './SubscribeToPost/SubscribeToPost'
import EditPost from './EditPost/EditPost'
import DeletePost from './DeletePost/DeletePost'
import FlagPost from './FlagPost/FlagPost'
import FlagPostForGroup from './FlagPostForGroup/FlagPostForGroup'

import './PostDotsMenu.css'

const PostDotsMenu = function({ postId }) {
    const currentUser = useSelector((state) => state.authentication.currentUser)
    const post = useSelector((state) => postId && postId in state.Post.dictionary ? state.Post.dictionary[postId] : null) 
    const hasGroupModeration = useFeature('89-improved-moderation-for-group-posts')

    // Must have a user and a post to show dots menu.
    if ( ! currentUser || post === null ) {
        return null
    }

    const isAuthor = currentUser && currentUser.id == post.userId

    return (
        <DotsMenu className="post-dots-menu">
            { currentUser && <SubscribeToPost postId={postId} /> }
            { currentUser && <FlagPost postId={postId} /> }
            { hasGroupModeration && currentUser && post.groupId && <FlagPostForGroup postId={postId} /> }
            { isAuthor && <EditPost postId={postId} /> }
            { isAuthor && <DeletePost postId={postId} /> }
        </DotsMenu>
    )
}

export default PostDotsMenu
