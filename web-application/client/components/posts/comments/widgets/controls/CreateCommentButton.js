import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { postPostComments, cleanupRequest } from '/state/postComments'

import './CreateCommentButton.css'

const CreateCommentButton = function({ postId }) {

    const [ requestId, setRequestId ] = useState(null)

    const currentUser = useSelector((state) => state.authentication.currentUser)

    if ( ! currentUser ) {
        return null
    }

    const dispatch = useDispatch()

    const createComment = function() {
        const comment = {
            userId: currentUser.id,
            postId: postId,
            status: 'writing',
            content: ''
        }

        setRequestId(dispatch(postPostComments(comment)))
    }

    useEffect(function() {
        if ( requestId ) {
            dispatch(cleanupRequest({ requestId: requestId }))
        }
    }, [ requestId ])


    return (
        <a href="" onClick={(e) => { e.preventDefault(); createComment() }} className="create-comment">Start a comment...</a>
    )

}

export default CreateCommentButton
