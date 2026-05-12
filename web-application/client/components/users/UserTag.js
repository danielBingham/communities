import React from 'react'
import { Link } from 'react-router-dom'

import { useUser } from '/lib/hooks/User'

import UserProfileImage from '/components/users/UserProfileImage'
import './UserTag.css'

const UserTag = function({ id, hideProfile }) {
    const [user, request] = useUser(id)

    // ======= Render ===============================================

    return (
        <span className="user-tag" >
            { ! user && <span>{ ! hideProfile && <UserProfileImage /> } Anonymous</span> }
            { user && <span>{ ! hideProfile && <UserProfileImage userId={user.id} /> } <Link to={`/${user.username}`}>{user.name}</Link></span> }
        </span> 
    )

}

export default UserTag
