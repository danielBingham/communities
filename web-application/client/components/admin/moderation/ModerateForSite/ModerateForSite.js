import React, { useState } from 'react'
import { useSelector } from 'react-redux'

import { XCircleIcon, FlagIcon } from '@heroicons/react/20/solid'

import { SitePermissions, useSitePermission } from '/lib/hooks/permission'

import { usePost } from '/lib/hooks/Post'
import { usePostComment } from '/lib/hooks/PostComment'
import { useSiteModeration } from '/lib/hooks/SiteModeration'

import ModerateForSiteModal from './ModerateForSiteModal'

import './ModerateForSite.css'

const ModerateForSite = function({ postId, postCommentId }) {
    const [showModal, setShowModal] = useState(false)

    const [post, postRequest] = usePost(postId)
    const [comment, commentRequest] = usePostComment(postId, postCommentId)

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [siteModeration, siteModerationRequest] = useSiteModeration(comment ? comment?.siteModerationId : post?.siteModerationId) 
    const canModerateSite = useSitePermission(currentUser, SitePermissions.MODERATE)

    if ( siteModeration === null ) {
        return null
    }

    if ( siteModeration.status === 'approved' || siteModeration.status === 'rejected' ) {
        return null
    }

    const target = postCommentId ? 'Comment' : 'Post'

    if ( canModerateSite !== true ) {
        return (
            <span className="moderate-for-site__flag" title={`${target} Flagged for Site Moderators`}><FlagIcon /></span>
        )
    } else {
        return (
            <>
                <a href="" className="moderate-for-site__flag" title={`Moderate ${target} for Site`} onClick={(e) => { e.preventDefault(); setShowModal(true) }}><FlagIcon /></a>
                <ModerateForSiteModal postId={postId} postCommentId={postCommentId} isVisible={showModal} setIsVisible={setShowModal} />
            </>
        )
    }

} 

export default ModerateForSite
