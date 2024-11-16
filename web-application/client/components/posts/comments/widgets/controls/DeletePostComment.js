import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { deletePostComment, cleanupRequest } from '/state/postComments'

import { FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

import AreYouSure from '/components/AreYouSure'

const DeletePostComment = function({ postId, id } ) {
    const [ areYouSure, setAreYouSure ] = useState(false)

    const [ requestId, setRequestId ] = useState(null)

    const dispatch = useDispatch()

    const deleteComment = function() {
        setAreYouSure(false)
        setRequestId(dispatch(deletePostComment({ postId: postId, id: id })))
    }

    useEffect(function() {
        if ( requestId ) {
            dispatch(cleanupRequest({ requestId: requestId }))
        }
    }, [ requestId ])

    return (
        <>
        <FloatingMenuItem onClick={(e) => setAreYouSure(true)} className="delete">delete</FloatingMenuItem>
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
