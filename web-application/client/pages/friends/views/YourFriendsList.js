import React  from 'react'
import { useSelector } from 'react-redux'

import UserInvite from '/components/users/input/UserInvite' 
import FriendList from '/components/friends/list/FriendList'

import './YourFriendsList.css'

const YourFriendsList = function() {
    const currentUser = useSelector((state) => state.authentication.currentUser)

    return (
        <div className="your-friends-list">
            <FriendList userId={currentUser.id} params={{ status: 'confirmed' }} />
        </div>
    )
}

export default YourFriendsList
