import React, { useState } from 'react'
import { useSelector } from 'react-redux'

import { XCircleIcon, FlagIcon } from '@heroicons/react/20/solid'

import { GroupPermissions, useGroupPermission } from '/lib/hooks/permission'

import { usePost } from '/lib/hooks/Post'
import { usePostComment } from '/lib/hooks/PostComment'
import { useGroupModeration } from '/lib/hooks/GroupModeration'
import { useSiteModeration } from '/lib/hooks/SiteModeration'

import ModerateForGroupModal from './ModerateForGroupModal'

import './ModerateForGroup.css'

const ModerateForGroup = function({ postId, postCommentId }) {
    const [showModal, setShowModal] = useState(false)
   
    const [post, postRequest] = usePost(postId)
    const [comment, commentRequest ] = usePostComment(postId, postCommentId)

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [groupModeration, groupModerationRequest] = useGroupModeration(postCommentId ? comment?.groupModerationId : post?.groupModerationId)
    const canModerateGroup = useGroupPermission(currentUser, GroupPermissions.MODERATE, post?.groupId)

    const [siteModeration, siteModerationRequest] = useSiteModeration(post?.siteModerationId) 

    const target = postCommentId ? 'Comment' : 'Post'

    if ( groupModeration === null) {
        return null
    }

    if ( siteModeration !== null && siteModeration.status === 'rejected' ) {
        return null
    }

    if (groupModeration.status === 'rejected' ) {
        return (
            <span title="Removed from Group" className="moderate-for-group__rejected"><XCircleIcon /></span>
        )
    } else if ( groupModeration.status === 'approved' ) {
        return null
    }
   
    // If we get here, status === 'flagged'
    if ( canModerateGroup !== true ) {
        return (
            <span className="moderate-for-group__flag" title={`Group ${target} Moderation`}><FlagIcon /></span>
        )
    } else {
        return (
            <>
                <a href="" className="moderate-for-group__flag" title={`Moderate ${target} for Group`} onClick={(e) => { e.preventDefault(); setShowModal(true) }}><FlagIcon /></a>
                <ModerateForGroupModal postId={postId} postCommentId={postCommentId} isVisible={showModal} setIsVisible={setShowModal} />
            </>
        )
    }

} 

export default ModerateForGroup
