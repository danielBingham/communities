import React from 'react'
import { useSelector } from 'react-redux'

import { useRequest } from '/lib/hooks/useRequest'

import { postPosts } from '/state/posts'

import UserProfileImage from '/components/users/UserProfileImage'

import './CreatePostButton.css'

const CreatePostButton = function() {

    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const postInProgress = useSelector((state) => state.posts.inProgress)

    // Must have a currentUser and no postInProgress to show the button.
    if ( ! currentUser || postInProgress ) {
        return null
    }

    const createPost = function(event) {
        event.preventDefault()
        event.stopPropagation()

        const newPost = {
            userId: currentUser.id,
            fileId: null,
            status: 'writing',
            content: ''
        }
        makeRequest(postPosts(newPost))
    }

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
