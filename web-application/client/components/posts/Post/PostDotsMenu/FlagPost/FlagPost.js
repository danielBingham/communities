import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

import { FlagIcon as FlagIconOutline } from '@heroicons/react/24/outline'
import { CheckCircleIcon, XCircleIcon, FlagIcon as FlagIconSolid } from '@heroicons/react/24/solid'

import { useRequest } from '/lib/hooks/useRequest'
import { useFeature } from '/lib/hooks/feature/useFeature'
import { usePost } from '/lib/hooks/Post'
import { useSiteModeration } from '/lib/hooks/SiteModeration'
import { useSitePermission, SitePermissions } from '/lib/hooks/permission'

import { postSiteModerations } from '/state/SiteModeration'

import { FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

import ErrorModal from '/components/errors/ErrorModal'
import WarningModal from '/components/errors/WarningModal'
import AreYouSure from '/components/AreYouSure'

import { ModeratePostForSiteModal } from '/components/posts/Post/PostModeration'

import './FlagPost.css'

const FlagPost = function({ postId } ) {
    const [ areYouSureSite, setAreYouSureSite ] = useState(false)
    const [ showModal, setShowModal ] = useState(false)

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [post, postRequest] = usePost(postId)

    const [siteModeration, siteModerationRequest] = useSiteModeration(post?.siteModerationId)
    const canModerateSite = useSitePermission(currentUser, SitePermissions.MODERATE)

    const hasAdminModerationControls = useFeature('62-admin-moderation-controls')

    const [request, makeRequest] = useRequest()

    const flagForSite = function() {
        makeRequest(postSiteModerations({ userId: currentUser.id, status: 'flagged', postId: postId }))
    }

    useEffect(() => {
        if ( request && request.state === 'fulfilled' ) {
            setAreYouSureSite(false)
        } 
    }, [ request])

    if ( ! hasAdminModerationControls ) {
        return null
    }

    if ( ! currentUser ) {
        return null
    }

    if ( ! post ) {
        return null
    }

    // Users aren't going to flag their own posts. Or if they do, they are
    // almost certainly acting maliciously to gum up the works. Don't let
    // them flag their own posts.
    if ( currentUser.id === post.userId ) {
        return null
    }

    if ( request && request.state === 'failed' ) {
        if ( request.error.type == 'server-error' ) {
            return (
                <ErrorModal>
                    <p>Something went wrong on the backend while trying to flag the post.  This is a bug, please report it.</p>
                </ErrorModal>
            )
        } else if ( request.error.type === 'conflict' ) {
            return (
                <WarningModal>
                    <p>Someone already flagged that post. Moderators should handle it shortly.</p>
                </WarningModal>
            )
        } else {
            return (
                <ErrorModal>
                    <p>Something went wrong on while trying to flag the post.  This is probably a bug, please report it.</p>
                </ErrorModal>
            )
        }
    }

    if ( siteModeration !== null ) {
        if ( siteModeration.status === 'flagged' ) {
            if ( canModerateSite === true ) {
                return (
                    <>
                        <FloatingMenuItem className="flag-post flag-post__moderate" onClick={(e)=>setShowModal(true)}><FlagIconSolid /> Moderate for Site</FloatingMenuItem>
                        <ModeratePostForSiteModal postId={postId} isVisible={showModal} setIsVisible={setShowModal} />
                    </>

                )
            } else {
                return (
                    <FloatingMenuItem disabled={true} className="flag-post flag-post__flagged"><FlagIconSolid /> Flagged</FloatingMenuItem>
                )
            }
        } else if ( siteModeration.status === 'approved' ) {
            return (
                <FloatingMenuItem disabled={true} className="flag-post flag-post__approved"><CheckCircleIcon /> Approved</FloatingMenuItem>
            )
        } else if ( siteModeration.status === 'rejected' ) {
            return (
                <FloatingMenuItem disabled={true} className="flag-post flag-post__rejected"><XCircleIcon /> Removed</FloatingMenuItem>
            )
        }

    }

    return (
        <>
            <FloatingMenuItem onClick={(e) => setAreYouSureSite(true)} className="flag-post"><FlagIconOutline /> Flag for Site Moderators</FloatingMenuItem>
            <AreYouSure className="flag-post" 
                isVisible={areYouSureSite} 
                isPending={request && request.state === 'pending'} 
                execute={flagForSite} 
                cancel={() => setAreYouSureSite(false)}
            > 
                <p><strong>Are you sure you want to flag this post for Site moderators?</strong></p>
                <div className="flag-post__explanation">
                    <p>
                        Flagging is intended for content that needs to be urgently
                        removed from the site. Content appropriate to flag:
                    </p>
                    <ul>
                        <li>Direct incitement to violence against an individual or group of people.</li>
                        <li>Explicit hate.</li>
                        <li>Direct harrassment.</li>
                        <li>Other forms of content that can cause immediate, direct harm.</li>
                    </ul>
                    <p>
                        If you think it should be moderated but it doesn't rise to
                        the level of "needing urgent response" because it could
                        cause "immediate, direct harm", then please 'demote' it
                        instead.
                    </p>
                </div>
            </AreYouSure>
        </>
    )
}

export default FlagPost 
