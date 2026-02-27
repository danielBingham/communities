/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
import { useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'

import { 
    UserCircleIcon,
    EnvelopeIcon,
    LockClosedIcon,
    CreditCardIcon,
    BellIcon,
    ExclamationTriangleIcon,
    PencilIcon,
    ArrowRightOnRectangleIcon,
    AdjustmentsHorizontalIcon,
    MegaphoneIcon
} from '@heroicons/react/24/outline'

import { deleteAuthentication } from '/state/authentication'

import { useRequest } from '/lib/hooks/useRequest'

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuBody, DropdownMenuSection, DropdownMenuItem } from '/components/ui/DropdownMenu'
import Button from '/components/ui/Button'

import UserProfileImage from '/components/users/UserProfileImage'

import './AuthenticationNavigation.css'

/**
 * Provides an Authentication component to be used in navigation menus.  
 *
 * @param {object} props    Standard React props object - empty.
 */
const AuthenticationNavigation = function(props) {

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [request, makeRequest] = useRequest()

    const navigate = useNavigate()

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

    const clickLogin = function(event) {
        navigate('login')
    }

    // ============= Render =======================
    
    if ( currentUser ) {
        const isAdmin = currentUser.siteRole == 'admin' || currentUser.siteRole == 'superadmin'
        return (
            <DropdownMenu className="user-menu user-menu__authenticated" autoClose={true} >
                <DropdownMenuTrigger className="user-menu__trigger logged-in-user">
                    <UserProfileImage userId={currentUser.id} noLink={true} />
                    <span className="navigation-text">{ currentUser.name }</span>
                </DropdownMenuTrigger>
                <DropdownMenuBody className="user-menu__body">
                    <DropdownMenuSection>
                        <DropdownMenuItem href={`/${currentUser.username}`}><UserCircleIcon />My Profile</DropdownMenuItem>
                    </DropdownMenuSection>
                    <DropdownMenuSection>
                        <DropdownMenuItem href="/account/profile"><PencilIcon/>Edit Profile</DropdownMenuItem>
                        <DropdownMenuItem href="/account/change-email"><EnvelopeIcon />Change Email</DropdownMenuItem>
                        <DropdownMenuItem href="/account/change-password"><LockClosedIcon />Change Password</DropdownMenuItem>
                    </DropdownMenuSection>
                    <DropdownMenuSection>
                        <DropdownMenuItem href="/account/preferences"><AdjustmentsHorizontalIcon /> Preferences</DropdownMenuItem>
                        <DropdownMenuItem href="/account/notifications"><BellIcon />Notifications</DropdownMenuItem>
                        <DropdownMenuItem href="/account/danger-zone"><ExclamationTriangleIcon /> Danger Zone</DropdownMenuItem>
                    </DropdownMenuSection>
                    { isAdmin && <DropdownMenuSection className="admin">
                        <DropdownMenuItem href="/admin"><AdjustmentsHorizontalIcon/>Admin</DropdownMenuItem>
                    </DropdownMenuSection> }
                    <DropdownMenuSection>
                        <DropdownMenuItem href="/account/contribute"><CreditCardIcon /> Contribute</DropdownMenuItem>
                        <DropdownMenuItem href="/group/communities-feedback-and-discussion"><MegaphoneIcon /> Give Feedback</DropdownMenuItem>
                    </DropdownMenuSection>
                    <DropdownMenuSection last={true}> 
                        <DropdownMenuItem className="logout" onClick={handleLogout}><ArrowRightOnRectangleIcon/>Log Out</DropdownMenuItem>
                    </DropdownMenuSection>
                </DropdownMenuBody>
            </DropdownMenu>
        )
    } else {
        return (
            <div className="user-menu user-menu__not-authenticated">
                <Button type="primary" onClick={clickLogin}>Log In</Button>
                <Button type="success" onClick={(e) => navigate('register')}>Sign Up</Button>
            </div>
        )
    }

}

export default AuthenticationNavigation 
