import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getGroup } from '/state/Group'

export const useGroup = function(groupId) {
    const group = useSelector((state) => {
        if ( ! groupId ) {
            return undefined
        }

        if ( ! (groupId in state.Group.dictionary ) ) {
            return undefined
        }

        return state.Group.dictionary[groupId] 
    })

    const [request, makeRequest ] = useRequest()

    useEffect(() => {
        if ( groupId  && group === undefined && request?.state !== 'pending') {
            makeRequest(getGroup(groupId))
        }
    }, [ groupId, group, request ])

    return [group, request]
}
