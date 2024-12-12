import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { patchPostComment, cleanupRequest } from '/state/postComments'

import { FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

const EditPostComment = function({ postId, id }) {

    const [ requestId, setRequestId ] = useState(null)

    const dispatch = useDispatch()

    const editComment = function() {
        const commentPatch = {
            id: id,
            postId: postId,
            status: 'editing'
        }

        setRequestId(dispatch(patchPostComment(commentPatch)))
    }

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    return (
        <FloatingMenuItem onClick={editComment} className="edit">edit</FloatingMenuItem> 
    )

}

export default EditPostComment 
