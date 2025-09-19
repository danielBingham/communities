import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getUsers } from '/state/User'

export const useUserByUsername = function(username) {

    const query = useSelector((state) => username in state.User.queries ? state.User.queries[username] : undefined)
    const user = useSelector((state) => { 
        if ( query === undefined && ! (username in state.User.byUsername) ) {
            return undefined
        } else if ( query !== undefined && ! (username in state.User.byUsername) ) {
            return null
        }
        return state.User.byUsername[username] 
    })

    const [request, makeRequest ] = useRequest()

    useEffect(() => {
        if ( username && user === undefined && request?.state !== 'pending' ) {
            makeRequest(getUsers(username, { username: username }))
        }
    }, [ username, user, request ])

    return [user, request]
}
