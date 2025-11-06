import React from 'react'
import { useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'

import can, {Actions, Entities} from '/lib/permission'

import { usePost } from '/lib/hooks/Post'
import { useGroup, useGroupPermissionContext } from '/lib/hooks/Group'
import { useGroupMember } from '/lib/hooks/GroupMember'

import Post from '/components/posts/Post'

import './PostView.css'

import Error404 from '/components/errors/Error404'
import Button from '/components/generic/button/Button'
import Spinner from '/components/Spinner'
import Refresher from '/components/ui/Refresher'

const PostView = function({ groupId }) {
    const { slug, postId } = useParams()
    const navigate = useNavigate()

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [post, postRequest, refresh] = usePost(postId)

    const [group, groupRequest] = useGroup(groupId)
    const [currentMember, currentMemberRequest] = useGroupMember(groupId, currentUser.id)

    // TECHDEBT HACK: By using `group?.id` here, we ensure that the `useGroup`
    // and `useGroupMember` contained in useGroupPermissionContext won't fire
    // their requests until after the `useGroup` and `useGroupMember` above
    // have completed at least one render cycle.
    //
    // `useGroupMember` won't necessarily have returned, but it will always
    // have gotten to fire its request and thus set the dictionary to `null`,
    // preventing u`useGroupPermissionContext` from firing a second request.
    //
    // This is very hacky and a major gotcha!
    const context = useGroupPermissionContext(currentUser, group?.id)

    const canViewGroup = can(currentUser, Actions.view, Entities.Group, context)
    const canViewGroupPost = can(currentUser, Actions.view, Entities.Group, context)

    if ( groupId !== undefined && ( ! group && ( ! groupRequest || groupRequest.state === 'pending' ))) {
        return  ( 
            <div id={`post-${postId}`}>
                <Spinner />
            </div>
        )
    }

    if ( groupId !== undefined && ( currentMember === undefined || currentMemberRequest?.state === 'pending') ) {
        return (
            <div id={`post-${postId}`}>
                <Spinner />
            </div>
        )
    }

    if ( groupId !== undefined && (canViewGroup !== true || canViewGroupPost !== true) ) {
        return ( <Error404 /> ) 
    } 

    let backlink = `/${slug}`
    if ( groupId !== undefined ) {
        backlink = `/group/${slug}`
    }
    return (
        <div id={`post-${postId}`}>
            <Refresher onRefresh={() => refresh()} />
            <div className="post-page__header"><Button onClick={(e) => navigate(backlink)}>Back to { groupId !== undefined ? 'Group' : 'Profile' }</Button></div>
            <Post id={postId} expanded={true} /> 
        </div>
    )
}

export default PostView
