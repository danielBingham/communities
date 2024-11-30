import React, { useEffect } from 'react'
import { useSelector} from 'react-redux'
import { useNavigate, useParams, Link } from 'react-router-dom'

import { 
    UserCircleIcon as UserCircleIconOutline, 
    EnvelopeIcon as EnvelopIconOutline, 
    LockClosedIcon as LockClosedIconOutline,
    CreditCardIcon as CreditCardIconOutline
} from '@heroicons/react/24/outline'

import { 
    UserCircleIcon as UserCircleIconSolid, 
    EnvelopeIcon as EnvelopIconSolid, 
    LockClosedIcon as LockClosedIconSolid,
    CreditCardIcon as CreditCardIconSolid
} from '@heroicons/react/24/solid'

import Spinner from '/components/Spinner'
import { Page, PageBody, PageHeader, PageTabBar, PageTab } from '/components/generic/Page'

import UserProfileEditForm from '/components/users/account/UserProfileEditForm'

import ChangePasswordForm from '/components/users/account/widgets/ChangePasswordForm'
import ChangeEmailForm from '/components/users/account/widgets/ChangeEmailForm'
import ContributionView from '/components/contribution/ContributionView'

import './UserAccountPage.css'

const UserAccountPage = function(props) {

    const { pageTab } = useParams()

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })
   
    const navigate = useNavigate()
    useEffect(function() {
        if ( ! currentUser ) {
            navigate('/')
        }
    }, [])

    // ======= Render =====================================

    if ( ! currentUser ) {
        return <Spinner />
    }

    const selectedTab = ( pageTab ? pageTab : 'profile')

    let content = ( <Spinner local={true} /> )
    if ( selectedTab == 'profile' ) {
        content = ( <UserProfileEditForm /> )
    } else if ( selectedTab == 'change-password' ) {
        content = ( <ChangePasswordForm /> )
    } else if ( selectedTab == 'change-email' ) {
        content = ( <ChangeEmailForm /> )
    }  else if ( selectedTab == 'contribute' ) {
        content = ( <ContributionView /> )
    }

    return (
        <div id="user-account-page">
            <div className="right-sidebar">
                <div className={ selectedTab == 'profile' ? 'active' : '' }>
                    { selectedTab == 'profile' ? <UserCircleIconSolid /> : <UserCircleIconOutline /> } <Link to="/account/profile">Edit Profile</Link>
                </div>
                <div className={ selectedTab == 'change-email' ? 'active' : '' }>
                    { selectedTab == 'change-email' ? <EnvelopIconSolid /> : <EnvelopIconOutline /> } <Link to="/account/change-email">Change Email</Link>
                </div>
                <div className={ selectedTab == 'change-password' ? 'active' : '' }>
                    { selectedTab == 'change-password' ? <LockClosedIconSolid/> : <LockClosedIconOutline/> } <Link to="/account/change-password">Change Password</Link>
                </div>
                <div className={ selectedTab == 'contribute' ? 'active' : '' }>
                    { selectedTab == 'contribute' ? <CreditCardIconSolid /> : <CreditCardIconOutline /> } <Link to="/account/contribute">Contribution</Link>
                </div>
            </div>
            <div className="content">
                { currentUser && content }
            </div>
        </div>
    )

}

export default UserAccountPage
