import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getUsers, clearUserQuery } from '/state/User'
import { cleanupRelations } from '/state/lib'

export const useUserByUsername = function(username) {
    const user = useSelector((state) => username in state.User.byUsername ? state.User.byUsername[username] : null)

    const [request, makeRequest, resetRequest] = useRequest()

    const dispatch = useDispatch()

    useEffect(() => {
        if ( username && request === null && user === null ) {
            makeRequest(getUsers(username, { username: username }))
        }
    }, [ username, user, request ])

    return [user, request]
}
