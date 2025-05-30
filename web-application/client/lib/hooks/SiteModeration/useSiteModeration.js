import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getSiteModeration } from '/state/admin/siteModeration'

export const useSiteModeration = function(id) {
    const moderation = useSelector((state) => id && id in state.siteModeration.dictionary ? state.siteModeration.dictionary[id] : null)

    const [request, makeRequest] = useRequest()

    useEffect(() => {
        if ( id && moderation === null) {
            makeRequest(getSiteModeration(id))
        }
    }, [ id, moderation])

    return [moderation, request]
}
