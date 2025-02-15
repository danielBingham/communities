import React from 'react'
import { useSelector } from 'react-redux'

import GroupList from '/components/groups/list/GroupList'

import './YourGroups.css'

const YourGroups = function() {

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const params = {
        userId: currentUser.id
    }

    return (
        <div className="your-groups">
            <GroupList name="YourGroups" params={ params } />
        </div>
    )
}

export default YourGroups
