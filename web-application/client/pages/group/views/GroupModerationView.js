import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { useGroup } from '/lib/hooks/Group'
import { useGroupMember } from '/lib/hooks/GroupMember'

import { useGroupPermission, GroupPermissions } from '/lib/hooks/permission'

import { getGroupModerations } from '/state/GroupModeration'

import Post from '/components/posts/Post'
import PostCommentAwaitingGroupModeration from '/components/groups/moderation/PostCommentAwaitingGroupModeration'
import PaginationControls from '/components/PaginationControls'
import Error404 from '/components/errors/Error404'

import './GroupModerationView.css'

const GroupModerationView = function({ groupId }) {
    const [ searchParams, setSearchParams ] = useSearchParams()

    const [ request, makeRequest ] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [group, groupRequest] = useGroup(groupId)
    const [currentMember, currentMemberRequest] = useGroupMember(groupId, currentUser.id)

    const query = useSelector((state) => 'GroupModerationView' in state.GroupModeration.queries ? state.GroupModeration.queries['GroupModerationView']: null)
    const dictionary = useSelector((state) => state.GroupModeration.dictionary)

    const canModerateGroup = useGroupPermission(currentUser, GroupPermissions.MODERATE, { group: group, userMember: currentMember })

    useEffect(function() {
        let page = searchParams.get('page')
        page = page || 1

        makeRequest(getGroupModerations(groupId, 'GroupModerationView', { status: [ 'flagged', 'pending' ], page: page }))
    }, [])

    if ( canModerateGroup !== true ) {
        return ( <Error404 /> ) 
    }

    if ( query === null || parseInt(query.meta.count) === 0) {
        return (
            <div className="group-moderation-view">
                <div className="group-moderation-view__empty-wrapper">
                    <div className="group_moderation-view__empty">
                        Nothing to moderate.
                    </div>
                </div>
            </div>
        )
    }

    const moderationViews = []
    if ( query !== null ) {
        for(const moderationId of query.list) {
            const moderation = dictionary[moderationId]
            if ( moderation.status !== 'flagged' && moderation.status !== 'pending') {
                continue
            }

            if ( moderation.postId !== null && moderation.postCommentId === null) {
                moderationViews.push(
                    <div key={moderation.id} className="moderation__post">
                        <Post id={moderation.postId} />
                    </div>
                )
            } else if ( moderation.postId !== null && moderation.postCommentId !== null ) {
                moderationViews.push(<PostCommentAwaitingGroupModeration id={moderation.id} />)
            }
        }
    }

    let explanation = ''
    if ( parseInt(query.meta.count) === 0 ) {
        explanation = `Showing 0 posts`
    } else {
        const pageStart = ( query.meta.page-1) * query.meta.pageSize + 1
        const pageEnd = query.meta.count - (query.meta.page-1) * query.meta.pageSize > query.meta.pageSize ? ( query.meta.page * query.meta.pageSize ) : query.meta.count 

        explanation = `Showing ${pageStart} to ${pageEnd} of ${query.meta.count} Requests for Moderation`
    }

    return (
        <div className="group-moderation-view">
            <div className="group-moderation-view__list">
                <div className="group-moderation-view__header">
                    <div className="admin-moderation-view__header__explanation">{ explanation }</div>
                    <div className="admin-moderation-view__header__controls"></div>
                </div>
                { moderationViews }
                <PaginationControls meta={query?.meta} />
            </div>
        </div>
    )
}

export default GroupModerationView
