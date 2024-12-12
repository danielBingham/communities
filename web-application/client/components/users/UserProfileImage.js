import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { getFile, cleanupRequest } from '/state/files'

import { UserCircleIcon } from '@heroicons/react/24/solid'

import Spinner from '/components/Spinner'

import './UserProfileImage.css'

const UserProfileImage = function({ userId, className }) {
    
    // ======= Request Tracking =====================================
    
    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        return state.files.requests[requestId]
    })

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


    if ( ! user ) {
        throw new Error('User must be rerieved to display profile image.')
    }

    const file = useSelector(function(state) {
        if ( user.fileId !== null && user.fileId in state.files.dictionary ) {
            return state.files.dictionary[user.fileId]
        } else {
            return null
        }
    })

    // ======= Effect Handling ======================================
    
    const dispatch = useDispatch()

    useEffect(function() {
        if ( user.fileId !== null ) {
            setRequestId(dispatch(getFile(user.fileId)))
        }
    }, [ user.fileId ])

    // Cleanup our request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId])

    let content = ( <Spinner local={true} /> )
    if ( user?.fileId && file ) {
        const url = new URL(file.filepath, file.location)
        content = (
            <img src={url.href} />
        )
    } else if ( ! user.fileId || request && request.state == 'fulfilled' ) {
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
