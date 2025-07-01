import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'
import { useGroup } from '/lib/hooks/Group'
import { GroupPermissions, useGroupPermission } from '/lib/hooks/permission'

import { deleteGroup } from '/state/Group'

import GroupEditForm from '/components/groups/form/GroupEditForm'
import GroupPostPermissionsUpdate from '/components/groups/form/GroupPostPermissionsUpdate'
import Button from '/components/generic/button/Button'
import AreYouSure from '/components/AreYouSure'
import Radio from '/components/ui/Radio'
import Modal from '/components/generic/modal/Modal'

import "./GroupSettingsView.css"

const GroupSettingsView = function({ groupId }) {

    const [ areYouSure, setAreYouSure ] = useState(false)
    const [ showPostPermissionsForm, setShowPostPermissionsForm ] = useState(false)

    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [group] = useGroup(groupId) 
    const canAdminGroup = useGroupPermission(currentUser, GroupPermissions.ADMIN, groupId)

    const navigate = useNavigate()
    const deleteCurrentGroup = function() {
        setAreYouSure(false)
        makeRequest(deleteGroup(group))
        navigate('/groups')
    }

    if ( ! canAdminGroup ) {
        return null
    }

    return (
        <div className="group-settings-view">
            <h2>Edit Group Details</h2>
            <div className="group-settings-view__edit">
                <GroupEditForm groupId={groupId} /> 
            </div>
            <h2>Danger Zone</h2>
            <div className="group-settings-view__update-post-permissions">
                <div className="group-settings-view__explanation">Update this group's posting permissions.</div>
                <div className="group-settings-view__button-wrapper">
                    <Button type="warn" onClick={(e) => setShowPostPermissionsForm(true)}>Change Posting Permissions</Button>
                </div>
                <Modal isVisible={showPostPermissionsForm} setIsVisible={setShowPostPermissionsForm}>
                    <GroupPostPermissionsUpdate groupId={groupId} onSubmit={(e) => setShowPostPermissionsForm(false)} onCancel={() => setShowPostPermissionsForm(false)} />
                </Modal>
            </div>
            <div className="group-settings-view__delete-your-account">
                <div className="group-settings-view__explanation">Delete this group. This will delete
                all posts and images in the group. This cannot
                be undone. Please be certain.</div>
                <div className="group-settings-view__button-wrapper">
                    <Button type="warn" onClick={(e) => setAreYouSure(true)}>Delete Group</Button>
                </div>
                <AreYouSure isVisible={areYouSure} execute={deleteCurrentGroup} cancel={() => setAreYouSure(false)}> 
                    <p>Are you sure you want to delete this group?</p>
                </AreYouSure>
            </div>
        </div>
    )
}

export default GroupSettingsView
