import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getBlocklist, removeBlocklist } from '/state/Blocklist'

export const useBlocklist = function(id) {
    const blocklist = useSelector((state) => id in state.Blocklist.dictionary ? state.Blocklist.dictionary[id] : null)

    const [ request, makeRequest, resetRequest ] = useRequest()

    const dispatch = useDispatch()

    useEffect(() => {
        if ( id && blocklist === null && request === null ) {
            makeRequest(getBlocklist(id)) 
        }

        return () => {
            if ( request !== null && request.state === 'fulfilled' ) {
                dispatch(removeBlocklist({ entity: blocklist })) 
                resetRequest()
            }
        }
    }, [ id, blocklist, request ])

    return [blocklist, request]
}
