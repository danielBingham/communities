import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

export function useAuthentication() {
    const currentUser = useSelector((state) => state.authentication.currentUser)

    const navigate = useNavigate()
    useEffect(function() {
        if ( currentUser ) {
            if ( currentUser.birthdate === '' ) {
                // TECHDEBT If we didn't collect their birthdate at
                // registration then we're just not going to worry about it
                // for now. Only about 120 people in the database won't
                // have a birthdate set. The chance that anyone in that
                // group is underage is pretty damned low. Especially since
                // it is overwhelmingly pulled from my community.
                //
                // We can come back to this in the future if we need to.

            } else {
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

