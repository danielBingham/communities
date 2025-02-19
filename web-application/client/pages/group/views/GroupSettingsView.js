import React from 'react'

import { useGroup, useCurrentGroupMember } from '/lib/hooks/group'

import { canAdmin } from '/lib/group'

import GroupEditForm from '/components/groups/form/GroupEditForm'


const GroupSettingsView = function({ groupId }) {

    const [group, groupError] = useGroup(groupId) 
    const [currentMember, currentMemberError] = useCurrentGroupMember(groupId)

    if ( ! canAdmin(group, currentMember) ) {
        return (null)
    }

    return (
        <div>
            <GroupEditForm groupId={groupId} /> 
        </div>
    )
}

export default GroupSettingsView
