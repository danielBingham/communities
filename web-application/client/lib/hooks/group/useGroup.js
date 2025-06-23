import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getGroup } from '/state/Group'

export const useGroup = function(groupId) {
    const group = useSelector((state) => groupId && groupId in state.Group.dictionary ? state.Group.dictionary[groupId] : null)

    const [request, makeRequest ] = useRequest()

    useEffect(() => {
        if ( groupId  && group === null && request === null ) {
            makeRequest(getGroup(groupId))
        }
    }, [ groupId, group, request ])

    return [group, request]
}
