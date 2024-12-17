import React from 'react'
import { useDispatch } from 'react-redux'

import { PencilIcon } from '@heroicons/react/24/outline'

import { startPostEdit } from '/state/posts'
import { FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

const EditPost = function({ postId }) {
    const dispatch = useDispatch()

    const executeEdit = function() {
        dispatch(startPostEdit(postId))
    }

    return (
        <FloatingMenuItem onClick={executeEdit} className="edit"><PencilIcon /> edit</FloatingMenuItem> 
    )

}

export default EditPost 
