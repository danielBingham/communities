import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'

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

import { Page, PageBody, PageLeftGutter, PageRightGutter } from '/components/generic/Page'
import './UserAccountPage.css'

const UserAccountPage = function(props) {
    return (
        <Page id="user-account-page">
            <PageLeftGutter>
                <menu className="user-account-page__menu">
                    <li><NavLink to="/account/profile" end>
                        <UserCircleIconSolid className="solid" /><UserCircleIconOutline className="outline" /> <span className="nav-text">Profile</span>
                    </NavLink></li>
                    <li><NavLink to="/account/change-email">
                        <EnvelopIconSolid className="solid" /><EnvelopIconOutline className="outline" /> <span className="nav-text">Email</span>
                    </NavLink></li>
                    <li><NavLink to="/account/change-password">
                        <LockClosedIconSolid className="solid" /><LockClosedIconOutline className="outline" /> <span className="nav-text">Password</span>
                    </NavLink></li>
                    <li><NavLink to="/account/contribute">
                        <CreditCardIconSolid className="solid" /><CreditCardIconOutline className="outline" /> <span className="nav-text">Contribution</span>
                    </NavLink></li>
                    <li><NavLink to="/account/settings">
                        <Cog8IconSolid className="solid" /><Cog8IconOutline className="outline" /> <span className="nav-text">Settings</span>
                    </NavLink></li>
                </menu>
            </PageLeftGutter>
            <PageBody className="content">
                <Outlet /> 
            </PageBody>
            <PageRightGutter>
            </PageRightGutter>
        </Page>
    )

}

export default UserAccountPage
