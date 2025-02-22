import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'
import { useGroup, useCurrentGroupMember } from '/lib/hooks/group'

import { canAdmin } from '/lib/group'

import { deleteGroup } from '/state/groups'

import GroupEditForm from '/components/groups/form/GroupEditForm'
import Button from '/components/generic/button/Button'
import AreYouSure from '/components/AreYouSure'

import "./GroupSettingsView.css"

const GroupSettingsView = function({ groupId }) {

    const [ areYouSure, setAreYouSure ] = useState(false)

    const [request, makeRequest] = useRequest()

    const [group, groupError] = useGroup(groupId) 
    const [currentMember, currentMemberError] = useCurrentGroupMember(groupId)

    const navigate = useNavigate()
    const deleteCurrentGroup = function() {
        setAreYouSure(false)
        makeRequest(deleteGroup(group))
        navigate('/groups')
    }

    if ( ! canAdmin(group, currentMember) ) {
        return (null)
    }

    return (
        <div className="group-settings-view">
            <h2>Edit Group Details</h2>
            <div className="group-settings-view__edit">
                <GroupEditForm groupId={groupId} /> 
            </div>
            <h2>Danger Zone</h2>
            <div className="group-settings-view__delete-your-account">
                <div className="group-settings-view__explanation">Delete your account. This will delete
                all of your posts and images, as well as your profile. This cannot
                be undone. Please be certain.</div>
                <div className="group-settings-view__button-wrapper">
                    <Button type="primary-warn" onClick={(e) => setAreYouSure(true)}>Delete Group</Button>
                </div>
                <AreYouSure 
                    isVisible={areYouSure} 
                    action="delete this group" 
                    execute={deleteCurrentGroup} 
                    cancel={() => setAreYouSure(false)} 
                /> 
            </div>
        </div>
    )
}

export default GroupSettingsView
