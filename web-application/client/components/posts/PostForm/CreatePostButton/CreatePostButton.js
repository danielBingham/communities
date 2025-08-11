import React from 'react'
import { useSelector } from 'react-redux'
import { Link, useLocation } from 'react-router-dom'

import { PlusIcon } from '@heroicons/react/24/solid'

import { useGroup } from '/lib/hooks/Group'

import UserProfileImage from '/components/users/UserProfileImage'
import Button from '/components/ui/Button'

import './CreatePostButton.css'

const CreatePostButton = function({ type, groupId }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const location = useLocation()

    const [group, request] = useGroup(groupId)

    // Must have a currentUser and no postInProgress to show the button.
    if ( ! currentUser ) {
        return null
    }

    const params = new URLSearchParams()
    if ( groupId ) {
        params.set('groupId', groupId)
    }
    params.set('origin', location.pathname)

    if ( type === 'form' ) {
        return (
            <div className="create-post">
                <div className="create-post__image-wrapper">
                    <UserProfileImage userId={currentUser.id} />
                </div>
                <div className="create-post__button-wrapper">
                    <Link to={`/create?${ params.toString() }`} className="create-post__button">
                        Write a new post { groupId && group ? `to ${group.title}` : 'to your feed' }...
                    </Link>
                </div>
            </div>
        )
    } else if ( type === 'button' ) {
        return (
            <Button href={`/create?${params.toString()}`} type="primary"><PlusIcon /> <span className="nav-text">Create Post</span></Button>
        )
    }
}

export default CreatePostButton
