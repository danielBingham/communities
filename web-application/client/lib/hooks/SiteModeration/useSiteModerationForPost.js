import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getSiteModerations } from '/state/SiteModeration'

export const useSiteModerationForPost = function(postId) {
    const moderation = useSelector(function(state) {
        if ( ! postId || ! (postId in state.SiteModeration.byPostId) ) {
            return null
        }
        return state.SiteModeration.byPostId[postId]
    })

    const [request, makeRequest] = useRequest()

    useEffect(() => {
        if ( postId && ! moderation) {
            makeRequest(getSiteModerations('useSiteModerationForPost', { postId: postId, postCommentId: null }))
        }
    }, [ postId, moderation])

    return [moderation, request]
}
