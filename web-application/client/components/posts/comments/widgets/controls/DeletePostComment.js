import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { TrashIcon } from '@heroicons/react/24/outline'

import { deletePostComment, cleanupRequest } from '/state/postComments'

import { FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

import AreYouSure from '/components/AreYouSure'

import './DeletePostComment.css'

const DeletePostComment = function({ postId, id } ) {
    const [ areYouSure, setAreYouSure ] = useState(false)

    const [ requestId, setRequestId ] = useState(null)

    const dispatch = useDispatch()

    const deleteComment = function() {
        setAreYouSure(false)
        setRequestId(dispatch(deletePostComment({ postId: postId, id: id })))
    }

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    return (
        <>
            <FloatingMenuItem onClick={(e) => setAreYouSure(true)} className="delete"><TrashIcon /> delete</FloatingMenuItem>
        <AreYouSure 
            isVisible={areYouSure} 
            action="delete this comment" 
            execute={deleteComment} 
            cancel={() => setAreYouSure(false)} 
        /> 
        </>
    )
}

export default DeletePostComment
