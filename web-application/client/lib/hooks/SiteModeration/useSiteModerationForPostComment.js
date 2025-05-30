import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getSiteModerations } from '/state/admin/siteModeration'

export const useSiteModerationForPostComment = function(postId, postCommentId) {
    const moderation = useSelector(function(state) {
        if ( ! postId || ! (postId in state.siteModeration.byPostCommentId) ) {
            return null
        }
        if ( ! postCommentId || !( postCommentId in state.siteModeration.byPostCommentId[postId])) {
            return null
        }
        return state.siteModeration.byPostCommentId[postId][postCommentId]
    })

    const [request, makeRequest] = useRequest()

    useEffect(() => {
        if ( postId && postCommentId && ! moderation) {
            console.log(`Getting moderation for ${postId} and ${postCommentId}.`)
            makeRequest(getSiteModerations('useSiteModerationForPostComment', { postId: postId, postCommentId: postCommentId }))
        }
    }, [ postId, postCommentId, moderation])

    return [moderation, request]
}
