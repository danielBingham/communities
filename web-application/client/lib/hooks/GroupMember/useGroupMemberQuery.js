import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { getGroupMembers, clearGroupMemberQuery } from '/state/GroupMember'

export const useGroupMemberQuery = function(groupId, queryParameters, skip) {
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

    const query = useSelector((state) => key in state.GroupMember.queries ? state.GroupMember.queries[key] : undefined)

    const [ request, makeRequest, resetRequest ] = useRequest()

    const dispatch = useDispatch()

    useEffect(() => {
        if ( skip ) {
            return
        }

        if ( query === undefined && request === null ) {
            makeRequest(getGroupMembers(groupId, key, params)) 
        }

        // If we don't do this, then changing the parameters won't resubmit the
        // request.  But doing this means that if two sibling components both
        // call useGroupMemberQuery at the same time with the same parameters,
        // we can get caught in an infinite loop of queries.
        return () => {
            if ( query !== undefined && query !== null && request?.state === 'fulfilled') {
                dispatch(clearGroupMemberQuery({ name: key }))
                resetRequest()
            }
        }
    }, [ key, query, request ])

    return [query, request, resetRequest]
}


