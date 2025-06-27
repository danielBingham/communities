import React, { useState } from 'react'
import { useSelector } from 'react-redux'

import { XCircleIcon, FlagIcon } from '@heroicons/react/20/solid'

import { SitePermissions, useSitePermission } from '/lib/hooks/permission'

import { usePost } from '/lib/hooks/Post'
import { useSiteModeration } from '/lib/hooks/SiteModeration'

import ModeratePostForSiteModal from './ModeratePostForSiteModal'

import './ModeratePostForSite.css'

const ModeratePostForSite = function({ postId }) {
    const [showModal, setShowModal] = useState(false)

    const [post, postRequest] = usePost(postId)

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [siteModeration, siteModerationRequest] = useSiteModeration(post?.siteModerationId) 
    const canModerateSite = useSitePermission(currentUser, SitePermissions.MODERATE)

    if ( siteModeration === null ) {
        return null
    }

    if (siteModeration.status === 'rejected' ) {
        return (
            <span title="Removed from Site" className="moderate-post-for-site__rejected"><XCircleIcon /></span>
        )
    } else if ( siteModeration.status === 'approved' ) {
        return null
    }

    if ( canModerateSite !== true ) {
        return (
            <span className="moderate-post-for-site__flag" title="Site Post Moderation"><FlagIcon /></span>
        )
    } else {
        return (
            <>
                <a href="" className="moderate-post-for-site__flag" title="Modrate Post for Site" onClick={(e) => { e.preventDefault(); setShowModal(true) }}><FlagIcon /></a>
                <ModeratePostForSiteModal postId={postId} isVisible={showModal} setIsVisible={setShowModal} />
            </>
        )
    }

} 

export default ModeratePostForSite
