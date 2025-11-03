import { usePost } from '/lib/hooks/Post'
import { usePostDraft } from '/lib/hooks/usePostDraft'

import { XCircleIcon } from '@heroicons/react/24/solid'

import { useLinkPreview } from '/lib/hooks/LinkPreview'

import LinkPreview from '/components/links/view/LinkPreview'

import './PostLinkPreviewAttachment.css'

const PostLinkPreviewAttachment = function({ postId, groupId, sharedPostId }) {

    const [post] = usePost(postId) 

    const [draft, setDraft] = usePostDraft(postId, groupId, sharedPostId)

    const [linkPreview, request] = useLinkPreview(draft?.linkPreviewId)

    const setLinkPreviewId = function(linkPreviewId) {
        const newDraft = { ...draft }

        if ( linkPreviewId === null && linkPreview ) {
            if ( 'ignoredLinks' in newDraft ) {
                newDraft.ignoredLinks = [ ...newDraft.ignoredLinks, linkPreview.url ]
            } else {
                newDraft.ignoredLinks = [ linkPreview.url ]
            }
        }

        newDraft.linkPreviewId = linkPreviewId 
        newDraft.fileId = null 
        newDraft.sharedPostId = null
        setDraft(newDraft)
    }

    if ( draft.linkPreviewId === null || draft.linkPreviewId === undefined ) {
        return null
    }

    if ( linkPreview === null && request?.state !== 'pending' ) {
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
