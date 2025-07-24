import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { getPosts, clearPostQuery } from '/state/Post'

export const usePostQuery = function(queryParameters) {
    const params = queryParameters ? queryParameters : {}
    const [ searchParams, setSearchParams ] = useSearchParams()

    params.page = searchParams.get('page') || 1
    params.sort = searchParams.get('sort') || 'newest'
    params.since = searchParams.get('since') || 'always'

    // TODO TECHDEBT The order of items in an object is not guaranteed, so just
    // because the params objects are the same does not mean the generated keys are the
    // same.  We'll probably want a solution for this at some point.
    const key = JSON.stringify(params)

    const query = useSelector((state) => key in state.Post.queries ? state.Post.queries[key] : null)

    const [ request, makeRequest, resetRequest ] = useRequest()

    const dispatch = useDispatch()

    useEffect(() => {
        if ( query === null && request === null ) {
            makeRequest(getPosts(key, params)) 
        }

        return () => {
            if ( query !== null && request !== null && request.state === 'fulfilled' ) {
                dispatch(clearPostQuery({ name: key }))
                resetRequest()
            }
        }
    }, [ key, query, request ])

    return [query, request]
}


