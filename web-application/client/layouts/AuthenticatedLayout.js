import React from 'react'
import { Outlet } from 'react-router-dom'

import { useAuthentication } from '/lib/hooks/useAuthentication'

import WelcomeSplash from '/pages/authentication/WelcomeSplash'

import { PostShareModal } from '/components/posts/Post/PostReactions'

const AuthenticatedLayout = function() {

    const currentUser = useAuthentication() 

    if ( ! currentUser ) {
        return (
            <WelcomeSplash />
        )
    }

    return (
        <div className="authenticated">
            <PostShareModal /> 
            <Outlet />
        </div>
    )
}

export default AuthenticatedLayout

