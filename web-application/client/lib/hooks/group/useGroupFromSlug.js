import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getGroups } from '/state/groups'

export const useGroupFromSlug = function(slug, relations) {
    const [error, setError] = useState(null)

    const [request, makeRequest] = useRequest()

    const query = useSelector((state) => 'GroupPage' in state.groups.queries ? state.groups.queries['GroupPage'] : null)
    const id = query ? query.list[0] : null
    const group = useSelector((state) => id !== null && id in state.groups.dictionary ? state.groups.dictionary[id] : null)

    useEffect(() => {
        if ( slug ) {
            makeRequest(getGroups('GroupPage', { slug: slug, relations: relations }))
        }
    }, [ slug, JSON.stringify(relations), query === null ])

    useEffect(() => {
        if ( request && request.state == 'failed' ) {
            setError(request.error)
        }
    }, [ request ])

    return [group, error, request]
}
