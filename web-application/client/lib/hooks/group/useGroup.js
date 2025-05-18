import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

import logger from '/logger'

import { useRequest } from '/lib/hooks/useRequest'

import { getGroup } from '/state/groups'

export const useGroup = function(groupId) {
    const [error, setError] = useState(null)

    const group = useSelector((state) => groupId && groupId in state.groups.dictionary ? state.groups.dictionary[groupId] : null)

    const [request, makeRequest] = useRequest()

    useEffect(() => {
        if ( groupId !== undefined && groupId !== null && group === null ) {
            makeRequest(getGroup(groupId))
        }
    }, [ groupId, group ])

    useEffect(() => {
        if ( request && request.state == 'failed' ) {
            setError(request.error)
        }
    }, [ request ])

    return [group, error, request]
}
