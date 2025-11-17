import React, { useState } from 'react'
import { useSelector } from 'react-redux'

import can, {Actions, Entities} from '/lib/permission'

import { useRequest } from '/lib/hooks/useRequest'

import { usePost } from '/lib/hooks/Post'
import { usePostComment } from '/lib/hooks/PostComment'
import { useSiteModeration } from '/lib/hooks/SiteModeration'

import { patchSiteModeration } from '/state/SiteModeration'

import TextBox from '/components/generic/text-box/TextBox'
import Button from '/components/generic/button/Button'
import Spinner from '/components/Spinner'
import Modal from '/components/generic/modal/Modal'
import ErrorModal from '/components/errors/ErrorModal'

const ModerateForSiteModal = function({ postId, postCommentId, isVisible, setIsVisible }) {
    const [reason, setReason] = useState('')
   
    const [post, postRequest] = usePost(postId)
    const [comment, commentRequest] = usePostComment(postId, postCommentId)

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [siteModeration, siteModerationRequest] = useSiteModeration(comment ? comment?.siteModerationId : post?.siteModerationId)
    const canModerateSite = can(currentUser, Actions.moderate, Entities.Site)

    const [request, makeRequest] = useRequest()

    const moderate = function(status) {
            const patch = {
                id: siteModeration.id,
                userId: currentUser.id,
                status: status,
                reason: reason,
                postId: postId
            }
            if ( postCommentId ) {
                patch.postCommentId = postCommentId
            }
            makeRequest(patchSiteModeration(patch))
    }

    if ( canModerateSite !== true ) {
        return null
    }

    if ( request && request.state === 'pending' ) {
        return (
            <Modal isVisible={isVisible} setIsVisible={setIsVisible}>
                <div className="moderate-for-site">
                    <Spinner />
                </div>
            </Modal>
        )
    }

    const target = postCommentId ? 'Comment' : 'Post'

    let error = null
    if ( request && request.state === 'failed' ) {
        error = (
            <ErrorModal>
                Attempt to moderate { target } failed on the backend.  Please report as a bug!
            </ErrorModal>
        )
    }

    return (
        <Modal isVisible={isVisible} setIsVisible={setIsVisible}>
            <div className="moderate-for-site">
                <h2>Moderate { target } for Site</h2>
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

export default ModerateForSiteModal
