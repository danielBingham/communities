import React from 'react'
import { useSelector } from 'react-redux'

import { CheckCircleIcon, XCircleIcon, FlagIcon } from '@heroicons/react/20/solid'

import { canModerate } from '/lib/site'
import { useRequest } from '/lib/hooks/useRequest'

import { patchSiteModeration } from '/state/admin/siteModeration'

import './PostModeration.css'

const PostModeration = function({ postId }) {
    const currentUser = useSelector((state) => state.authentication.currentUser)
    const moderation = useSelector((state) => postId && postId in state.siteModeration.byPostId ? state.siteModeration.byPostId[postId] : null)

    const [request, makeRequest] = useRequest()

    const moderate = function(event, status) {
        event.preventDefault()

        const patch = {
            id: moderation.id,
            userId: currentUser.id,
            status: status,
            postId: postId 
        }
        makeRequest(patchSiteModeration(patch))
    }

    if ( ! currentUser ) {
        return null
    }

    if ( moderation === null ) {
        return null
    }

    if ( moderation.status !== 'flagged' ) {
        return null
    }

    if ( canModerate(currentUser) ) {
        return (
            <div className="post-moderation">
                <a href="" onClick={(e) => { moderate(e, 'approved') }} className="post-moderation__approve"><CheckCircleIcon /></a>
                <a href="" onClick={(e) => { moderate(e, 'removed') }} className="post-moderation__remove"><XCircleIcon /></a>
            </div>
        )
    } else {
        return (
            <div className="post-moderation">
                <span className="post-moderation__flagged"><FlagIcon /></span>
            </div>
        )
    }
}

export default PostModeration
