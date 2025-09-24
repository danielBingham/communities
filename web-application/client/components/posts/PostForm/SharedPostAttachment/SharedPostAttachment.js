import { usePost } from '/lib/hooks/Post'
import { usePostDraft } from '/lib/hooks/usePostDraft'

import Post from '/components/posts/Post'

import './SharedPostAttachment.css'

const SharedPostAttachment = function({ postId, groupId, sharedPostId }) {

    const [draft, setDraft] = usePostDraft(postId, groupId, sharedPostId)

    if ( draft.sharedPostId === null || draft.sharedPostId === undefined ) {
        return null
    }

    return (
        <div className="shared-post">
            <Post id={draft.sharedPostId} shared={true} />
        </div>
    )

}

export default SharedPostAttachment
