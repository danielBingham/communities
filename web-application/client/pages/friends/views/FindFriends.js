import React from 'react'

import UserListView from '/components/users/list/UserListView'

import './FindFriends.css'

const FindFriends = function() {

    // ======= Render State =========================================

    return (
        <div className="find-friends">
            <UserListView  /> 
        </div>
    )

}

export default FindFriends
