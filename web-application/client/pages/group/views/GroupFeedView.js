import React from 'react'
import { useSelector } from 'react-redux'

import { useGroup, useGroupMember } from '/lib/hooks/group'

import { canView } from '/lib/group'

import Feed from '/components/feeds/Feed'

const GroupFeedView = function({ groupId }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [group, groupError] = useGroup(groupId) 
    const [currentMember, currentMemberError] = useGroupMember(groupId, currentUser?.id)

    if ( ! canView(group, currentMember) ) {
        return (<div className="group-feed-view__private">The contents of this group are private.</div>)
    }

    return (
        <div>
            <Feed type="group" /> 
        </div>
    )
}

export default GroupFeedView
