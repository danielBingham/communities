import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getGroups } from '/state/Group'

export const useGroupFromSlug = function(slug, relations) {
    const [request, makeRequest, resetRequest ] = useRequest()

    const query = useSelector(function(state) {
        if ( slug === undefined || slug === null ) {
            return null
        }

        if ( ! (slug in state.Group.queries) ) {
            return undefined
        }

        return state.Group.queries[slug]
    })

    let id = undefined
    if ( query !== undefined && query !== null ) {
        if ( query.list.length <= 0 ) {
            id = null
        } else {
            id = query.list[0]
        }
    } else if ( query === null ) {
        id = null
    }

    const group = useSelector(function(state)  {
        if ( id === undefined ) {
            return undefined
        }
        if ( id === null ) {
            return null
        }

        if ( ! (id in state.Group.dictionary ) ) {
            return null
        }

        return state.Group.dictionary[id]
    })

    useEffect(() => {
        if ( slug && group === undefined && request?.state !== 'pending') {
            makeRequest(getGroups(slug, { slug: slug, relations: relations }))
        }
    }, [ slug, JSON.stringify(relations), group])

    return [group, request]
}
