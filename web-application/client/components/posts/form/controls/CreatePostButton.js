import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { postPosts, cleanupRequest } from '/state/posts'

import UserProfileImage from '/components/users/UserProfileImage'

import './CreatePostButton.css'

const CreatePostButton = function() {

    const [requestId, setRequestId] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId in state.posts.requests ) {
            return state.posts.requests[requestId]
        } else {
            return null
        }
    })

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const postInProgress = useSelector((state) => state.posts.inProgress)

    // Must have a currentUser and no postInProgress to show the button.
    if ( ! currentUser || postInProgress ) {
        return null
    }

    const dispatch = useDispatch()

    const createPost = function(event) {
        event.preventDefault()
        event.stopPropagation()

        const newPost = {
            userId: currentUser.id,
            fileId: null,
            status: 'writing',
            content: ''
        }
        setRequestId(dispatch(postPosts(newPost)))
    }

    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    return (
        <div className="create-post">
            <UserProfileImage userId={currentUser.id} />
            <a href="" onClick={createPost} className="create-post-button">
                Write a new post...
            </a>
        </div>
    )

}

export default CreatePostButton
