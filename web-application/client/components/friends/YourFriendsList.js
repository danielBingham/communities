import React  from 'react'
import { useSelector } from 'react-redux'

import UserInvite from '/components/users/input/UserInvite' 
import UserListView from '/components/users/list/UserListView'

import './YourFriendsList.css'

const YourFriendsList = function() {
    const currentUser = useSelector((state) => state.authentication.currentUser)

    return (
        <div className="your-friends-list">
            <UserInvite />
            <UserListView params={{ friendOf: currentUser.id }} />
        </div>
    )
}

export default YourFriendsList
