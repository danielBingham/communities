import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { clearSharingPost } from '/state/posts'

import Modal from '/components/generic/modal/Modal'

import PostForm from '/components/posts/PostForm'

import './PostShareModal.css'

const PostShareModal = function() {
    const sharedPostId = useSelector((state) => state.posts.sharingPost)

    const dispatch = useDispatch()

    const clear = function(visible) {
        if ( visible === false) {
            dispatch(clearSharingPost())
        }
    }

    if ( ! sharedPostId ) {
        return null
    }

    return (
        <Modal className="share-modal" isVisible={sharedPostId !== null} setIsVisible={clear} hideX={true} >
            <div className="share-modal__wrapper">
                <PostForm sharedPostId={sharedPostId} />
            </div>
        </Modal>
    )

}

export default PostShareModal
