import { usePost } from '/lib/hooks/Post'
import { usePostDraft } from '/lib/hooks/usePostDraft'

import DraftImageFile from '/components/files/DraftImageFile'

import './PostFileAttachment.css'

const PostFileAttachment = function({ postId, groupId, sharedPostId }) {

    const [post] = usePost(postId) 

    const [draft, setDraft] = usePostDraft(postId, groupId, sharedPostId)

    const setFileId = function(fileId) {
        const newDraft = { ...draft }
        newDraft.linkPreviewId = null 
        newDraft.fileId = fileId 
        newDraft.sharedPostId = null
        setDraft(newDraft)
    }

    if ( draft.fileId === null || draft.fileId === undefined ) {
        return null
    }

    return (
        <div className="attachment">
            <div className="attached">
                <DraftImageFile fileId={draft.fileId} setFileId={setFileId} width={650} deleteOnRemove={ ! post || post.fileId != draft.fileId } />
            </div>
        </div>
    )

}

export default PostFileAttachment
