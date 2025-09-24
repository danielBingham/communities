import React from 'react'
import { Outlet } from 'react-router-dom'

import { useAuthentication } from '/lib/hooks/useAuthentication'
import { useNotifications } from '/lib/hooks/useNotifications'

import WelcomeSplash from '/pages/authentication/WelcomeSplash'

const AuthenticatedLayout = function() {
    const currentUser = useAuthentication() 
    useNotifications()

    if ( ! currentUser ) {
        return (
            <WelcomeSplash />
        )
    }

    return (
        <div className="authenticated">
            <Outlet />
        </div>
    )
}

export default AuthenticatedLayout

