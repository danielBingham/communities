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

    // TECHDEBT In cases where the user has been invited, we'll have the
    // GroupMember, but not the user, since unconfirmed users are not returned
    // from the GET /user endpoint.  In that case, the user will be null and
    // GET /user will 404.  So just don't display a null user.

    // Re: user.name check.  In cases where we're inviting a user to a group
    // via email, we need the user to be returned to the frontend in order to
    // then hit the post /group/:id/members endpoint.  That endpoint will also
    // return the user in relations, but the user object will be incomplete --
    // it'll only have the email on it.  We don't want to render an incomplete
    // user, so just skip any users missing a name.
    if ( user && userMember) {
        return (
            <div className="group-member-badge">
                <div className="group-member-badge__grid">
                    <UserProfileImage userId={user.id} />
                    <div className="group-member-badge__details" >
                        <GroupMemberDotsMenu groupId={groupId} userId={userId} />
                        { user.name !== null && <div className="group-member-badge__name"><Link to={ `/${user.username}` }>{user.name}</Link></div> }
                        { user.email !== null && user.name == null && <div className="group-member-badge__name">{ user.email }</div> }
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
