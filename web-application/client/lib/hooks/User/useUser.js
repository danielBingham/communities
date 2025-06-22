import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getUser } from '/state/users'

export const useUser = function(id) {
    const user = useSelector((state) => id && id in state.User.dictionary ? state.User.dictionary[id] : null)

    const [request, makeRequest] = useRequest()

    useEffect(() => {
        if ( id && user === null ) {
            makeRequest(getUser(id))
        }
    }, [ id ])

    return [user, request]
}
