import React from 'react'
import { useDispatch } from 'react-redux'

import { startPostEdit } from '/state/posts'
import { FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

const EditPost = function({ postId }) {
    const dispatch = useDispatch()

    const executeEdit = function() {
        dispatch(startPostEdit(postId))
    }

    return (
        <FloatingMenuItem onClick={executeEdit} className="edit">edit</FloatingMenuItem> 
    )

}

export default EditPost 
