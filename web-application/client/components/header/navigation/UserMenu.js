import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { 
    UserCircleIcon,
    EnvelopeIcon,
    LockClosedIcon,
    CreditCardIcon,
    Cog8ToothIcon,
    DocumentIcon,
    PencilIcon,
    ArrowRightOnRectangleIcon,
    AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'


import { deleteAuthentication } from '/state/authentication'

import './UserMenu.css'

/**
 * Provide a user controls navigation block to be used in navigation menus.
 *
 * @param {object} props    The standard React props object - empty.
 */
const UserMenu = function(props) {

    // ======= Request Tracking =====================================

    const [request, makeRequest] = useRequest()

    // ======= Redux State ==========================================

    const currentUser = useSelector((state) => state.authentication.currentUser)

    // ======= Actions and Event Handling ===========================

    /**
     * Handle a Logout request by dispatching the appropriate action.
     *
     * TODO Track this request and show an error if the attempt to deleteAuthentication
     * fails.  Cleanup the request when we're done.
     *
     * @param {object} event - Standard event object.
     */
    const handleLogout = function(event) {
        event.preventDefault()

        // Clear local storage so their drafts don't carry over to another
        // login session.
        localStorage.clear()

        makeRequest(deleteAuthentication())
    }

    // ======= Effect Handling ======================================

    // ======= Render ===============================================

    const isAdmin = currentUser.permissions == 'admin' || currentUser.permissions == 'superadmin'
    return (
        <div id="user-menu" className="floating-menu" style={{ display: ( props.visible ? 'block' : 'none' ) }} >
            <div className="menu-section">
                <div className="menu-item" onClick={props.toggleMenu}><Link to={`/${currentUser.username}`}><UserCircleIcon />My Profile</Link></div>
            </div>
            <div className="menu-section">
                <div className="menu-item" onClick={props.toggleMenu}><Link to="/account/profile"><PencilIcon/>Edit Profile</Link></div>
                <div className="menu-item" onClick={props.toggleMenu}><Link to="/account/change-email"><EnvelopeIcon />Change Email</Link></div>
                <div className="menu-item" onClick={props.toggleMenu}><Link to="/account/change-password"><LockClosedIcon />Change Password</Link></div>
                <div className="menu-item" onClick={props.toggleMenu}><Link to="/account/contribute"><CreditCardIcon /> Contribute</Link></div>
                <div className="menu-item" onClick={props.toggleMenu}><Link to="/account/settings"><Cog8ToothIcon />Settings</Link></div>
            </div>
            { isAdmin && <div className="menu-section admin">
                <div className="menu-item" onClick={props.toggleMenu}><Link to="/admin"><AdjustmentsHorizontalIcon/>Admin</Link></div>
            </div> }
            <div className="menu-section bottom"> 
                <div className="menu-item" onClick={props.toggleMenu}><a href="" className="logout" onClick={handleLogout} ><ArrowRightOnRectangleIcon/>Log Out</a></div>
            </div>
        </div>
    )

}

export default UserMenu 
