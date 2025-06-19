import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getUsers, clearUserQuery } from '/state/users'

export const useUserByUsername = function(username) {
    const user = useSelector((state) => username in state.users.byUsername ? state.users.byUsername[username] : null)

    const [request, makeRequest, resetRequest] = useRequest()

    const dispatch = useDispatch()

    useEffect(() => {
        if ( username && request === null && user === null ) {
            makeRequest(getUsers(username, { username: username }))
        }

        return () => {
            if ( request !== null && request.state === 'fulfilled' ) {
                dispatch(clearUserQuery(username))
                resetRequest()
            }
        }
    }, [ username, user, request ])

    return [user, request]
}
