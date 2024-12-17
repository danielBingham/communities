import React, {useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { postPostComments, patchPostComment, deletePostComment, cleanupRequest, finishPostCommentEdit } from '/state/postComments'

import Button from '/components/generic/button/Button'
import Spinner from '/components/Spinner'

import './PostCommentForm.css'

const PostCommentForm = function({ postId, commentId, setShowComments }) {
    const [showForm, setShowForm ] = useState(false)

    const [ content, setContent ] = useState('')

    const [ error, setError ] = useState('')

    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        if ( requestId in state.postComments.requests ) {
            return state.postComments.requests[requestId]
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

    const getDraftKey = function() {
        if ( commentId ) {
            return `commentDraft.${postId}.${commentId}`
        } else {
            return `commentDraft.${postId}`
        }
    }

    const startComment = function() {
        const draft = {
            content: ''
        }

        localStorage.setItem(`commentDraft.${postId}`, JSON.stringify(draft))
        setShowForm(true)
        setShowComments(true)
    }

    const submit = function() {
        console.log(`Submit Comment(${commentId}) on Post(${postId}).`)
        const newComment = {
            postId: postId,
            userId: currentUser.id,
            status: 'posted',
            content: content
        }

        if ( ! commentId ) {
            console.log(`Posting comment for Post(${postId}).`)
            setRequestId(dispatch(postPostComments(newComment)))
        } else {
            console.log(`Patching Comment(${commentId}) on Post(${postId}).`)
            newComment.id = commentId
            setRequestId(dispatch(patchPostComment(newComment)))
        }
    }

    const cancel = function() {
        localStorage.removeItem(getDraftKey())

        setContent('')
        setError('')
        setShowForm(false)

        if ( commentId ) {
            dispatch(finishPostCommentEdit(commentId))
        }
    }

    const onChange = function(event) {
        const newContent = event.target.value
        if ( newContent.length > 5000) {
            setError('length')
        } else {
            setError('')
            setContent(newContent)
        }

    }

    // Initialize content to the content of our comment, if we have one.
    useEffect(function() {
        console.log(`Initializing for Post(${postId}) and Comment(${commentId}).`)
        let draft = {
            content: comment ? comment.content : ''
        }

        const existingDraft = JSON.parse(localStorage.getItem(getDraftKey()))
        console.log(`Existing draft for Key(${getDraftKey()}): ${localStorage.getItem(getDraftKey())}`)
        if ( existingDraft ) {
            draft = existingDraft
            setShowForm(true)
        } else if ( commentId && comment ) {
            console.log(`Initializing Draft for key: ${getDraftKey()}`)
            localStorage.setItem(getDraftKey(), JSON.stringify(draft))
        }

        setContent(draft.content)
    }, [ commentId ])

    useEffect(function() {
        console.log(`Updating local storage for Post(${postId}) and Comment(${commentId})`)
        if ( ! request && (showForm || commentId )) {
            localStorage.setItem(getDraftKey(), JSON.stringify({ content: content }))
        }
    }, [ commentId, content, request])

    useEffect(function() {
        console.log(`Checking Request(${requestId}) in State(${request?.state}) for Post(${postId}) and Comment(${commentId})`)
        if ( request && request.state == 'fulfilled') {
            console.log(`Request completed for Post(${postId}) and Comment(${commentId})`)
            localStorage.removeItem(getDraftKey())

            setContent('')
            setError('')

            setRequestId(null)
            setShowForm(false)

            if ( commentId ) {
                dispatch(finishPostCommentEdit(commentId))
            }
        }
    }, [ commentId, request ])

    useEffect(function() {
        console.log(`Setting request cleanup for id: ${requestId}`)
        return function cleanup() {
            console.log(`Cleaning up request: ${requestId}.`)
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId ])

    if ( ! currentUser ) {
        return null
    }

    if ( request && request.state == 'pending' ) {
        return (
            <div className="post-comment-form">
                <Spinner local={true} />
            </div>
        )
    }

    let errorView = null
    if ( error == 'length' ) {
        errorView = ( <div className="error">Comments are limited to 5000 characters...</div> )
    }

    const draft = localStorage.getItem(getDraftKey())
    console.log(`postId: ${postId}, commentId: ${commentId}, showForm: ${showForm}, Request: ${request?.state}, draft: ${draft}`)
    if ( ! commentId && ! showForm ) {
        return (
            <a href="" onClick={(e) => { e.preventDefault(); startComment() } } className="create-comment">Start a comment...</a>
        )
    } else {
        return (
            <div className="post-comment-form">
                <textarea
                    onChange={onChange} 
                    value={content}
                    placeholder="Write a comment..."
                ></textarea>
                { errorView }
                <div className="buttons">
                    <Button type="secondary-warn" onClick={(e) => cancel()}>Cancel</Button>
                    <Button type="primary" onClick={(e) => submit()}>{ commentId ? 'Save Edit' : 'Comment' }</Button>
                </div>
            </div>
        )
    }
}

export default PostCommentForm
