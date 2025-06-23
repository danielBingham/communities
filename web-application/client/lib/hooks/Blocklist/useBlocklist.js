import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getBlocklist } from '/state/Blocklist'

export const useBlocklist = function(id) {
    const blocklist = useSelector((state) => id in state.Blocklist.dictionary ? state.Blocklist.dictionary[id] : null)

    const [ request, makeRequest ] = useRequest()

    useEffect(() => {
        if ( id && blocklist === null && request === null ) {
            makeRequest(getBlocklist(id)) 
        }
    }, [ id, blocklist, request ])

    return [blocklist, request]
}
