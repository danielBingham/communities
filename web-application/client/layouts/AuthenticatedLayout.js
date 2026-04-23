import { Outlet } from 'react-router-dom'

import { useAuthentication } from '/lib/hooks/useAuthentication'
import { useNotifications } from '/lib/hooks/useNotifications'
import { useHistoryTracking } from '/lib/hooks/useHistoryTracking'

import Header from '/components/header/Header'
import Footer from '/components/header/Footer'
import Spinner from '/components/Spinner'

import WelcomeSplash from '/pages/authentication/WelcomeSplash'

import './AuthenticatedLayout.css'

const AuthenticatedLayout = function() {
    const currentUser = useAuthentication() 
    useNotifications()
    useHistoryTracking()

    if ( ! currentUser ) {
        return (
        <>
        <Header />
        <main id="footerless">
            <WelcomeSplash />
        </main>
        </>
        )
    }

    return (
        <>
        <Header />
        <main id="authenticated">
            <Outlet />
        </main>
        <Footer />
        </>
    )
}

export default AuthenticatedLayout

