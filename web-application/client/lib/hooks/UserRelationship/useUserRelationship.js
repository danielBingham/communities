import { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getUserRelationship } from '/state/UserRelationship'

export const useUserRelationship = function(userId, relationId) {
    const relationship = useSelector((state) => {
        if ( ! userId || ! relationId ) {
            return null
        }

        if ( userId === relationId ) {
            return null
        }

        if ( ! ( userId in state.UserRelationship.byUserId ) ) {
            return undefined 
        }

        if ( ! ( relationId in state.UserRelationship.byUserId[userId]) ) {
            return undefined
        }

        return state.UserRelationship.byUserId[userId][relationId]
    })

    const [request, makeRequest ] = useRequest()

    useEffect(() => {
        if ( userId === relationId ) {
            return
        }

        if ( userId && relationId && relationship === undefined && request?.state !== 'pending') {
            makeRequest(getUserRelationship(userId, relationId))
        }
    }, [ userId, relationId, relationship, request])

    return [relationship, request]
}
