import React from 'react'

import GroupList from '/components/groups/list/GroupList'

import './FindGroups.css'

const FindGroups = function() {

    return (
        <div className="find-groups">
            <GroupList name="find-groups" />
        </div>
    )
}

export default FindGroups
