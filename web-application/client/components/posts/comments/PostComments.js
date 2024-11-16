import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import PostCommentForm from '/components/posts/comments/PostCommentForm'
import PostComment from '/components/posts/comments/PostComment'
import CreateCommentButton from '/components/posts/comments/widgets/controls/CreateCommentButton'

import './PostComments.css'

const PostComments = function({ postId }) {

    const post = useSelector(function(state) {
        if ( postId in state.posts.dictionary ) {
            return state.posts.dictionary[postId]
        } else {
            return null
        }
    })

    const comments = useSelector(function(state) {
        if ( postId in state.postComments.commentsByPost ) {
            return state.postComments.commentsByPost[postId]
        } else {
            return null
        }
    })


    let commentViews = []
    let isWriting = false
    if ( post && comments ) {
        for (const commentId of post.comments ) {
            const comment = comments[commentId]
            if ( comment.status == 'writing' || comment.status == 'editing' ) {
                isWriting = comment.status == 'writing'
                commentViews.push(<PostCommentForm key={commentId} postId={postId} commentId={commentId} />)
            } else {
                commentViews.push(<PostComment key={commentId} postId={postId} id={commentId} />)
            }
        }
    }

    return (
        <div className="post-comments">
            { commentViews }
            { ! isWriting &&  <CreateCommentButton postId={postId} /> }
        </div>
    )
}

export default PostComments
