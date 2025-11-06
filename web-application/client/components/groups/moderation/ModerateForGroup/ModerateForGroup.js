import React, { useState } from 'react'
import { useSelector } from 'react-redux'

import { XCircleIcon, FlagIcon, ClockIcon } from '@heroicons/react/20/solid'

import can, {Actions, Entities} from '/lib/permission'

import { usePost } from '/lib/hooks/Post'
import { usePostComment } from '/lib/hooks/PostComment'
import { useGroupPermissionContext } from '/lib/hooks/Group'
import { useGroupModeration } from '/lib/hooks/GroupModeration'
import { useSiteModeration } from '/lib/hooks/SiteModeration'

import ModerateForGroupModal from './ModerateForGroupModal'

import './ModerateForGroup.css'

const ModerateForGroup = function({ postId, postCommentId }) {
    const [showModal, setShowModal] = useState(false)
   
    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [post, postRequest] = usePost(postId)
    const [comment, commentRequest ] = usePostComment(postId, postCommentId)

    const [siteModeration, siteModerationRequest] = useSiteModeration(post?.siteModerationId) 
    const [groupModeration, groupModerationRequest] = useGroupModeration(postCommentId ? comment?.groupModerationId : post?.groupModerationId)

    const context = useGroupPermissionContext(currentUser, post?.groupId)
    const canModerateGroup = can(currentUser, Actions.moderate, Entities.Group, context) 


    const target = postCommentId ? 'Comment' : 'Post'

    if ( groupModeration === null) {
        return null
    }

    if ( siteModeration !== null && siteModeration.status === 'rejected' ) {
        return null
    }

    if ( groupModeration.status === 'approved' || groupModeration.status === 'rejected') {
        return null
    }

    const statusIcon = groupModeration.status === 'pending' ? <ClockIcon /> : <FlagIcon />
   
    // If we get here, status === 'flagged'
    if ( canModerateGroup !== true ) {
        return (
            <span className="moderate-for-group__flag" title={`Group ${target} Moderation`}>{ statusIcon }</span>
        )
    } else {
        return (
            <>
                <a href="" className="moderate-for-group__flag" title={`Moderate ${target} for Group`} onClick={(e) => { e.preventDefault(); setShowModal(true) }}>{ statusIcon }</a>
                <ModerateForGroupModal postId={postId} postCommentId={postCommentId} isVisible={showModal} setIsVisible={setShowModal} />
            </>
        )
    }

} 

export default ModerateForGroup
