import React from 'react'
import { useSelector } from 'react-redux'

import { GroupPermissions, useGroupPermission  } from '/lib/hooks/permission'

import Feed from '/components/feeds/Feed'

const GroupFeedView = function({ groupId }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const canViewGroup = useGroupPermission(currentUser, GroupPermissions.VIEW, groupId)

    if ( ! canViewGroup ) {
        return (<div className="group-feed-view__private">The contents of this group are private.</div>)
    }

    return (
        <div>
            <Feed type="group" /> 
        </div>
    )
}

export default GroupFeedView
