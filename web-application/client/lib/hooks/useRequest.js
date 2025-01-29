import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

import { cleanupRequest } from '/state/requests'

export function useRequest() {
    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if (requestId ) {
            return state.requests.requests[requestId]
        } else {
            return null
        }
    })

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    return [ request, setRequestId ]
}
