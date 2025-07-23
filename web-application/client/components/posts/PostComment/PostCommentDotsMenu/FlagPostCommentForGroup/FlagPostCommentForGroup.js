import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'

import { FlagIcon as FlagIconOutline } from '@heroicons/react/24/outline'
import { CheckCircleIcon, XCircleIcon, FlagIcon as FlagIconSolid } from '@heroicons/react/24/solid'

import { useRequest } from '/lib/hooks/useRequest'
import { useFeature } from '/lib/hooks/feature/useFeature'

import { usePost } from '/lib/hooks/Post'
import { usePostComment } from '/lib/hooks/PostComment'
import { useGroup } from '/lib/hooks/Group'
import { useGroupMember } from '/lib/hooks/GroupMember'
import { useGroupModeration } from '/lib/hooks/GroupModeration'

import { useGroupPermission, GroupPermissions } from '/lib/hooks/permission'

import { postGroupModerations } from '/state/GroupModeration'

import { DotsMenuItem } from '/components/ui/DotsMenu'

import ErrorModal from '/components/errors/ErrorModal'
import WarningModal from '/components/errors/WarningModal'
import AreYouSure from '/components/AreYouSure'

import { ModerateForGroupModal } from '/components/groups/moderation/ModerateForGroup'

import './FlagPostCommentForGroup.css'

const FlagPostCommentForGroup = function({ postId, postCommentId} ) {
    const [ areYouSureGroup, setAreYouSureGroup ] = useState(false)
    const [ showModal, setShowModal ] = useState(false)

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [post, postRequest] = usePost(postId)
    const [comment, commentRequest] = usePostComment(postId, postCommentId)

    const [group, groupRequest] = useGroup(post?.groupId)
    const [currentMember, currentMemberRequest] = useGroupMember(group?.id, currentUser.id)

    const [groupModeration, groupModerationRequest] = useGroupModeration(comment?.groupModerationId)

    const canModerateGroup = useGroupPermission(currentUser, GroupPermissions.MODERATE, { group: group, userMember: currentMember })

    const hasGroupModerationControls = useFeature('89-improved-moderation-for-group-posts')

    const [request, makeRequest] = useRequest()

    const flagForGroup = function() {
        makeRequest(postGroupModerations({ userId: currentUser.id, status: 'flagged', postId: postId, postCommentId: postCommentId, groupId: post.groupId }))
    }

    useEffect(() => {
        if ( request && request.state === 'fulfilled' ) {
            setAreYouSureGroup(false)
        }  
    }, [ request])


    if ( ! hasGroupModerationControls ) {
        return null
    }

    if ( ! currentUser ) {
        return null
    }

    if ( ! post || ! comment ) {
        return null
    }

    if ( ! post?.groupId ) {
        return null
    }

    // Users aren't going to flag their own posts. Or if they do, they are
    // almost certainly acting maliciously to gum up the works. Don't let
    // them flag their own posts.
    if ( currentUser.id === comment.userId ) {
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
                    <p>Something went wrong while trying to flag the post.  This is probably a bug, please report it.</p>
                </ErrorModal>
            )
        }
    }

    if ( groupModeration !== null ) {
        if ( groupModeration.status === 'flagged' ) {
            if ( canModerateGroup === true ) {
                return (
                    <>
                        <DotsMenuItem onClick={(e) => setShowModal(true)} className="flag-post-comment-for-group flag-post-comment-for-group__moderate"><FlagIconSolid /> Moderate for Group</DotsMenuItem>
                        <ModerateForGroupModal postId={postId} postCommentId={postCommentId} isVisible={showModal} setIsVisible={setShowModal} />
                    </>

                )
            } else {
                return (
                    <DotsMenuItem disabled={true} className="flag-post-comment-for-group flag-post-comment-for-group__flagged"><FlagIconSolid /> Flagged</DotsMenuItem>
                )
            }
        } else if ( groupModeration.status === 'approved' ) {
            return (
                <DotsMenuItem disabled={true} className="flag-post-comment-for-group flag-post-comment-for-group__approved"><CheckCircleIcon /> Approved</DotsMenuItem>
            )
        } else if ( groupModeration.status === 'rejected' ) {
            return (
                <DotsMenuItem disabled={true} className="flag-post-comment-for-group flag-post-comment-for-group__rejected"><XCircleIcon /> Removed</DotsMenuItem>
            )
        }
    }

    return (
        <>
            <DotsMenuItem onClick={(e) => setAreYouSureGroup(true)} className="flag-post-comment-for-group"><FlagIconOutline /> Flag for Group Moderators</DotsMenuItem>

            <AreYouSure className="flag-post-comment-for-group"
                isVisible={areYouSureGroup}
                isPending={request && request.state === 'pending'}
                execute={flagForGroup}
                cancel={() => setAreYouSureGroup(false)}
            >
                <p><strong>Are you sure you want to flag this post for Group moderators?</strong></p>
                <div className="flag-post-comment-for-group__explanation">
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
        </>
    )
}

export default FlagPostCommentForGroup 
