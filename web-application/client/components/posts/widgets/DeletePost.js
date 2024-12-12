import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { deletePost, cleanupRequest } from '/state/posts'

import { FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

import AreYouSure from '/components/AreYouSure'

const DeletePost = function({ postId } ) {
    const [ areYouSure, setAreYouSure ] = useState(false)

    const [ requestId, setRequestId ] = useState(null)

    const dispatch = useDispatch()

    const executeDelete = function() {
        setAreYouSure(false)
        setRequestId(dispatch(deletePost({ id: postId })))
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
        <FloatingMenuItem onClick={(e) => setAreYouSure(true)} className="delete">delete</FloatingMenuItem>
        <AreYouSure 
            isVisible={areYouSure} 
            action="delete this post" 
            execute={executeDelete} 
            cancel={() => setAreYouSure(false)} 
        /> 
        </>
    )
}

export default DeletePost
