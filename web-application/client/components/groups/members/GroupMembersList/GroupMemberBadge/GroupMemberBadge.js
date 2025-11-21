import React, { useState, useEffect, Children } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'
import { useGroupMember } from '/lib/hooks/GroupMember'

import { getUser } from '/state/User'

import UserProfileImage from '/components/users/UserProfileImage'
import GroupMembershipButton from '/components/groups/GroupMembershipButton'
import GroupMemberDotsMenu from './GroupMemberDotsMenu'

import { ListGridContentItem } from '/components/ui/List'

import './GroupMemberBadge.css'

const GroupMemberBadge = function({ groupId, userId }) {
    
    // ======= Request Tracking =====================================
   
    const [request, makeRequest] = useRequest()

    // ======= Redux State ==========================================

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const [currentMember, currentMemberRequest] = useGroupMember(groupId, currentUser.id)

    
    const user = useSelector((state) => userId in state.User.dictionary ? state.User.dictionary[userId] : null)
    const [ userMember, userMemberRequest] = useGroupMember(groupId, userId)

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
            <ListGridContentItem className="group-member-badge">
                <div className="group-member-badge__grid">
                    <UserProfileImage userId={user.id} />
                    <div className="group-member-badge__details" >
                        <GroupMemberDotsMenu groupId={groupId} userId={userId} />
                        { user.name !== null && <div className="group-member-badge__name"><Link to={ `/${user.username}` }>{user.name}</Link></div> }
                        { user.email !== null && user.name == null && <div className="group-member-badge__name">{ user.email }</div> }
                        { userMember.role != 'member' && <div className="group-member-badge__role">{ userMember.role }</div> }
                        { userMember.status === 'banned' && <div className="group-member-badge__status">Banned</div> }
                        { userMember.status === 'pending-invited' && <div className="group-member-badge__status">Invited</div> }
                        { userMember.status === 'pending-requested' && <div className="group-member-badge__status">Requested</div> }
                        <div className="group-member-badge__about">{ user.about?.length > 100 ? user.about.substring(0,100).trim()+'...' : user.about }</div>
                        <div className="group-member-badge__controls">
                        </div>
                    </div> 
                </div>
            </ListGridContentItem>
        )
    } else {
        return (null)
    }

}

export default GroupMemberBadge 
