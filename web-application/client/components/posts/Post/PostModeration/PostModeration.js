import React, { useState } from 'react'
import { useSelector } from 'react-redux'

import { CheckCircleIcon, XCircleIcon, FlagIcon } from '@heroicons/react/20/solid'

import { SitePermissions, useSitePermission, GroupPermissions, useGroupPermission } from '/lib/hooks/permission'
import { useRequest } from '/lib/hooks/useRequest'
import { usePost } from '/lib/hooks/Post'
import { useSiteModeration } from '/lib/hooks/SiteModeration'
import { useGroupModeration } from '/lib/hooks/GroupModeration'

import { patchSiteModeration } from '/state/SiteModeration'
import { patchGroupModeration } from '/state/GroupModeration'

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

    const [post, postRequest] = usePost(postId)

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [siteModeration, siteModerationRequest] = useSiteModeration(post?.siteModerationId) 
    const canModerateSite = useSitePermission(currentUser, SitePermissions.MODERATE)

    const [groupModeration, groupModerationRequest] = useGroupModeration(post?.groupModerationId)
    const canModerateGroup = useGroupPermission(currentUser, GroupPermissions.MODERATE, post?.groupId)

    console.log(`SiteModeration:`)
    console.log(siteModeration)
    console.log(`GroupModeration: `)
    console.log(groupModeration)
    const [request, makeRequest] = useRequest()

    const moderate = function() {
        if ( siteModeration !== null ) {
            const patch = {
                id: siteModeration.id,
                userId: currentUser.id,
                status: status,
                reason: reason,
                postId: postId 
            }
            makeRequest(patchSiteModeration(patch))
        } else if ( groupModeration !== null ) {
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
    }


    if ( ! currentUser ) {
        return null
    }

    if ( siteModeration === null && groupModeration === null ) {
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

    if ( siteModeration && siteModeration.status === 'rejected' ) {
        return (
            <div className="post-moderation">
                <span className="post-moderation__remove"><XCircleIcon /></span>
            </div>
        )
    } else if ( siteModeration && siteModeration.status !== 'flagged' ) {
        return null
    }

    if ( groupModeration && groupModeration.status === 'rejected' ) {
        return (
            <div className="post-moderation">
                <span className="post-moderation__remove"><XCircleIcon /></span>
            </div>
        )
    } else if ( groupModeration && groupModeration.status !== 'flagged' ) {
        return null
    }

    let action = "Moderate"
    if ( status === 'approved' ) {
        action = "Approve"
    } else if ( status === 'rejected' ) {
        action = "Reject"
    }

    if ( (canModerateSite && siteModeration !== null) || (canModerateGroup && groupModeration !== null)) {
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
