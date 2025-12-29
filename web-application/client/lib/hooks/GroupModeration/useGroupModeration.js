import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'
import { useFeature } from '/lib/hooks/feature'

import { getGroupModeration } from '/state/GroupModeration'

export const useGroupModeration = function(groupId, id) {
    const moderation = useSelector((state) => id && id in state.GroupModeration.dictionary ? state.GroupModeration.dictionary[id] : null)

    const [request, makeRequest] = useRequest()

    useEffect(() => {
        if ( groupId && id && moderation === null) {
            makeRequest(getGroupModeration(groupId, id))
        }
    }, [ groupId, id, moderation])

    return [moderation, request]
}
