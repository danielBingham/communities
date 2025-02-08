import React from 'react'
import {  useSelector } from 'react-redux'

import { UserCircleIcon } from '@heroicons/react/24/solid'

import './UserProfileImage.css'

const UserProfileImage = function({ userId, className }) {
    
    // ======= Request Tracking =====================================
    

    // ======= Redux State ==========================================
    
    const user = useSelector(function(state) {
        if ( ! userId ) {
            return null
        }

        if ( state.authentication.currentUser && userId == state.authentication.currentUser.id ) {
            return state.authentication.currentUser
        } else if ( userId in state.users.dictionary ) {
            return state.users.dictionary[userId]
        } else {
            return null
        }
    })

    const configuration = useSelector((state) => state.system.configuration)

    // ======= Effect Handling ======================================
    

    // ======= Render ===============================================

    let content = ( <UserCircleIcon /> ) 
    if ( user && user.fileId ) {
        content = (
            <img src={`${configuration.backend}/file/${user.fileId}`} />
        )
    } 

    return (
        <div className={ className ? `profile-image ${className}` : "profile-image"}>
            {content}
        </div>
    )

}

export default UserProfileImage
