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
import { Outlet } from 'react-router-dom'

import { useAuthentication } from '/lib/hooks/useAuthentication'
import { useNotifications } from '/lib/hooks/useNotifications'
import { useHistoryTracking } from '/lib/hooks/useHistoryTracking'
import { isNativePlatform } from '/lib/native'

import Header from '/components/header/Header'
import Footer from '/components/header/Footer'

import WelcomeSplash from '/pages/authentication/WelcomeSplash'
import MobileWelcomeSplash from '/pages/authentication/MobileWelcomeSplash'

import './AuthenticatedLayout.css'

const AuthenticatedLayout = function() {
    const currentUser = useAuthentication() 
    useNotifications()
    useHistoryTracking()

    if ( ! currentUser && isNativePlatform() ) {
        return (
            <>
                <main>
                    <MobileWelcomeSplash />
                </main>
            </>
        )

    } else if ( ! currentUser ) {
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

