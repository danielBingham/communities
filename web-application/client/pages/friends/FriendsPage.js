import React from 'react'
import { useSelector, } from 'react-redux'
import { Link, useParams } from 'react-router-dom'

import { 
    MagnifyingGlassIcon as MagnifyingGlassOutline,
    UsersIcon as UsersIconOutline,
    UserPlusIcon as UserPlusIconOutline
} from '@heroicons/react/24/outline'

import { 
    MagnifyingGlassIcon as MagnifyingGlassSolid,
    UsersIcon as UsersIconSolid,
    UserPlusIcon as UserPlusIconSolid
} from '@heroicons/react/24/solid'

import Spinner from '/components/Spinner'

import WelcomeNotice from '/components/notices/WelcomeNotice'

import YourFriendsList from '/pages/friends/views/YourFriendsList'
import FriendRequestsList from '/pages/friends/views/FriendRequestsList'
import FindFriends from '/pages/friends/views/FindFriends'

import LoginForm from '/components/authentication/LoginForm'

import './FriendsPage.css'

const FriendsPage = function() {
    const { pageTab } = useParams()

    const features = useSelector((state) => state.system.features)
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

    let welcomeNotice = null
    if ( '3-notices' in features && currentUser && ! currentUser.notices?.welcomeNotice ) {
        welcomeNotice = ( <WelcomeNotice /> )
    }

    return (
        <div id="friends-page">
            { welcomeNotice }
            <ul className="menu">
                <li className={ selectedTab == 'friends' ? 'active' : '' }>
                    <Link to="/friends">{ selectedTab == 'friends' ? <UsersIconSolid /> : <UsersIconOutline /> }<span className="nav-text">Your Friends</span></Link>
                </li>
                <li className={ selectedTab == 'requests' ? 'active' : '' }>
                    <Link to="/friends/requests">{ selectedTab == 'requests' ? <UserPlusIconSolid /> : <UserPlusIconOutline /> }<span className="nav-text">Friend Requests</span></Link>
                </li>
                <li className={ selectedTab == 'find' ? 'active' : '' }>
                    <Link to="/friends/find">{ selectedTab == 'find' ? <MagnifyingGlassSolid /> : <MagnifyingGlassOutline /> }<span className="nav-text">Find Friends</span></Link>
                </li>
            </ul>
            <div className="content">
                { content }
            </div>
        </div>
    )
}

export default FriendsPage
