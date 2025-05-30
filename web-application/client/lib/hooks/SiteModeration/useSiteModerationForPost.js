import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getSiteModerations } from '/state/admin/siteModeration'

export const useSiteModerationForPost = function(postId) {
    const moderation = useSelector(function(state) {
        if ( ! postId || ! (postId in state.siteModeration.byPostId) ) {
            return null
        }
        return state.siteModeration.byPostId[postId]
    })

    const [request, makeRequest] = useRequest()

    useEffect(() => {
        if ( postId && ! moderation) {
            makeRequest(getSiteModerations('useSiteModerationForPost', { postId: postId, postCommentId: null }))
        }
    }, [ postId, moderation])

    return [moderation, request]
}
