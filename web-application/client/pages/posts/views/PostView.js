import React from 'react'
import { useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'

import { usePost } from '/lib/hooks/Post'
import { useGroup } from '/lib/hooks/Group'
import { useGroupMember } from '/lib/hooks/GroupMember'

import { 
    useGroupPermission, GroupPermissions, 
    GroupPostPermissions, useGroupPostPermission 
 } from '/lib/hooks/permission'

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

    const canViewGroup = useGroupPermission(currentUser, GroupPermissions.VIEW, { group: group, userMember: currentMember })
    const canViewGroupPost = useGroupPostPermission(currentUser, GroupPostPermissions.VIEW, { group: group, userMember: currentMember })

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
