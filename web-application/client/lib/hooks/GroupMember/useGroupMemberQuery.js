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

    useEffect(() => {
        if ( skip ) {
            return
        }

        if ( query === undefined && request === null ) {
            makeRequest(getGroupMembers(groupId, key, params)) 
        }
    }, [ key, query, request ])

    return [query, request, resetRequest]
}


