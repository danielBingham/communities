import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'
import { useFeature } from '/lib/hooks/feature'

import { getSiteModerations } from '/state/SiteModeration'

export const useSiteModerationForPostComment = function(postId, postCommentId) {
    const moderation = useSelector(function(state) {
        if ( ! postId || ! (postId in state.SiteModeration.byPostCommentId) ) {
            return null
        }
        if ( ! postCommentId || !( postCommentId in state.SiteModeration.byPostCommentId[postId])) {
            return null
        }
        return state.SiteModeration.byPostCommentId[postId][postCommentId]
    })

    const [request, makeRequest] = useRequest()

    useEffect(() => {
        if ( postId && postCommentId && ! moderation) {
            makeRequest(getSiteModerations('useSiteModerationForPostComment', { postId: postId, postCommentId: postCommentId }))
        }
    }, [ postId, postCommentId, moderation])

    return [moderation, request]
}
