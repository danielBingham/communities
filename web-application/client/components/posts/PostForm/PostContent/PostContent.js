import { useState } from 'react'

import logger from '/logger'

import { useGroup } from '/lib/hooks/Group'
import { usePost } from '/lib/hooks/Post'
import { usePostDraft } from '/lib/hooks/usePostDraft'

import TextAreaWithMentions from '/components/posts/TextAreaWithMentions'

import './PostContent.css'

const PostContent = function({ postId, groupId, sharedPostId }) {
    const [ error, setError] = useState(null)

    const [post] = usePost(postId) 
    const [group] = useGroup(post !== null ? post.groupId : groupId)

    const [draft, setDraft] = usePostDraft(postId, groupId, sharedPostId)

    const setContent = function(content) {
        logger.debug(`## PostContent :: -- setContent: `, content)
        const newDraft = { ...draft }
        newDraft.content = content 
        setDraft(newDraft)
    }

    const onContentChange = function(newContent) {
        if ( newContent.length > 10000 ) {
            setError('overlength')
        } else {
            setError('')
            setContent(newContent)
        }
    }

    let errorView = null
    if ( error === 'overlength') {
        errorView = (
            <div className="error">Posts are limited to 10,000 characters...</div>
        )
    }


    return (
        <div className="post-content">
            <TextAreaWithMentions
                value={draft.content}
                setValue={onContentChange}
                placeholder={group ? `Write a post in ${group.title}...` : "Write a post to your feed..." }
                groupId={groupId}
            />

            { errorView }
        </div>
    )

}

export default PostContent
