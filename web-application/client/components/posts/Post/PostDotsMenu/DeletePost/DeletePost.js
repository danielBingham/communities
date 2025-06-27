import React, { useState } from 'react'

import { TrashIcon } from '@heroicons/react/24/outline'

import { useRequest } from '/lib/hooks/useRequest'

import { deletePost } from '/state/Post'

import { FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

import AreYouSure from '/components/AreYouSure'

const DeletePost = function({ postId } ) {
    const [ areYouSure, setAreYouSure ] = useState(false)

    const [request, makeRequest] = useRequest()

    const executeDelete = function() {
        setAreYouSure(false)
        makeRequest(deletePost({ id: postId }))
    }

    return (
        <>
            <FloatingMenuItem onClick={(e) => setAreYouSure(true)} className="delete"><TrashIcon /> Delete</FloatingMenuItem>
            <AreYouSure isVisible={areYouSure} execute={executeDelete} cancel={() => setAreYouSure(false)} > 
                <p>Are you sure you want to delete this post?</p>
            </AreYouSure>
        </>
    )
}

export default DeletePost
