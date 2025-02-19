import React, { useState, useEffect, Children } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { getUser } from '/state/users'

import UserProfileImage from '/components/users/UserProfileImage'
import GroupMembershipButton from '/components/groups/components/GroupMembershipButton'
import GroupMemberDotsMenu from '/components/groups/members/components/GroupMemberDotsMenu'

import './GroupMemberBadge.css'

const GroupMemberBadge = function({ groupId, userId }) {
    
    // ======= Request Tracking =====================================
   
    const [request, makeRequest] = useRequest()

    // ======= Redux State ==========================================

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const currentMember = useSelector((state) => currentUser && groupId in state.groupMembers.byGroupAndUser && currentUser.id in state.groupMembers.byGroupAndUser[groupId] ? state.groupMembers.byGroupAndUser[groupId][userId] : null)
    
    const user = useSelector((state) => userId in state.users.dictionary ? state.users.dictionary[userId] : null)
    const userMember = useSelector((state) => groupId in state.groupMembers.byGroupAndUser && userId in state.groupMembers.byGroupAndUser[groupId] ? state.groupMembers.byGroupAndUser[groupId][userId] : null)

    // ======= Effect Handling ======================================
    
    const dispatch = useDispatch()

    useEffect(function() {
        if ( ! user ) {
            makeRequest(getUser(userId))
        }
    }, [ user ])

    // ======= Render ===============================================
    if( ! user && ( ! request || request.status == 'pending' )) {
        return null 
    }

    // TECHDEBT: The request will return a 404 not found in certain circumstances
    // where someone has a userId (through a relationship gained through an
    // invite, for example), but a user hasn't finished registering and
    // confirmed yet.  In those circumstances, the FriendList will create a
    // user badge with the ID, but the GET /user/:id endpoint will return 404
    // because of the unconfirmed status.
    //
    // In that case, we'll just return null for now.
    if ( user && userMember) {
        return (
            <div className="group-member-badge">
                <GroupMemberDotsMenu groupId={groupId} userId={userId} />
                <div className="group-member-badge__grid">
                    <UserProfileImage userId={user.id} />
                    <div className="group-member-badge__details" >
                        <div className="group-member-badge__name"><Link to={ `/${user.username}` }>{user.name}</Link></div>
                        { userMember.role != 'member' && <div className="group-member-badge__role">{ userMember.role }</div> }
                        <div className="group-member-badge__about">{ user.about?.length > 100 ? user.about.substring(0,100).trim()+'...' : user.about }</div>
                        <div className="group-member-badge__controls">
                            <GroupMembershipButton groupId={groupId} userId={userMember.userId} />
                        </div>
                    </div> 
                </div>
            </div>
        )
    } else {
        return (null)
    }

}

export default GroupMemberBadge 
