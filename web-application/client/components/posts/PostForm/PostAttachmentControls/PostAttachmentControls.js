import { useState } from 'react'

import { LinkIcon } from '@heroicons/react/24/outline'

import logger from '/logger'

import { useGroup } from '/lib/hooks/Group'
import { usePost } from '/lib/hooks/Post'
import { usePostDraft } from '/lib/hooks/usePostDraft'

import Modal from '/components/generic/modal/Modal'
import FileUploadInput from '/components/files/FileUploadInput'
import Button from '/components/generic/button/Button'

import LinkForm from './LinkForm'

import './PostAttachmentControls.css'

const PostAttachmentControls = function({ postId, groupId, sharedPostId }) {
    const [ showLinkForm, setShowLinkForm] = useState(false)

    const [post] = usePost(postId) 
    const [group] = useGroup(post !== null ? post.groupId : groupId)

    const [draft, setDraft] = usePostDraft(postId, groupId, sharedPostId)

    const setFileId = function(fileId) {
        const newDraft = { ...draft }
        newDraft.linkPreviewId = null 
        newDraft.fileId = fileId 
        newDraft.sharedPostId = null
        setDraft(newDraft)
    }

    if ( draft.sharedPostId || draft.fileId || draft.linkPreviewId ) {
        return null
    }

    return (
        <div className="attachment-controls">
            <div className="post-form__image">
                <FileUploadInput 
                    text="Add Image"
                    fileId={draft.fileId} 
                    setFileId={setFileId} 
                    type='image'
                    types={[ 'image/jpeg', 'image/png' ]} 
                />
            </div>
            <div className="post-form__video">
                <FileUploadInput
                    text="Add Video"
                    fileId={draft.fileId}
                    setFileId={setFileId}
                    type='video'
                    types={[ 'video/mp4' ]}
                />
            </div>
        </div>
    )

}

export default PostAttachmentControls
