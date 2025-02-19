import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getGroups } from '/state/groups'

export const useGroupFromSlug = function(slug, relations) {
    console.log(`====== useGroupFromSlug(${slug}, ${JSON.stringify(relations)}) ========`)
    const [error, setError] = useState(null)
    console.log(`useGroupFromSlug(${slug}, ${JSON.stringify(relations)}):: error:`)
    console.log(error)

    const [request, makeRequest, resetRequest ] = useRequest('useGroupFromSlug')
    console.log(`useGroupFromSlug(${slug}, ${JSON.stringify(relations)}):: request`)
    console.log(request)

    const query = useSelector((state) => 'GroupPage' in state.groups.queries ? state.groups.queries['GroupPage'] : null)
    console.log(`useGroupFromSlug(${slug}, ${JSON.stringify(relations)}):: query`)
    console.log(query)
    const id = query ? query.list[0] : null
    const group = useSelector((state) => id !== null && id in state.groups.dictionary ? state.groups.dictionary[id] : null)
    console.log(`useGroupFromSlug(${slug}, ${JSON.stringify(relations)}):: group`)
    console.log(group)

    useEffect(() => {
        console.log(`useGroupFromSlug(${slug}, ${JSON.stringify(relations)}):: === useEffect(getGroups) ===`)
        console.log(`useGroupFromSlug(${slug}, ${JSON.stringify(relations)}):: request:`)
        console.log(request)
        console.log(`useGroupFromSlug(${slug}, ${JSON.stringify(relations)}):: query:`)
        console.log(query)
        if ( slug && ! ( request && request.state == 'pending' )) {
            console.log(`useGroupFromSlug(${slug}, ${JSON.stringify(relations)}):: getGroups: makeRequest(getGroups())`)
            makeRequest(getGroups('GroupPage', { slug: slug, relations: relations }))
        }
    }, [ slug, JSON.stringify(relations), query === null ])

    useEffect(() => {
        if ( request && request.state == 'failed' ) {
            setError(request.error)
        }
    }, [ request ])

    console.log(`====== END useGroupFromSlug(${slug}, ${JSON.stringify(relations)}) ========`)
    return [group, error, request]
}
