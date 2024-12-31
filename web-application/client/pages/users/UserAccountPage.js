import React, { useEffect } from 'react'
import { useSelector} from 'react-redux'
import { useParams, Link } from 'react-router-dom'

import { 
    UserCircleIcon as UserCircleIconOutline, 
    EnvelopeIcon as EnvelopIconOutline, 
    LockClosedIcon as LockClosedIconOutline,
    CreditCardIcon as CreditCardIconOutline,
    Cog8ToothIcon as Cog8IconOutline
} from '@heroicons/react/24/outline'

import { 
    UserCircleIcon as UserCircleIconSolid, 
    EnvelopeIcon as EnvelopIconSolid, 
    LockClosedIcon as LockClosedIconSolid,
    CreditCardIcon as CreditCardIconSolid,
    Cog8ToothIcon as Cog8IconSolid
} from '@heroicons/react/24/solid'

import Spinner from '/components/Spinner'
import { Page, PageBody, PageHeader, PageTabBar, PageTab } from '/components/generic/Page'

import UserProfileEditForm from '/components/users/account/UserProfileEditForm'

import ChangePasswordForm from '/components/users/account/widgets/ChangePasswordForm'
import ChangeEmailForm from '/components/users/account/widgets/ChangeEmailForm'
import ContributionView from '/components/contribution/ContributionView'
import UserAccountSettingsView from '/components/users/account/UserAccountSettingsView'

import LoginForm from '/components/authentication/LoginForm'

import './UserAccountPage.css'

const UserAccountPage = function(props) {

    const { pageTab } = useParams()

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })
   

    // ======= Render =====================================

    // Protect this page so the user must be logged in.
    if ( ! currentUser ) {
        return (
            <LoginForm />
        )
    }

    const selectedTab = ( pageTab ? pageTab : 'profile')

    let content = ( <Spinner local={true} /> )
    if ( selectedTab == 'profile' ) {
        content = ( <UserProfileEditForm /> )
    } else if ( selectedTab == 'change-password' ) {
        content = ( <ChangePasswordForm /> )
    } else if ( selectedTab == 'change-email' ) {
        content = ( <ChangeEmailForm /> )
    } else if ( selectedTab == 'contribute' ) {
        content = ( <ContributionView /> )
    } else if (selectedTab == 'settings') {
        content = ( <UserAccountSettingsView /> )
    }

    return (
        <div id="user-account-page">
            <ul className="menu">
                <li className={ selectedTab == 'profile' ? 'active' : '' }>
                    <Link to="/account/profile">{ selectedTab == 'profile' ? <UserCircleIconSolid /> : <UserCircleIconOutline /> } <span className="nav-text">Edit Profile</span></Link>
                </li>
                <li className={ selectedTab == 'change-email' ? 'active' : '' }>
                    <Link to="/account/change-email">{ selectedTab == 'change-email' ? <EnvelopIconSolid /> : <EnvelopIconOutline /> } <span className="nav-text">Change Email</span></Link>
                </li>
                <li className={ selectedTab == 'change-password' ? 'active' : '' }>
                    <Link to="/account/change-password">{ selectedTab == 'change-password' ? <LockClosedIconSolid/> : <LockClosedIconOutline/> } <span className="nav-text">Change Password</span></Link>
                </li>
                <li className={ selectedTab == 'contribute' ? 'active' : '' }>
                    <Link to="/account/contribute">{ selectedTab == 'contribute' ? <CreditCardIconSolid /> : <CreditCardIconOutline /> } <span className="nav-text">Contribution</span></Link>
                </li>
                <li className={ selectedTab == 'settings' ? 'active' : ''}>
                    <Link to="/account/settings">{ selectedTab == 'settings' ? <Cog8IconSolid /> : <Cog8IconOutline /> } <span className="nav-text">Settings</span></Link>
                </li>
            </ul>
            <div className="content">
                { currentUser && content }
            </div>
        </div>
    )

}

export default UserAccountPage
