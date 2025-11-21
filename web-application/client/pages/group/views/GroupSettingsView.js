import React, { useState, useLayoutEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import can, {Actions, Entities} from '/lib/permission'

import { useRequest } from '/lib/hooks/useRequest'
import { useGroup, useGroupPermissionContext } from '/lib/hooks/Group'

import { deleteGroup } from '/state/Group'

import GroupEditForm from '/components/groups/form/GroupEditForm'
import GroupPostPermissionsUpdate from '/components/groups/form/GroupPostPermissionsUpdate'
import Button from '/components/generic/button/Button'
import AreYouSure from '/components/AreYouSure'
import Modal from '/components/generic/modal/Modal'
import Card from '/components/ui/Card'
import Error404 from '/components/errors/Error404'
import { RequestErrorModal } from '/components/errors/RequestError'

import "./GroupSettingsView.css"

const GroupSettingsView = function({ groupId }) {

    const [ areYouSure, setAreYouSure ] = useState(false)
    const [ showPostPermissionsForm, setShowPostPermissionsForm ] = useState(false)

    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [context, requests] = useGroupPermissionContext(currentUser, groupId)
    const group = context.group
    const currentMember = context.userMember

    const canAdminGroup = can(currentUser, Actions.admin, Entities.Group, context)
    const canAdminSite = can(currentUser, Actions.admin, Entities.Site, context)

    const navigate = useNavigate()
    const deleteCurrentGroup = function() {
        setAreYouSure(false)
        makeRequest(deleteGroup(group))
    }

    useLayoutEffect(function() {
        if ( request?.state === 'fulfilled' ) {
            navigate('/groups')
        }
    }, [ request ])

    if ( ! currentMember ) {
        if ( canAdminGroup === true && canAdminSite !== true) {
            return (
                <div className="group-settings-view">
                    <Card className="group-settings-view__admin-non-member">
                        <p>You must join this group before you can administrate it.</p>
                    </Card>
                </div>
            )
        } else if ( canAdminGroup !== true ) {
            return ( 
                <div className="group-settings-view">
                    <Error404 /> 
                </div>
            ) 
        }
    }

    if ( canAdminGroup !== true ) {
            return ( 
                <div className="group-settings-view">
                    <Error404 /> 
                </div>
            ) 
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
                <Modal isVisible={showPostPermissionsForm} setIsVisible={setShowPostPermissionsForm} hideX={true}>
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
                <RequestErrorModal message="Attempt to delete the group" request={request} />
            </div>
        </div>
    )
}

export default GroupSettingsView
