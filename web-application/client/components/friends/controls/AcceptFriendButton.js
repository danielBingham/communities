import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { resetEntities } from '/state/lib'
import { patchUserRelationship } from '/state/UserRelationship'

import Button from '/components/generic/button/Button'

import './AcceptFriendButton.css'

const AcceptFriendButton = function({ userId, type }) {

    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const dispatch = useDispatch()
    const acceptFriend = function() {
        const relationship = {
            userId: userId,
            relationId: currentUser.id,
            status: 'confirmed'
        }

        makeRequest(patchUserRelationship(relationship))
    }

    useEffect(() => {
        return () => {
            // Reset entities on unmount.  Unmount will occur when the patched
            // UserRelationship has been updated so that their state is no
            // longer pending.
            dispatch(resetEntities())
        }
    }, [])

    useEffect(function() {
        if ( request?.state === 'failed' && request?.response.status === 404 ) {
            // TODO There's probably a better way to handle this.
            // That relationship doesn't exist.  Reset entities to requery.
            dispatch(resetEntities())
        }
    }, [ request ])

    if ( ! currentUser || currentUser.id == userId) {
        return null
    }

    return (
        <Button type="primary" onClick={() => acceptFriend()}>Accept Request</Button>     
    )

}

export default AcceptFriendButton
