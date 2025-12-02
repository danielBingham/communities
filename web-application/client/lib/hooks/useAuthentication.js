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
import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { patchUser } from '/state/User'

export function useAuthentication() {
    const currentUser = useSelector((state) => state.authentication.currentUser)

    const [request, makeRequest] = useRequest()

    const navigate = useNavigate()
    useEffect(function() {
        if ( currentUser ) {

            // We don't actually want to keep their birthdate once we've
            // validated that they pass the Age Gate. We only want to keep it
            // for people who are underage so that we can continue to age gate
            // them.
            //
            // If the birthdate is an empty string, that means its a user we
            // never collected the birthdate from.  If it's null, it's a user
            // who's age has already been validated.
            if ( currentUser.birthdate !== '' && currentUser.birthdate !== null ) {
                const birthdate = new Date(currentUser.birthdate)

                const now = new Date() 

                let age = now.getUTCFullYear() - birthdate.getUTCFullYear()
                const month = now.getUTCMonth() - birthdate.getUTCMonth()
                const day = now.getUTCDate() - birthdate.getUTCDate()

                if ( month < 0 || (month === 0 && day < 0) ) {
                    age = age - 1
                }

                if ( age < 18 ) {
                    // Age gate them.
                    navigate('/age-gate')
                    return 
                } else {
                    // If they've passed the age gate, then delete their
                    // birthdate.

                    const userPatch = {
                        id: currentUser.id,
                        birthdate: null 
                    }
                    makeRequest(patchUser(userPatch))
                }
            }

            if ( currentUser.status == 'invited' ) {
                navigate("/accept-invitation")
                return
            } else if ( currentUser.status == 'unconfirmed' ) {
                navigate("/email-confirmation")
                return
            } else if ( currentUser.status === 'confirmed' ) {
                const showTermsNotice = ! currentUser.notices?.termsOfService
                if ( showTermsNotice ) {
                    navigate('/accept-terms-of-service')
                    return
                }

                const showContributionNotice = ! currentUser.notices?.contribution
                if ( showContributionNotice ) {
                    navigate('/set-contribution')
                    return
                }

            }
        }
    }, [ currentUser ])

    return currentUser
}

