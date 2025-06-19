import React, { useState } from 'react'
import { useSelector } from 'react-redux'

import { CheckCircleIcon, XCircleIcon, FlagIcon } from '@heroicons/react/20/solid'

import { SitePermissions, useSitePermission } from '/lib/hooks/permission'
import { useRequest } from '/lib/hooks/useRequest'

import { patchSiteModeration } from '/state/admin/siteModeration'

import TextBox from '/components/generic/text-box/TextBox'
import Button from '/components/generic/button/Button'
import Modal from '/components/generic/modal/Modal'
import Spinner from '/components/Spinner'
import ErrorModal from '/components/errors/ErrorModal'

import './PostModeration.css'

const PostModeration = function({ postId }) {
    const [showReason, setShowReason] = useState(false)

    const [reason, setReason] = useState('')
    const [status, setStatus] = useState('flagged')

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const moderation = useSelector((state) => postId && postId in state.siteModeration.byPostId ? state.siteModeration.byPostId[postId] : null)
    const canModerateSite = useSitePermission(currentUser, SitePermissions.MODERATE)

    const [request, makeRequest] = useRequest()

    const moderate = function() {
        const patch = {
            id: moderation.id,
            userId: currentUser.id,
            status: status,
            reason: reason,
            postId: postId 
        }
        makeRequest(patchSiteModeration(patch))
    }

    if ( ! currentUser ) {
        return null
    }

    if ( moderation === null ) {
        return null
    }

    let error = null
    if ( request && request.state === 'failed' ) {
        error = (
            <ErrorModal>
                Attempt to moderate post failed on the backend.  Please report as a bug!
            </ErrorModal>
        )
    }

    if ( moderation.status !== 'flagged' ) {
        if ( moderation.status === 'rejected' ) {
            return (
                <div className="post-moderation">
                    <span className="post-moderation__remove"><XCircleIcon /></span>
                </div>
            )
        } else {
            return null
        }
    }

    let action = "Moderate"
    if ( status === 'approved' ) {
        action = "Approve"
    } else if ( status === 'rejected' ) {
        action = "Reject"
    }

    if ( canModerateSite ) {
        return (
            <div className="post-moderation">
                <a href="" onClick={(e) => { e.preventDefault(); setStatus('approved'); setShowReason(true) }} className="post-moderation__approve"><CheckCircleIcon /></a>
                <a href="" onClick={(e) => { e.preventDefault(); setStatus('rejected'); setShowReason(true) }} className="post-moderation__remove"><XCircleIcon /></a>
                <Modal className="post-moderation__reason" isVisible={showReason} setIsVisible={setShowReason} hideX={true} >
                    <TextBox
                        name="reason"
                        className="reason"
                        label="Moderation Reason (Optional)"
                        explanation={`Optionally enter a short explanation for your moderation decision.`}
                        value={reason}
                        onChange={(e) => { setReason(e.target.value)}}
                    />
                    <Button onClick={() => setShowReason(false)}>Cancel</Button>
                    <Button type="primary" onClick={() => moderate()}>{ request && request.state === 'pending' ? <Spinner /> :  action }</Button>
                </Modal>
                { error }
            </div>
        )
    } else {
        return (
            <div className="post-moderation">
                <span className="post-moderation__flagged"><FlagIcon /></span>
            </div>
        )
    }
}

export default PostModeration
