import React from 'react'
import { Link } from 'react-router-dom'

import { useUserByUsername } from '/lib/hooks/User'

const UserMention = function({ username }) {
    const [user] = useUserByUsername(username)

    if ( user === null ) {
        return (
            <span className="user-mention"><Link to={`/${username}`}>@{ username }</Link></span>
        )
    }

    return (
        <span className="user-mention"><Link to={`/${user.username}`}>@{ user.name }</Link></span>
    )
}

export default UserMention
