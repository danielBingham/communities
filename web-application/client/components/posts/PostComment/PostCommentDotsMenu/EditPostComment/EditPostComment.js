import React, { useContext } from 'react'
import { useDispatch } from 'react-redux'

import { PencilIcon } from '@heroicons/react/24/outline'

import { startPostCommentEdit } from '/state/PostComment'

import { DotsMenuItem, CloseMenuContext } from '/components/ui/DotsMenu'

import './EditPostComment.css'

const EditPostComment = function({ postId, id }) {

    const dispatch = useDispatch()
    const closeMenu = useContext(CloseMenuContext)

    const editComment = function() {
        dispatch(startPostCommentEdit(id))
        closeMenu()
    }

    return (
        <DotsMenuItem onClick={editComment} className="edit"><PencilIcon /> edit</DotsMenuItem> 
    )

}

export default EditPostComment 
