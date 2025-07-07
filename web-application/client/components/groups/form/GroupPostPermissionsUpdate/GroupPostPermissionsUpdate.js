import React, { useState } from 'react'

import * as shared from '@communities/shared'

import { patchGroup } from '/state/Group'

import { useLocalStorage } from '/lib/hooks/useLocalStorage'
import { useRequest } from '/lib/hooks/useRequest'

import { useGroup } from '/lib/hooks/Group'

import Spinner from '/components/Spinner'
import { Radio, RadioOption } from '/components/ui/Radio'
import Button from '/components/generic/button/Button'
import RequestError from '/components/errors/RequestError'

import './GroupPostPermissionsUpdate.css'

const GroupPostPermissionsUpdate = function({ groupId, onSubmit, onCancel }) {

    const [existing, groupRequest] = useGroup(groupId)

    const [postPermissions, setPostPermissions] = useLocalStorage('group.edit.draft.postPermissions', existing?.postPermissions ? existing?.postPermissions : 'members')

    const [postPermissionsErrors, setPostPermissionsErrors] = useState(null)

    const [request, makeRequest ] = useRequest()

    const validate = function(field) {
        let postPermissionsValidationErrors = []
        if ( ! field || field === 'postPermissions' ) {
            postPermissionsValidationErrors = shared.validation.Group.validatePostPermissions(postPermissions)
            if ( postPermissionsValidationErrors.length > 0 ) {
                setPostPermissionsErrors(typeValidationErrors.reduce((string, error) => `${string} ${error.message}`, ''))
            } else {
                setPostPermissionsErrors(null)
            }
        }


        return  postPermissionsValidationErrors.length === 0
    }

    const onSubmitInternal = function(event) {
        event.preventDefault()

        if ( ! validate() ) {
            return
        }

        setPostPermissions(null)

        const groupPatch = {
            id: groupId,
            postPermissions: postPermissions
        }

        makeRequest(patchGroup(groupPatch))

        if ( onSubmit && typeof onSubmit === 'function' ) {
            onSubmit(event)
        }
    }

    const cancel = function() {
        setPostPermissions(null)

        if ( onCancel && typeof onCancel === 'function' ) {
            onCancel()
        }
    }

    const inProgress = (request && request.state == 'pending')
    return (
        <form onSubmit={onSubmitInternal} className="group-post-permissions-update">
            <Radio 
                className="group-post-permissions-update__post-permissions" 
                name="postPermissions"
                title="Posting Permissions" 
                explanation="Who can post in this group?"
                error={postPermissionsErrors} 
            >
                <RadioOption
                    name="postPermissions"
                    label="Anyone"
                    value="anyone"
                    current={postPermissions}
                    explanation="Anyone who can see the group and its content may post in it, whether they are members or not."
                    onClick={(e) => setPostPermissions('anyone')}
                />
                <RadioOption
                    name="postPermissions"
                    label="Members"
                    value="members"
                    current={postPermissions}
                    explanation="Only group members may post in the group."
                    onClick={(e) => setPostPermissions('members')}
                    />
                <RadioOption
                    name="postPermissions"
                    label="Require Approval"
                    value="approval"
                    current={postPermissions}
                    explanation="Group moderators must approval all posts before they are posted to the group."
                    onClick={(e) => setPostPermissions('approval')}
                />
                <RadioOption
                    name="postPermissions"
                    label="Restricted"
                    value="restricted"
                    current={postPermissions}
                    explanation="Only group moderators and admins may post in the group."
                    onClick={(e) => setPostPermissions('restricted')}
                />
            </Radio>
            { inProgress && <Spinner /> }
            { ! inProgress && <div className="group-post-permissions-update__controls">
                <Button onClick={(e) => cancel()}>Cancel</Button> 
                <input type="submit" name="submit" value="Submit" />
            </div> }
            <RequestError request={request} message={"Create Group"} />
        </form>
    )

}

export default GroupPostPermissionsUpdate
