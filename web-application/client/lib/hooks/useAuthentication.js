import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

export function useAuthentication() {
    const currentUser = useSelector((state) => state.authentication.currentUser)
    const features = useSelector((state) => state.system.features)

    const navigate = useNavigate()
    useEffect(function() {
        if ( currentUser && currentUser.status == 'invited' ) {
            navigate("/accept-invitation")
            return
        } else if (currentUser && currentUser.status == 'unconfirmed' ) {
            navigate("/email-confirmation")
            return
        }

        const showTermsNotice = '3-notices' in features && currentUser && ! currentUser.notices?.termsOfService
        if ( showTermsNotice ) {
            navigate('/accept-terms-of-service')
            return
        }

        const showContributionNotice = '3-notices' in features && currentUser && ! currentUser.notices?.contribution
        if ( showContributionNotice ) {
            navigate('/set-contribution')
            return
        }
    }, [ currentUser ])

    return currentUser
}

