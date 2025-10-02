import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getUser } from '/state/User'

export const useUser = function(id) {
    const user = useSelector((state) => {
        if ( ! id ) {
            return null
        }
        if ( ! ( id in state.User.dictionary ) ) {
            return undefined
        }
        return state.User.dictionary[id] 
    })

    const [request, makeRequest ] = useRequest()

    useEffect(() => {
        if ( id && user === undefined && request?.state !== 'pending') {
            makeRequest(getUser(id))
        }
    }, [ id, user, request])

    return [user, request]
}
