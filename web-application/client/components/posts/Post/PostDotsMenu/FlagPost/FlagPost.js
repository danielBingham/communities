import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

import { FlagIcon as FlagIconOutline } from '@heroicons/react/24/outline'
import { CheckCircleIcon, XCircleIcon, FlagIcon as FlagIconSolid } from '@heroicons/react/24/solid'

import { useRequest } from '/lib/hooks/useRequest'
import { useFeature } from '/lib/hooks/feature/useFeature'
import { usePost } from '/lib/hooks/Post'
import { useSiteModeration } from '/lib/hooks/SiteModeration'
import { useGroupModeration } from '/lib/hooks/GroupModeration'

import { postSiteModerations } from '/state/SiteModeration'
import { postGroupModerations } from '/state/GroupModeration'

import { FloatingMenuItem } from '/components/generic/floating-menu/FloatingMenu'

import Modal from '/components/generic/modal/Modal'
import ErrorModal from '/components/errors/ErrorModal'
import AreYouSure from '/components/AreYouSure'
import Button from '/components/generic/button/Button'

import './FlagPost.css'

const FlagPost = function({ postId } ) {
    const [ showModal, setShowModal ] = useState(false)
    const [ areYouSureSite, setAreYouSureSite ] = useState(false)
    const [ areYouSureGroup, setAreYouSureGroup ] = useState(false)

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [post, postRequest] = usePost(postId)

    const [siteModeration, siteModerationRequest] = useSiteModeration(post?.siteModerationId)
    const [groupModeration, groupModerationRequest] = useGroupModeration(post?.groupModerationId)

    const hasAdminModerationControls = useFeature('62-admin-moderation-controls')
    const hasGroupModerationControls = useFeature('89-improved-moderation-for-group-posts')

    const [request, makeRequest] = useRequest()

    const flagPost = function(event) {
        if ( post?.groupId ) {
            setShowModal(true)
        } else {
            setAreYouSureSite(true)
        }
    }

    const flagForGroup = function() {
        makeRequest(postGroupModerations({ userId: currentUser.id, status: 'flagged', postId: postId, groupId: post.groupId }))
    }

    const flagForSite = function() {
        makeRequest(postSiteModerations({ userId: currentUser.id, status: 'flagged', postId: postId }))
    }

    useEffect(() => {
        if ( request && request.state === 'fulfilled' ) {
            setAreYouSureSite(false)
            setAreYouSureGroup(false)

        } 
    }, [ request])

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

    if ( siteModeration !== null ) {
        if ( siteModeration.status === 'flagged' ) {
            return (
                <FloatingMenuItem disabled={true} className="flag-post flag-post__flagged"><FlagIconSolid /> flagged</FloatingMenuItem>
            )
        } else if ( siteModeration.status === 'approved' ) {
            return (
                <FloatingMenuItem disabled={true} className="flag-post flag-post__approved"><CheckCircleIcon /> approved</FloatingMenuItem>
            )
        } else if ( siteModeration.status === 'rejected' ) {
            return (
                <FloatingMenuItem disabled={true} className="flag-post flag-post__rejected"><XCircleIcon /> removed</FloatingMenuItem>
            )
        }

    }

    return (
        <>
            <FloatingMenuItem onClick={(e) => flagPost(e)} className="flag-post"><FlagIconOutline /> flag</FloatingMenuItem>

            <Modal isVisible={showModal} setIsVisible={setShowModal} className="flag-post__choose" hideX={true}>
                <p><strong>Flag for Site moderators or Group moderators?</strong></p>
                <div className="flag-post__choose__explanation">
                    <p>Flagging is intended for posts that require an urgent
                    response from moderators. Which moderators do you wish to notify?</p>
                    <ul>
                        <li>If this post violates the Site's rules, then flag it for Site moderators.</li>
                        <li>If this post violates the Group's rules, but not the Site's rules, then you should flag it for Group moderators.</li>
                    </ul>
                </div>
                <div className="flag-post__choose__choices">
                    <Button onClick={(e) => { setShowModal(false); setAreYouSureGroup(true) }}>Flag for Group</Button>
                    <Button onClick={(e) => { setShowModal(false); setAreYouSureSite(true) }}>Flag for Site</Button>
                </div>
            </Modal>

            <AreYouSure className="flag-post"
                isVisible={areYouSureGroup}
                isPending={request && request.state === 'pending'}
                execute={flagForGroup}
                cancel={() => setAreYouSureGroup(false)}
            >
                <p><strong>Are you sure you want to flag this post for Group moderators?</strong></p>
                <div className="flag-post__explanation">
                    <p>
                        Flagging is intended for content that needs to be
                        urgently removed from the Group.
                    </p>
                    <p>If this post doesn't need a group moderator's urgent
                    attention, but you still believe it violates the group's
                        rules, then please demote it to vote for its removal
                        from the group.</p>
                    <p>Remember, group moderators are volunteers and moderating
                    a group is hard work.  Please be respectful of their time,
                    energy, and bandwidth and only flag posts that really need
                    it.</p>
                    <p>Are you sure this post urgently requires a moderator's attention?</p>
                </div>
            </AreYouSure>


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
