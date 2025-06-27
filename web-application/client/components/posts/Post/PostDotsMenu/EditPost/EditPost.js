import React from 'react'
import { useSelector } from 'react-redux'

import { PencilIcon } from '@heroicons/react/24/outline'

import { usePostDraft } from '/lib/hooks/usePostDraft'
import { FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

const EditPost = function({ postId }) {
    const [draft, setDraft] = usePostDraft(postId)

    const post = useSelector((state) => postId in state.Post.dictionary ? state.Post.dictionary[postId] : null)

    const startEdit = function() {
        let newDraft = {
            content: '',
            fileId: null,
            linkPreviewId: null,
            visibility: 'private'
        }

        if ( post ) {
            newDraft = {
                content: post.content,
                fileId: post.fileId,
                linkPreviewId: post.linkPreviewId,
                visibility: post.visibility
            }
        }
        setDraft(newDraft)
    }

    return (
        <FloatingMenuItem onClick={() => startEdit()} className="edit"><PencilIcon /> Edit</FloatingMenuItem> 
    )

}

export default EditPost 
