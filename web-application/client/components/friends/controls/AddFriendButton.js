import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { resetEntities } from '/state/lib'
import { postUserRelationships } from '/state/UserRelationship'

import Button from '/components/generic/button/Button'

import './AddFriendButton.css'

const AddFriendButton = function({ userId }) {

    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const dispatch = useDispatch()

    const addFriend = function() {
        const relationship = {
            userId: currentUser.id,
            relationId: userId,
            status: 'pending'
        }

        makeRequest(postUserRelationships(relationship))
    }

    useEffect(function() {
        if ( request?.state === 'failed' && (request?.response.status === 404 || request?.response.status === 403) ) {
            // TODO There's probably a better way to handle this.
            // That relationship doesn't exist.  Reset entities to requery.
            dispatch(resetEntities())
        }
    }, [ request ])

    if ( ! currentUser || currentUser.id == userId) {
        return null
    }

    return (
         <Button type="primary" onClick={() => addFriend()}>Add Friend</Button>
    )

}

export default AddFriendButton
