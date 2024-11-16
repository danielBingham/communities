import React, {useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { patchPostComment, deletePostComment, cleanupRequest } from '/state/postComments'

import Button from '/components/generic/button/Button'
import Spinner from '/components/Spinner'

import './PostCommentForm.css'

const PostCommentForm = function({ postId, commentId }) {
    const [ content, setContent ] = useState('')

    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId in state.posts.requests ) {
            return state.posts.requests[requestId]
        } else {
            return null
        }
    })

    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const comment = useSelector(function(state) {
        if ( commentId in state.postComments.dictionary ) {
            return state.postComments.dictionary[commentId]
        } else {
            return null
        }
    })
    
    const dispatch = useDispatch()

    const commit = function() {
        const commentPatch = {
            id: commentId,
            postId: postId,
            userId: currentUser.id,
            status: comment.status,
            content: content
        }

        setRequestId(dispatch(patchPostComment(commentPatch)))
    }

    const submit = function() {
        const commentPatch = {
            id: commentId,
            postId: postId,
            userId: currentUser.id,
            status: 'posted',
            content: content
        }

        setRequestId(dispatch(patchPostComment(commentPatch)))
    }

    const cancel = function() {
        if ( comment.status == 'writing' ) {
            setRequestId(dispatch(deletePostComment(comment)))
        } else if (comment.status == 'editing' ) {
            // TODO We need to implement comment versioning so we can rollback
            // to the previous version.
            const commentPatch = {
                id: commentId,
                postId: postId,
                userId: currentUser.id,
                status: 'posted',
                content: comment.content 
            }

            setRequestId(dispatch(patchPostComment(commentPatch)))
        }
    }

    // Initialize content to the content of our comment, if we have one.
    useEffect(function() {
        if ( comment !== null ) {
            setContent(comment.content)
        }
    }, [ commentId ])

    useEffect(function() {
        if ( requestId ) {
            dispatch(cleanupRequest({ requestId: requestId }))
        }
    }, [ requestId ])

    if ( request && request.state == 'pending' ) {
        return (
            <div className="post-comment-form">
                <Spinner local={true} />
            </div>
        )
    }

    return (
        <div className="post-comment-form">
            <textarea
                onBlur={(e) => commit()}
                onChange={(e) => setContent(e.target.value)} 
                value={content}
                placeholder="Write a comment..."
            ></textarea>
            <div className="buttons">
                <Button type="secondary-warn" onClick={(e) => cancel()}>Cancel</Button>
                <Button type="primary" onClick={(e) => submit()}>Comment</Button>
            </div>
        </div>
    )
}

export default PostCommentForm
