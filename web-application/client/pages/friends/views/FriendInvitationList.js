import { useSelector } from 'react-redux'

import FriendList from '/components/friends/list/FriendList'

const FriendInvitationList = function() {

    const currentUser = useSelector((state) => state.authentication.currentUser)

    return (
        <div className="invitation-list">
            <FriendList descriptor="Invitations" userId={currentUser.id} params={{ status: 'pending', user: { status: 'invited'} }} noSearch={true} />
        </div>
    )
}

export default FriendInvitationList 
