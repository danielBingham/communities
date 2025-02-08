import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { getGroups } from '/state/groups'

import GroupBadge from '/components/groups/view/GroupBadge'

import './YourGroups.css'

const YourGroups = function() {

    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const groups = useSelector((state) => 'YourGroups' in state.groups.queries ? state.groups.queries['YourGroups'].list : [])

    useEffect(() => {
        if ( currentUser ) {
            makeRequest(getGroups('YourGroups', { userId: currentUser.id }))
        }
    }, [ currentUser ])

    const groupViews = []
    for(const id of groups) {
        groupViews.push(<GroupBadge id={id} />)
    }

    return (
        <div className="your-groups">
            { groupViews }
        </div>
    )
}

export default YourGroups
