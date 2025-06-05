import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getBlocklist, removeBlocklist } from '/state/admin/blocklists'

export const useBlocklist = function(id) {
    const blocklist = useSelector((state) => id in state.blocklists.dictionary ? state.blocklists.dictionary[id] : null)

    const [ request, makeRequest, resetRequest ] = useRequest()

    const dispatch = useDispatch()

    useEffect(() => {
        if ( blocklist === null && request === null ) {
            makeRequest(getBlocklist(id)) 
        }

        return () => {
            if ( request !== null && request.state === 'fulfilled' ) {
                dispatch(removeBlocklist(blocklist)) 
                resetRequest()
            }
        }
    }, [ id, blocklist, request ])

    return [blocklist, request]
}
