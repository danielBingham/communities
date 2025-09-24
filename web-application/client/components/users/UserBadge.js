import React, { useState, useEffect, Children } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'
import { useUser } from '/lib/hooks/User'

import UserProfileImage from '/components/users/UserProfileImage'
import FriendButton from '/components/friends/FriendButton'

import { ListGridContentItem } from '/components/ui/List'

import './UserBadge.css'

const UserBadge = function({ id, children }) {

    const [user, request] = useUser(id)

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
    if ( user ) {
        return (
            <ListGridContentItem className="user-badge">
                <div className="user-badge__grid">
                    <UserProfileImage userId={user.id} />
                    <div className="user-badge__details" >
                        { user.username !== null && <div className="user-badge__name"><Link to={ `/${user.username}` }>{user.name}</Link></div>}
                        { user.username === null && user.email !== null && <div className="user-badge__name">{ user.email }</div> }
                        <div className="user-badge__about">{ user.about?.length > 100 ? user.about.substring(0,100).trim()+'...' : user.about }</div>
                        <div className="controls">
                            { children }
                        </div>
                    </div> 
                </div>
            </ListGridContentItem>
        )
    } else {
        return (null)
    }

}

export default UserBadge 
