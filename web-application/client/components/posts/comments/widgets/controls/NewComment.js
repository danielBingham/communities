import React, { useState } from 'react'
import { useSelector } from 'react-redux'

import PostCommentForm from '/components/posts/comments/PostCommentForm'

import './NewComment.css'

const NewComment = function({ postId }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)




    if ( ! showForm && ! draft ) {
        return (
            <a href="" onClick={(e) => { e.preventDefault(); startComment() } } className="create-comment">Start a comment...</a>
        )
    } else {
        return (
            <PostCommentForm postId={postId} />
        )
    }

}

export default NewComment 
