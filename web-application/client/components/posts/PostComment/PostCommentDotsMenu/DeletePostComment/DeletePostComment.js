import React, { useState } from 'react'

import { TrashIcon } from '@heroicons/react/24/outline'

import { useRequest } from '/lib/hooks/useRequest'

import { deletePostComment } from '/state/PostComment'

import { FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

import AreYouSure from '/components/AreYouSure'

import './DeletePostComment.css'

const DeletePostComment = function({ postId, id } ) {
    const [ areYouSure, setAreYouSure ] = useState(false)

    const [request, makeRequest] = useRequest()

    const deleteComment = function() {
        setAreYouSure(false)
        makeRequest(deletePostComment({ postId: postId, id: id }))
    }

    return (
        <>
            <FloatingMenuItem onClick={(e) => setAreYouSure(true)} className="delete"><TrashIcon /> delete</FloatingMenuItem>
            <AreYouSure isVisible={areYouSure} execute={deleteComment} cancel={() => setAreYouSure(false)}> 
                <p>Are you sure you want to delete this comment?</p>
            </AreYouSure>
        </>
    )
}

export default DeletePostComment
