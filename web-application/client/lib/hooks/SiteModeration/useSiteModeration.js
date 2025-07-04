import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'
import { useFeature } from '/lib/hooks/feature'

import { getSiteModeration } from '/state/SiteModeration'

export const useSiteModeration = function(id) {
    const hasAdminModeration = useFeature('62-admin-moderation-controls')

    const moderation = useSelector((state) => id && id in state.SiteModeration.dictionary ? state.SiteModeration.dictionary[id] : null)

    const [request, makeRequest] = useRequest()

    useEffect(() => {
        if ( hasAdminModeration && id && moderation === null) {
            makeRequest(getSiteModeration(id))
        }
    }, [ id, moderation])

    if ( ! hasAdminModeration ) {
        return [null, null]
    }

    return [moderation, request]
}
