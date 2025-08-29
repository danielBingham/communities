import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import {getUserRelationships, clearUserRelationshipQuery } from '/state/UserRelationship'

export const useUserRelationshipQuery = function(userId, queryParameters) {
    const params = queryParameters ? queryParameters : {}
    const [ searchParams, setSearchParams ] = useSearchParams()


    params.page = searchParams.get('page') || 1
    if ( searchParams.get('q') ) {
        if ( 'user' in params ) {
            params.user.name = searchParams.get('q')
        } else {
            params.user = {
                name: searchParams.get('q')
            }
        }
    } else if ( 'user' in params && ! searchParams.get('q') ) {
        delete params.user.name
    }


    // TODO TECHDEBT The order of items in an object is not guaranteed, so just
    // because the params objects are the same does not mean the generated keys are the
    // same.  We'll probably want a solution for this at some point.
    const key = JSON.stringify(params)

    const query = useSelector((state) => key in state.UserRelationship.queries ? state.UserRelationship.queries[key] : null)

    const [ request, makeRequest, resetRequest ] = useRequest()

    const dispatch = useDispatch()
    useEffect(() => {
        if ( query === null && request === null ) {
            makeRequest(getUserRelationships(key, userId, params)) 
        }

        return () => {
            if ( query !== null && request !== null && request.state === 'fulfilled' ) {
                dispatch(clearUserRelationshipQuery({ name: key }))
                resetRequest()
            }
        }
    }, [ key, query, request ])

    return [query, request]
}


