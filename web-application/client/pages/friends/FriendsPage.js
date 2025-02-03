import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'

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

import './FriendsPage.css'

const FriendsPage = function() {
    return (
        <div id="friends-page">
            <menu className="friends-page__menu">
                <li><NavLink to="/friends" end>
                    <UsersIconSolid className="solid" /><UsersIconOutline className="outline" /> <span className="nav-text">Your Friends</span>
                </NavLink> </li>
                <li><NavLink to="/friends/requests" end>
                    <UserPlusIconSolid className="solid" /><UserPlusIconOutline className="outline" /> <span className="nav-text">Friend Requests</span>
                </NavLink></li>
                <li><NavLink to="/friends/find" end>
                    <MagnifyingGlassSolid className="solid" /><MagnifyingGlassOutline className="outline" /> <span className="nav-text">Find Friends</span>
                </NavLink></li>
            </menu>
            <div className="content">
                { <Outlet /> }
            </div>
        </div>
    )
}

export default FriendsPage
