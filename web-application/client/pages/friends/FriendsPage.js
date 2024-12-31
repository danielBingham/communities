import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useLocation, Link, useParams } from 'react-router-dom'

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
import FindFriends from '/components/friends/FindFriends'

import LoginForm from '/components/authentication/LoginForm'

import './FriendsPage.css'

const FriendsPage = function() {
    const { pageTab } = useParams()

    const currentUser = useSelector((state) => state.authentication.currentUser)

    // Protect this page so the user must be logged in.
    if ( ! currentUser ) {
        return (
            <LoginForm />
        )
    }

    const selectedTab = ( pageTab ? pageTab : 'friends')

    let content = ( <Spinner local={true} /> )
    if ( selectedTab == 'friends' ) {
        content = ( <YourFriendsList /> ) 
    } else if ( selectedTab == 'requests' ) {
        content = ( <FriendRequestsList /> ) 
    } else if ( selectedTab == 'find' ) {
        content = ( <FindFriends /> )
    } 

    return (
        <div id="friends-page">
            <ul className="menu">
                <li className={ selectedTab == 'friends' ? 'active' : '' }>
                    <Link to="/friends">{ selectedTab == 'friends' ? <UsersIconSolid /> : <UsersIconOutline /> }<span className="nav-text">Your Friends</span></Link>
                </li>
                <li className={ selectedTab == 'requests' ? 'active' : '' }>
                    <Link to="/friends/requests">{ selectedTab == 'requests' ? <UserPlusIconSolid /> : <UserPlusIconOutline /> }<span className="nav-text">Friend Requests</span></Link>
                </li>
                <li className={ selectedTab == 'find' ? 'active' : '' }>
                    <Link to="/friends/find">{ selectedTab == 'find' ? <UserGroupIconSolid /> : <UserGroupIconOutline /> }<span className="nav-text">Find Friends</span></Link>
                </li>
            </ul>
            <div className="content">
                { content }
            </div>
        </div>
    )
}

export default FriendsPage
