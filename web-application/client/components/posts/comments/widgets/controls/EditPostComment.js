import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { PencilIcon } from '@heroicons/react/24/outline'

import { startPostCommentEdit } from '/state/postComments'

import { FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

import './EditPostComment.css'

const EditPostComment = function({ postId, id }) {

    const dispatch = useDispatch()

    const editComment = function() {
        dispatch(startPostCommentEdit(id))
    }

    return (
        <FloatingMenuItem onClick={editComment} className="edit"><PencilIcon /> edit</FloatingMenuItem> 
    )

}

export default EditPostComment 
