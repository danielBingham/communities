import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'
import { useFeature } from '/lib/hooks/feature'

import { getGroupModeration } from '/state/GroupModeration'

export const useGroupModeration = function(id) {
    const moderation = useSelector((state) => id && id in state.GroupModeration.dictionary ? state.GroupModeration.dictionary[id] : null)

    const [request, makeRequest] = useRequest()

    useEffect(() => {
        if ( id && moderation === null) {
            makeRequest(getGroupModeration(id))
        }
    }, [ id, moderation])

    return [moderation, request]
}
