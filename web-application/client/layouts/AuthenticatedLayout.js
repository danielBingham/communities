import React from 'react'
import { useSelector } from 'react-redux'
import { Outlet } from 'react-router-dom'

import { useAuthentication } from '/lib/hooks/useAuthentication'

import WelcomeSplash from '/pages/authentication/WelcomeSplash'
import WelcomeNotice from '/components/notices/WelcomeNotice'

const AuthenticatedLayout = function() {

    const features = useSelector((state) => state.system.features)
    const currentUser = useAuthentication() 

    if ( ! currentUser ) {
        return (
            <WelcomeSplash />
        )
    }

    let getsWelcomeNotice = '3-notices' in features && currentUser && ! currentUser.notices?.welcomeNotice 
    return (
        <div className="authenticated">
            { getsWelcomeNotice && <WelcomeNotice /> }
            <Outlet />
        </div>
    )
}

export default AuthenticatedLayout

