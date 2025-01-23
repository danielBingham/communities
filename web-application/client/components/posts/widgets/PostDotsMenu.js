import React from 'react'
import { useSelector } from 'react-redux'

import { EllipsisHorizontalIcon } from '@heroicons/react/24/solid'

import { FloatingMenu, FloatingMenuBody, FloatingMenuTrigger, FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

import SubscribeToPost from '/components/posts/widgets/SubscribeToPost'
import EditPost from '/components/posts/widgets/EditPost'
import DeletePost from '/components/posts/widgets/DeletePost'

import './PostDotsMenu.css'

const PostDotsMenu = function({ postId }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const post = useSelector(function(state) {
        if ( postId in state.posts.dictionary ) {
            return  state.posts.dictionary[postId]
        } else {
            return null
        }
    })

    // User can only see the dots menu if this is their post.
    if ( ! currentUser || post === null ) {
        return null
    }

    const isAuthor = currentUser && currentUser.id == post.userId

    return (
        <FloatingMenu className="post-dots-menu" closeOnClick={true}>
            <FloatingMenuTrigger showArrow={false}><EllipsisHorizontalIcon className="dots" /></FloatingMenuTrigger>
            <FloatingMenuBody>
                { currentUser && <SubscribeToPost postId={postId} /> }
                { isAuthor && <EditPost postId={postId} /> }
                { isAuthor && <DeletePost postId={postId} /> }
            </FloatingMenuBody>
        </FloatingMenu>
    )
}

export default PostDotsMenu
