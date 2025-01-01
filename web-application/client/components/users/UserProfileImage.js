import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { UserCircleIcon } from '@heroicons/react/24/solid'

import Spinner from '/components/Spinner'

import './UserProfileImage.css'

const UserProfileImage = function({ userId, className }) {
    
    // ======= Request Tracking =====================================
    

    // ======= Redux State ==========================================
    
    const user = useSelector(function(state) {
        if ( state.authentication.currentUser && userId == state.authentication.currentUser.id ) {
            return state.authentication.currentUser
        } else if ( userId in state.users.dictionary ) {
            return state.users.dictionary[userId]
        } else {
            return null
        }
    })

    const configuration = useSelector((state) => state.system.configuration)

    if ( ! user ) {
        throw new Error('User must be rerieved to display profile image.')
    }


    // ======= Effect Handling ======================================
    

    // ======= Render ===============================================

    let content = ( <Spinner local={true} /> )
    if ( user?.fileId ) {
        content = (
            <img src={`${configuration.backend}/file/${user.fileId}`} />
        )
    } else if ( ! user?.fileId ) {
        content = (
            <UserCircleIcon />
        )
    }


    return (
        <div className={ className ? `profile-image ${className}` : "profile-image"}>
            {content}
        </div>
    )

}

export default UserProfileImage
