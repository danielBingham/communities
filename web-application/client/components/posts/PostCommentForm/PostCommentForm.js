import React, {useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import logger from '/logger'

import { useRequest } from '/lib/hooks/useRequest'

import { postPostComments, patchPostComment, finishPostCommentEdit } from '/state/postComments'

import Button from '/components/generic/button/Button'
import Spinner from '/components/Spinner'

import TextAreaWithMentions from '/components/posts/TextAreaWithMentions'

import './PostCommentForm.css'

const PostCommentForm = function({ postId, commentId, setShowComments }) {
    const [showForm, setShowForm ] = useState(false)

    const [ content, setContent ] = useState('')

    const [ error, setError ] = useState('')

    const [postRequest, makePostRequest] = useRequest()
    const [patchRequest, makePatchRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)

    if ( ! currentUser ) {
        logger.error(new Error('Attempt to load PostCommentForm without logged in user.'))
        return null
    }

    const comment = useSelector((state) => commentId && commentId in state.postComments.dictionary ? state.postComments.dictionary[commentId] : null) 
    
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
        const newComment = {
            postId: postId,
            userId: currentUser.id,
            content: content
        }

        if ( ! commentId ) {
            makePostRequest(postPostComments(newComment))
        } else {
            newComment.id = commentId
            makePatchRequest(patchPostComment(newComment))
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

    const onChange = function(newContent) {
        if ( newContent.length > 5000) {
            setError('length')
        } else {
            setError('')
            setContent(newContent)
        }

    }

    // Initialize content to the content of our comment, if we have one.
    useEffect(function() {
        let draft = {
            content: comment ? comment.content : ''
        }

        const existingDraft = JSON.parse(localStorage.getItem(getDraftKey()))
        if ( existingDraft ) {
            draft = existingDraft
            setShowForm(true)
        } else if ( commentId && comment ) {
            localStorage.setItem(getDraftKey(), JSON.stringify(draft))
        }

        setContent(draft.content)
    }, [ commentId ])

    useEffect(function() {
        if ( ! postRequest && ! patchRequest && (showForm || commentId )) {
            localStorage.setItem(getDraftKey(), JSON.stringify({ content: content }))
        }
    }, [ commentId, content, postRequest, patchRequest ])

    useEffect(function() {
        if ( (postRequest && postRequest.state == 'fulfilled') || (patchRequest && patchRequest.state == 'fulfilled')) {
            localStorage.removeItem(getDraftKey())

            setContent('')
            setError('')

            setShowForm(false)

            if ( commentId ) {
                dispatch(finishPostCommentEdit(commentId))
            }
        }
    }, [ commentId, postRequest, patchRequest])


    let errorView = null
    if ( error == 'length' ) {
        errorView = ( <div className="error">Comments are limited to 5000 characters...</div> )
    }

    const inProgress = (patchRequest && patchRequest.state == 'pending') || (postRequest && postRequest.state == 'pending')
    const draft = localStorage.getItem(getDraftKey())

    if ( ! commentId && ! showForm ) {
        return (
            <a href="" onClick={(e) => { e.preventDefault(); startComment() } } className="create-comment">Start a comment...</a>
        )
    } else {
        return (
            <div className="post-comment-form">
                <TextAreaWithMentions
                    value={content}
                    setValue={onChange}
                    placeholder="Write a comment..."
                />
                { errorView }
                { inProgress && <div className="buttons"><Spinner /></div> }
                { ! inProgress && <div className="buttons">
                    <Button type="secondary-warn" onClick={(e) => cancel()}>Cancel</Button>
                    <Button type="primary" onClick={(e) => submit()}>{ commentId ? 'Save Edit' : 'Comment' }</Button>
                </div> }
            </div>
        )
    }
}

export default PostCommentForm
