import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, Link, useParams } from 'react-router-dom'

import { 
    UserGroupIcon as UserGroupIconOutline,
    UsersIcon as UsersIconOutline,
    UserPlusIcon as UserPlusIconOutline
} from '@heroicons/react/24/outline'

import { 
    UserGroupIcon as UserGroupIconSolid,
    UsersIcon as UsersIconSolid,
    UserPlusIcon as UserPlusIconSolid
} from '@heroicons/react/24/solid'

import Spinner from '/components/Spinner'

import YourFriendsList from '/components/friends/YourFriendsList'
import FriendRequestsList from '/components/friends/FriendRequestsList'
import UserListView from '/components/users/list/UserListView'

import './FriendsPage.css'

const FriendsPage = function() {
    const { pageTab } = useParams()

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const navigate = useNavigate()
    useEffect(function() {
        if ( ! currentUser ) {
            navigate("/")
        }
    }, [ currentUser ])

    if ( ! currentUser ) {
        return (
            <div id="friends-page">
                <Spinner />
            </div>
        )
    }

    const selectedTab = ( pageTab ? pageTab : 'friends')

    let content = ( <Spinner local={true} /> )
    if ( selectedTab == 'friends' ) {
        content = ( <YourFriendsList /> ) 
    } else if ( selectedTab == 'requests' ) {
        content = ( <FriendRequestsList /> ) 
    } else if ( selectedTab == 'browse' ) {
        content = ( <UserListView /> ) 
    } 

    return (
        <div id="friends-page">
            <ul className="right-sidebar">
                <li className={ selectedTab == 'friends' ? 'active' : '' }>
                    { selectedTab == 'friends' ? <UsersIconSolid /> : <UsersIconOutline /> } <Link to="/friends">Your Friends</Link>
                </li>
                <li className={ selectedTab == 'requests' ? 'active' : '' }>
                    { selectedTab == 'requests' ? <UserPlusIconSolid /> : <UserPlusIconOutline /> } <Link to="/friends/requests">Friend Requests</Link>
                </li>
                <li className={ selectedTab == 'browse' ? 'active' : '' }>
                    { selectedTab == 'browse' ? <UserGroupIconSolid /> : <UserGroupIconOutline /> } <Link to="/friends/browse">Browse for Friends</Link>
                </li>
            </ul>
            <div className="content">
                { content }
            </div>
        </div>
    )
}

export default FriendsPage
