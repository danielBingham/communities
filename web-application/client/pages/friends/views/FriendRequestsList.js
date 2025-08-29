import { useSelector } from 'react-redux'

import FriendList from '/components/friends/list/FriendList'

const FriendRequestsList = function() {

    const currentUser = useSelector((state) => state.authentication.currentUser)

    return (
        <div className="friend-request-list">
            <FriendList descriptor="Requests" userId={currentUser.id} params={{ status: 'pending', user: { status: 'confirmed'} }} />
        </div>
    )
}

export default FriendRequestsList
