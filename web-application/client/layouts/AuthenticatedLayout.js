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
import { Outlet } from 'react-router-dom'

import { useAuthentication } from '/lib/hooks/useAuthentication'
import { useNotifications } from '/lib/hooks/useNotifications'
import { useHistoryTracking } from '/lib/hooks/useHistoryTracking'
import { isNativePlatform } from '/lib/native'

import Header from '/components/header/Header'
import Footer from '/components/header/Footer'

import WelcomeSplash from '/pages/authentication/WelcomeSplash'
import MobileWelcomeSplash from '/pages/authentication/MobileWelcomeSplash'
import MultifactorAuthenticationPage from '/pages/authentication/MultifactorAuthenticationPage'

import './AuthenticatedLayout.css'

const State = {
    Unauthenticated: 'unauthenticated',
    PendingMultifactor: 'pending-multifactor',
    Authenticated: 'authenticated'
}

const AuthenticatedLayout = function() {
    const pendingUserId = useSelector((state) => state.authentication.pendingUserId)
    const currentUser = useAuthentication() 
    useNotifications()
    useHistoryTracking()

    let state = State.Unauthenticated
    if ( (currentUser === null || currentUser === undefined ) && pendingUserId !== null && pendingUserId !== undefined ) {
        state = State.PendingMultifactor
    } else if ( currentUser !== null && currentUser !== undefined && 'id' in currentUser) {
        state = State.Authenticated
    }

    if ( state === State.Authenticated ) {
        return (
            <>
            <Header />
            <main id="authenticated">
                <Outlet />
            </main>
            <Footer />
            </>
        )
    } else if ( state === State.PendingMultifactor ) {
        return (
            <>
                <main>
                    <MultifactorAuthenticationPage />
                </main>
            </>
        )
    }

    // Fall through to the unauthenticated state.
    // state === State.Unauthenticated
    if ( isNativePlatform() ) {
        return (
            <>
                <main>
                    <MobileWelcomeSplash />
                </main>
            </>
        )

    } else {
        return (
            <>
                <Header />
                <main id="footerless">
                    <WelcomeSplash />
                </main>
            </>
        )
    }
}

export default AuthenticatedLayout

