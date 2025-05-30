import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

import { FlagIcon as FlagIconOutline } from '@heroicons/react/24/outline'
import { CheckCircleIcon, XCircleIcon, FlagIcon as FlagIconSolid } from '@heroicons/react/24/solid'

import { useRequest } from '/lib/hooks/useRequest'
import { useFeature } from '/lib/hooks/feature/useFeature'

import { postSiteModerations } from '/state/admin/siteModeration'

import { FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

import ErrorModal from '/components/errors/ErrorModal'
import AreYouSure from '/components/AreYouSure'

import './FlagPost.css'

const FlagPost = function({ postId } ) {
    const [ areYouSure, setAreYouSure ] = useState(false)

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const moderation = useSelector((state) => postId && postId in state.siteModeration.byPostId ? state.siteModeration.byPostId[postId] : null)

    const hasAdminModerationControls = useFeature('62-admin-moderation-controls')

    const [request, makeRequest] = useRequest()

    const executeFlag = function() {
        makeRequest(postSiteModerations({ userId: currentUser.id, status: 'flagged', postId: postId }))
    }

    useEffect(() => {
        if ( request && request.state === 'fulfilled' ) {
            setAreYouSure(false)
        } 
    }, [ areYouSure, request])

    if ( ! hasAdminModerationControls ) {
        return null
    }

    if ( ! currentUser ) {
        return null
    }

    if ( request && request.state === 'failed' ) {
        if ( request.error.type == 'server-error' ) {
            return (
                <ErrorModal>
                    <p>Something went wrong on the backend while trying to flag the post.  This is a bug, please report it.</p>
                </ErrorModal>
            )
        } else {
            return (
                <ErrorModal>
                    <p>Something went wrong on while trying to flag the post.  This is probably a bug, please report it.</p>
                </ErrorModal>
            )
        }
    }

    if ( moderation !== null ) {
        if ( moderation.status === 'flagged' ) {
            return (
                <FloatingMenuItem disabled={true} className="flag-post flag-post__flagged"><FlagIconSolid /> flagged</FloatingMenuItem>
            )
        } else if ( moderation.status === 'approved' ) {
            return (
                <FloatingMenuItem disabled={true} className="flag-post flag-post__approved"><CheckCircleIcon /> approved</FloatingMenuItem>
            )
        } else if ( moderation.status === 'rejected' ) {
            return (
                <FloatingMenuItem disabled={true} className="flag-post flag-post__rejected"><XCircleIcon /> removed</FloatingMenuItem>
            )
        }

    }

    return (
        <>
            <FloatingMenuItem onClick={(e) => setAreYouSure(true)} className="flag-post"><FlagIconOutline /> flag</FloatingMenuItem>
            <AreYouSure className="flag-post" 
                isVisible={areYouSure} 
                isPending={request && request.state === 'pending'} 
                execute={executeFlag} 
                cancel={() => setAreYouSure(false)}
            > 
                <p><strong>Are you sure you want to flag this post?</strong></p>
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
