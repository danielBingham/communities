import React from 'react'
import { useSelector } from 'react-redux'
import { Link, useLocation } from 'react-router-dom'

import { PlusIcon } from '@heroicons/react/24/solid'

import { useGroup } from '/lib/hooks/Group'
import { usePostDraft } from '/lib/hooks/usePostDraft'

import UserProfileImage from '/components/users/UserProfileImage'
import Button from '/components/ui/Button'

import './CreatePostButton.css'

const CreatePostButton = function({ type, groupId }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const location = useLocation()

    const [group, request] = useGroup(groupId)
    const [draft, setDraft] = usePostDraft(undefined, groupId)

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
                        { draft && draft.content.length > 0 && <span>{ draft.content }</span> }
                        { ( ! draft || draft.content.length <= 0) && <span>Write a new post { groupId && group ? `to ${group.title}` : 'to your feed' }...</span> }
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
