import React, { useState, useEffect, useContext } from 'react'
import { useSelector } from 'react-redux'

import { FlagIcon as FlagIconOutline } from '@heroicons/react/24/outline'
import { CheckCircleIcon, XCircleIcon, FlagIcon as FlagIconSolid } from '@heroicons/react/24/solid'

import { useRequest } from '/lib/hooks/useRequest'
import { useFeature } from '/lib/hooks/feature/useFeature'
import { usePostComment } from '/lib/hooks/PostComment'
import { useSiteModeration } from '/lib/hooks/SiteModeration'
import { useSitePermission, SitePermissions } from '/lib/hooks/permission'

import { postSiteModerations } from '/state/SiteModeration'

import { DotsMenuItem, CloseMenuContext } from '/components/ui/DotsMenu'

import ErrorModal from '/components/errors/ErrorModal'
import WarningModal from '/components/errors/WarningModal'
import AreYouSure from '/components/AreYouSure'

import { ModerateForSiteModal } from '/components/admin/moderation'

import './FlagPostComment.css'

const FlagPostComment = function({ postId, id } ) {
    const [ areYouSure, setAreYouSure ] = useState(false)
    const [ showModal, setShowModal ] = useState(false)

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [comment, commentRequest] = usePostComment(postId, id)

    const [siteModeration, siteModerationRequest] = useSiteModeration(comment?.siteModerationId)
    const canModerateSite = useSitePermission(currentUser, SitePermissions.MODERATE)

    const hasAdminModerationControls = useFeature('62-admin-moderation-controls')

    const [request, makeRequest] = useRequest()

    const closeMenu = useContext(CloseMenuContext)

    const executeFlag = function() {
        const newModeration = { 
            userId: currentUser.id, 
            status: 'flagged', 
            postId: postId, 
            postCommentId: id 
        }
        makeRequest(postSiteModerations(newModeration))
    }

    useEffect(() => {
        if ( request && request.state === 'fulfilled' ) {
            setAreYouSure(false)
            closeMenu()
        } 
    }, [ areYouSure, request])

    if ( ! hasAdminModerationControls ) {
        return null
    }

    if ( ! currentUser ) {
        return null
    }

    if ( ! comment ) {
        return null
    }

    // Users aren't going to flag their own comments. Or if they do, they are
    // almost certainly acting maliciously to gum up the works. Don't let
    // them flag their own comments.
    if ( currentUser.id === comment.userId ) {
        return null
    }

    if ( request && request.state === 'failed' ) {
        if ( request.error.type == 'server-error' ) {
            return (
                <ErrorModal>
                    <p>Something went wrong on the backend while trying to flag the comment.  This is a bug, please report it.</p>
                </ErrorModal>
            )
        } else if ( request.error.type === 'conflict' ) {
            return (
                <WarningModal>
                    <p>Someone already flagged that comment. Moderators should handle it shortly.</p>
                </WarningModal>
            )
        } else {
            return (
                <ErrorModal>
                    <p>Something went wrong on while trying to flag the comment.  This is probably a bug, please report it.</p>
                </ErrorModal>
            )
        }
    }

    if ( siteModeration !== null ) {
        if ( siteModeration.status === 'flagged' ) {
            if ( canModerateSite === true ) {
                return (
                    <>
                        <DotsMenuItem className="flag-post-comment flag-post-comment__moderate" onClick={(e)=>setShowModal(true)}><FlagIconSolid /> Moderate for Site</DotsMenuItem>
                        <ModerateForSiteModal postId={postId} postCommentId={id} isVisible={showModal} setIsVisible={setShowModal} />
                    </>

                )
            } else {
                return (
                    <DotsMenuItem disabled={true} className="flag-post-comment flag-post-comment__flagged"><FlagIconSolid /> Flagged</DotsMenuItem>
                )
            }
        } else if ( siteModeration.status === 'approved' ) {
            return (
                <DotsMenuItem disabled={true} className="flag-post-comment flag-post-comment__approved"><CheckCircleIcon /> Approved</DotsMenuItem>
            )
        } else if ( siteModeration.status === 'rejected' ) {
            return (
                <DotsMenuItem disabled={true} className="flag-post-comment flag-post-comment__rejected"><XCircleIcon /> Removed</DotsMenuItem>
            )
        }
    }

    return (
        <>
            <DotsMenuItem onClick={(e) => setAreYouSure(true)} className="flag-post-comment"><FlagIconOutline /> Flag for Site Moderators</DotsMenuItem>
            <AreYouSure className="flag-post-comment" 
                isVisible={areYouSure} 
                isPending={request && request.state === 'pending'} 
                execute={executeFlag} 
                cancel={() => setAreYouSure(false)}
            > 
                <p><strong>Are you sure you want to flag this comment for Site moderators?</strong></p>
                <div className="flag-post-comment__explanation">
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

export default FlagPostComment 
