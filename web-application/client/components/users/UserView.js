import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'
import { useUser } from '/lib/hooks/User'

import { getUser } from '/state/User'

import UserProfileImage from '/components/users/UserProfileImage'
import FriendButton from '/components/friends/FriendButton'
import BlockButton from '/components/friends/BlockButton'

import Spinner from '/components/Spinner'
import { RequestErrorContent } from '/components/errors/RequestError'
import Error404 from '/components/errors/Error404'

import './UserView.css'

const UserView = function(props) {
    const [user, request] = useUser(props.id)

    // ======= Render ===============================================

    // We haven't requested the user yet.
    if ( user === undefined  ) {
        if ( request?.state === 'failed' ) {
            return (
                <article id={props.id} className="user-view">
                    <RequestErrorContent message="Attempt to request User" request={request} />
                </article>
            )
        } else {
            return (
                <article id={props.id} className="user-view">
                    <Spinner />
                </article>
            )
        }
    } 
    // We have requested the user, and we didn't find it.
    else if ( user === null ) {
        return (
            <article id={props.id} className="user-view">
                <Error404 />
            </article>
        )
    }

    return (
        <article id={ user.id } className='user-view'>
            <UserProfileImage userId={user.id} /> 
            <div className="details">
                <div className="name"> { user.name }</div>
                <div className="relationship">
                    <FriendButton userId={user.id} />
                    <BlockButton userId={user.id} />
                </div>
                <div className="about"> { user.about }</div>
            </div>
        </article>
    )
}

export default UserView 
