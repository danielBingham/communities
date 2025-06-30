import React, { useState } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'
import { GroupPermissions, useGroupPermission } from '/lib/hooks/permission'

import { usePost } from '/lib/hooks/Post'
import { useGroupModeration } from '/lib/hooks/GroupModeration'

import { patchGroupModeration } from '/state/GroupModeration'

import TextBox from '/components/generic/text-box/TextBox'
import Button from '/components/generic/button/Button'
import Spinner from '/components/Spinner'
import Modal from '/components/generic/modal/Modal'
import ErrorModal from '/components/errors/ErrorModal'

const ModeratePostForGroupModal = function({ postId, isVisible, setIsVisible }) {
    const [reason, setReason] = useState('')
   
    const [post, postRequest] = usePost(postId)
    const [groupModeration, groupModerationRequest] = useGroupModeration(post?.groupModerationId)

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const canModerateGroup = useGroupPermission(currentUser, GroupPermissions.MODERATE, post?.groupId)

    const [request, makeRequest] = useRequest()

    const moderate = function(status) {
            const patch = {
                id: groupModeration.id,
                userId: currentUser.id,
                status: status,
                reason: reason,
                postId: postId,
                groupId: post.groupId
            }
            makeRequest(patchGroupModeration(patch))
    }

    if ( canModerateGroup !== true ) {
        return null
    }

    if ( request && request.state === 'pending' ) {
        return (
            <div className="moderate-post-for-group">
                <Spinner />
            </div>
        )
    }

    let error = null
    if ( request && request.state === 'failed' ) {
        error = (
            <ErrorModal>
                Attempt to moderate post failed on the backend.  Please report as a bug!
            </ErrorModal>
        )
    }


    return (
        <Modal isVisible={isVisible} setIsVisible={setIsVisible}>
            <div className="moderate-post-for-group">
                <h2>Moderate Post for Group</h2>
                <TextBox
                    name="reason"
                    className="reason"
                    label="Moderation Reason (Optional)"
                    explanation={`Optionally enter a short explanation for your moderation decision.`}
                    value={reason}
                    onChange={(e) => { setReason(e.target.value)}}
                />
                <Button type="warn" onClick={() => moderate('rejected')}>Reject</Button>
                <Button type="success" onClick={() => moderate('approved')}>Approve</Button>
                { error }
            </div>
        </Modal>
    )
}

export default ModeratePostForGroupModal
