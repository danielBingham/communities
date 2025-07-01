import React from 'react'
import { useSelector } from 'react-redux'

import GroupList from '/components/groups/GroupList'

import './YourGroups.css'

const YourGroups = function() {

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const params = {
        memberStatus: 'any'
    }

    return (
        <div className="your-groups">
            <GroupList params={ params } />
        </div>
    )
}

export default YourGroups

