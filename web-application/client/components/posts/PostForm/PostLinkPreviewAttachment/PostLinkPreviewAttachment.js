import { usePost } from '/lib/hooks/Post'
import { usePostDraft } from '/lib/hooks/usePostDraft'

import './PostLinkPreviewAttachment.css'

const PostLinkPreviewAttachment = function({ postId, groupId, sharedPostId }) {

    const [post] = usePost(postId) 

    const [draft, setDraft] = usePostDraft(postId, groupId, sharedPostId)

    const setLinkPreviewId = function(linkPreviewId) {
        const newDraft = { ...draft }
        newDraft.linkPreviewId = linkPreviewId 
        newDraft.fileId = null 
        newDraft.sharedPostId = null
        setDraft(newDraft)
    }

    if ( draft.linkPreviewId === null || draft.linkPreviewId === undefined ) {
        return null
    }

    return (
        <div className="link-preview">
            <a className="remove" href="" onClick={(e) => { e.preventDefault(); setLinkPreviewId(null) }}><XCircleIcon /></a>
            <LinkPreview id={draft.linkPreviewId} />
        </div>
    )

}

export default PostLinkPreviewAttachment
