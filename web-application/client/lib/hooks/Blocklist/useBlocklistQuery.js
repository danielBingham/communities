import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getBlocklists, clearBlocklistQuery } from '/state/Blocklist'

export const useBlocklistQuery = function(queryParameters) {
    const params = queryParameters ? queryParameters : {}

    // TODO TECHDEBT The order of items in an object is not guaranteed, so just
    // because the params objects are the same does not mean the generated keys are the
    // same.  We'll probably want a solution for this at some point.
    const key = JSON.stringify(params)

    const query = useSelector((state) => key in state.Blocklist.queries ? state.Blocklist.queries[key] : null)

    const [ request, makeRequest, resetRequest ] = useRequest()

    const dispatch = useDispatch()

    useEffect(() => {
        if ( query === null && request === null ) {
            makeRequest(getBlocklists(key, params)) 
        }

        return () => {
            if ( request !== null && request.state === 'fulfilled' ) {
                dispatch(clearBlocklistQuery({ name: key })) 
                resetRequest()
            }
        }
    }, [ key, query, request ])

    return [query, request]
}


