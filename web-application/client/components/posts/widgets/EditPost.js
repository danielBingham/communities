import React from 'react'
import { useSelector } from 'react-redux'

import { PencilIcon } from '@heroicons/react/24/outline'

import { usePostDraft } from '/lib/hooks/usePostDraft'
// import { startPostEdit } from '/state/posts'
import { FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

const EditPost = function({ postId }) {
    /*const dispatch = useDispatch()

    const executeEdit = function() {
        dispatch(startPostEdit(postId))
    } */

    const [draft, setDraft] = usePostDraft(postId)

    const post = useSelector((state) => postId in state.posts.dictionary ? state.posts.dictionary[postId] : null)

    const startEdit = function() {
        let newDraft = {
            content: '',
            fileId: null,
            linkPreviewId: null
        }

        if ( post ) {
            newDraft = {
                content: post.content,
                fileId: post.fileId,
                linkPreviewId: post.linkPreviewId
            }
        }
        setDraft(newDraft)
    }

    return (
        <FloatingMenuItem onClick={() => startEdit()} className="edit"><PencilIcon /> edit</FloatingMenuItem> 
    )

}

export default EditPost 
