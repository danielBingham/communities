import React, { useState } from 'react'
import { useSelector } from 'react-redux'

import { XCircleIcon, FlagIcon } from '@heroicons/react/20/solid'

import { GroupPermissions, useGroupPermission } from '/lib/hooks/permission'

import { usePost } from '/lib/hooks/Post'
import { useGroupModeration } from '/lib/hooks/GroupModeration'
import { useSiteModeration } from '/lib/hooks/SiteModeration'

import ModatePostForGroupModal from './ModeratePostForGroupModal'

import './ModeratePostForGroup.css'

const ModeratePostForGroup = function({ postId }) {
    const [showModal, setShowModal] = useState(false)
   
    const [post, postRequest] = usePost(postId)

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [groupModeration, groupModerationRequest] = useGroupModeration(post?.groupModerationId)
    const canModerateGroup = useGroupPermission(currentUser, GroupPermissions.MODERATE, post?.groupId)

    const [siteModeration, siteModerationRequest] = useSiteModeration(post?.siteModerationId) 

    if ( groupModeration === null) {
        return null
    }

    if ( siteModeration !== null && siteModeration.status === 'rejected' ) {
        return null
    }

    if (groupModeration.status === 'rejected' ) {
        return (
            <span title="Removed from Group" className="moderate-post-for-group__rejected"><XCircleIcon /></span>
        )
    } else if ( groupModeration.status === 'approved' ) {
        return null
    }
   
    // If we get here, status === 'flagged'
    if ( canModerateGroup !== true ) {
        return (
            <span className="moderate-post-for-group__flag" title="Group Post Moderation"><FlagIcon /></span>
        )
    } else {
        return (
            <>
                <a href="" className="moderate-post-for-group__flag" title="Moderate Post for Group" onClick={(e) => { e.preventDefault(); setShowModal(true) }}><FlagIcon /></a>
                <ModatePostForGroupModal postId={postId} isVisible={showModal} setIsVisible={setShowModal} />
            </>
        )
    }

} 

export default ModeratePostForGroup
