import React from 'react'
import {  useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { UserCircleIcon } from '@heroicons/react/24/solid'

import File from '/components/files/File'
import Image from '/components/ui/Image'

import './UserProfileImage.css'

const UserProfileImage = function({ userId, className, noLink, width }) {
    
    // ======= Request Tracking =====================================
    

    // ======= Redux State ==========================================
    
    const user = useSelector(function(state) {
        if ( ! userId ) {
            return null
        }

        if ( state.authentication.currentUser && userId == state.authentication.currentUser.id ) {
            return state.authentication.currentUser
        } else if ( userId in state.User.dictionary ) {
            return state.User.dictionary[userId]
        } else {
            return null
        }
    })

    const configuration = useSelector((state) => state.system.configuration)

    // ======= Effect Handling ======================================
    

    // ======= Render ===============================================


    let content = ( <UserCircleIcon /> ) 
    if ( user && user.fileId ) {
        if ( noLink === true ) {
            content = (
                <File id={user.fileId} width={200} type="image" fallback={'UserCircle'} />
            )

        } else {
            content = (
                <Link to={`/${user.username}`}><File id={user.fileId} width={200} type="image" fallback={'UserCircle'} /></Link>
            )
        }
    } 

    return (
        <div className={ className ? `profile-image ${className}` : "profile-image"}>
            {content}
        </div>
    )

}

export default UserProfileImage
