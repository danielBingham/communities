import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { getGroups, clearGroupQuery } from '/state/Group'

export const useGroupQuery = function(queryParameters, skip) {
    const params = queryParameters ? { ...queryParameters } : {}
    const [ searchParams, setSearchParams ] = useSearchParams()

    params.page = searchParams.get('page') || 1

    if ( searchParams.get('q') ) {
        params.title = searchParams.get('q')
    }

    // TODO TECHDEBT The order of items in an object is not guaranteed, so just
    // because the params objects are the same does not mean the generated keys are the
    // same.  We'll probably want a solution for this at some point.
    const key = JSON.stringify(params)

    const query = useSelector((state) => key in state.Group.queries ? state.Group.queries[key] : undefined)

    const [ request, makeRequest, resetRequest ] = useRequest()

    const dispatch = useDispatch()

    const reset = function() {
        dispatch(setGroupShouldQuery({ name: key, value: true }))
        resetRequest()
    }

    useEffect(() => {
        if ( skip ) {
            return
        }

        makeRequest(getGroups(key, params)) 

        return () => {
            if ( request?.state === 'fulfilled') {
                resetRequest()
                dispatch(clearGroupQuery({ name: key }))
            }
        }
    }, [ key ])

    useEffect(() => {
        if ( skip ) {
            return
        }

        if ( query === undefined && request?.state === 'fulfilled' ) {
            makeRequest(getGroups(key, params)) 
        }
    }, [ query, request ])

    return [query, request, resetRequest]
}


