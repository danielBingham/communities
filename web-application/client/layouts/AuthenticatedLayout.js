import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Outlet, useNavigate } from 'react-router-dom'

import { useAuthentication } from '/lib/hooks/useAuthentication'

import WelcomeSplash from '/pages/authentication/WelcomeSplash'

import WelcomeNotice from '/components/notices/WelcomeNotice'
import TermsOfServiceNotice from '/components/notices/TermsOfServiceNotice'

import { PostShareModal } from '/components/posts/Post/PostReactions'

const AuthenticatedLayout = function() {

    const features = useSelector((state) => state.system.features)
    const currentUser = useAuthentication() 

    const navigate = useNavigate()

    useEffect(function() {
        const showTermsNotice = '3-notices' in features && currentUser && ! currentUser.notices?.termsOfService
        if ( showTermsNotice ) {
            navigate('/accept-terms-of-service')
        }
    }, [ currentUser ])

    if ( ! currentUser ) {
        return (
            <WelcomeSplash />
        )
    }

    const showTermsNotice = '3-notices' in features && currentUser && ! currentUser.notices?.termsOfService
    if ( showTermsNotice ) {
        return (
            <div className="authenticated">
                <TermsOfServiceNotice />
            </div>
        )
    }


    let getsWelcomeNotice = '3-notices' in features && currentUser && ! currentUser.notices?.welcomeNotice 
    return (
        <div className="authenticated">
            { getsWelcomeNotice && <WelcomeNotice /> }
            <PostShareModal /> 
            <Outlet />
        </div>
    )
}

export default AuthenticatedLayout

