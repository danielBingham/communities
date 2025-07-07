import React, { useState } from 'react'
import { useSelector } from 'react-redux'

import { XCircleIcon, FlagIcon, ClockIcon } from '@heroicons/react/20/solid'

import { usePost } from '/lib/hooks/Post'
import { usePostComment } from '/lib/hooks/PostComment'
import { useGroup } from '/lib/hooks/Group'
import { useGroupMember } from '/lib/hooks/GroupMember'
import { useGroupModeration } from '/lib/hooks/GroupModeration'
import { useSiteModeration } from '/lib/hooks/SiteModeration'

import { GroupPermissions, useGroupPermission } from '/lib/hooks/permission'

import ModerateForGroupModal from './ModerateForGroupModal'

import './ModerateForGroup.css'

const ModerateForGroup = function({ postId, postCommentId }) {
    const [showModal, setShowModal] = useState(false)
   
    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [post, postRequest] = usePost(postId)
    const [comment, commentRequest ] = usePostComment(postId, postCommentId)

    const [group, groupRequest] = useGroup(post?.groupId)
    const [currentMember, currentMemberRequest] = useGroupMember(group?.id, currentUser.id)

    const [siteModeration, siteModerationRequest] = useSiteModeration(post?.siteModerationId) 
    const [groupModeration, groupModerationRequest] = useGroupModeration(postCommentId ? comment?.groupModerationId : post?.groupModerationId)

    const canModerateGroup = useGroupPermission(currentUser, GroupPermissions.MODERATE, { group: group, userMember: currentMember })


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
