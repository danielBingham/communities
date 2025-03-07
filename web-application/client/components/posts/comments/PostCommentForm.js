import React, {useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import logger from '/logger'

import { useRequest } from '/lib/hooks/useRequest'
import { extractMentionData, createMention, insertMention, convertMentionsForStorage } from '/lib/mentions'
import MentionsDropdown from '/components/mentions/MentionsDropdown'

import { postPostComments, patchPostComment, finishPostCommentEdit } from '/state/postComments'

import Button from '/components/generic/button/Button'
import Spinner from '/components/Spinner'

import './PostCommentForm.css'

const PostCommentForm = function({ postId, commentId, setShowComments }) {
    const [showForm, setShowForm ] = useState(false)

    const [content, setContent] = useState('')
    const [mentions, setMentions] = useState([])
    const [mentionData, setMentionData] = useState(null)
    const [cursorPosition, setCursorPosition] = useState(0)
    const textareaRef = useRef(null)

    const [error, setError] = useState('')

    const [postRequest, makePostRequest] = useRequest()
    const [patchRequest, makePatchRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)

    if (!currentUser) {
        logger.error(new Error('Attempt to load PostCommentForm without logged in user.'))
        return null
    }

    const comment = useSelector((state) => commentId && commentId in state.postComments.dictionary ? state.postComments.dictionary[commentId] : null) 
    
    const dispatch = useDispatch()

    const getDraftKey = function() {
        if (commentId) {
            return `commentDraft.${postId}.${commentId}`
        } else {
            return `commentDraft.${postId}`
        }
    }

    const startComment = function() {
        const draft = {
            content: '',
            mentions: []
        }

        localStorage.setItem(`commentDraft.${postId}`, JSON.stringify(draft))
        setShowForm(true)
        setShowComments(true)
    }

    const submit = function() {
        // Convert mentions to storage format
        const { storageMentions } = convertMentionsForStorage(content, mentions)
        
        const newComment = {
            postId: postId,
            userId: currentUser.id,
            content: content,
            mentions: storageMentions
        }

        if (!commentId) {
            makePostRequest(postPostComments(newComment))
        } else {
            newComment.id = commentId
            makePatchRequest(patchPostComment(newComment))
        }
    }

    const cancel = function() {
        localStorage.removeItem(getDraftKey())

        setContent('')
        setMentions([])
        setError('')
        setShowForm(false)

        if (commentId) {
            dispatch(finishPostCommentEdit(commentId))
        }
    }

    const onChange = function(event) {
        const newContent = event.target.value
        if (newContent.length > 5000) {
            setError('length')
        } else {
            setError('')
            setContent(newContent)
            
            // Check for mentions
            const { mentionData: newMentionData } = extractMentionData(
                newContent, 
                event.target.selectionStart
            )
            setMentionData(newMentionData)
            setCursorPosition(event.target.selectionStart)
        }
    }
    
    const handleSelectMention = (user, position, query) => {
        const mention = createMention(user, position, query)
        const { text: newText, cursorPosition: newCursorPosition } = insertMention(
            content,
            mention,
            cursorPosition
        )
        
        setContent(newText)
        setMentions([...mentions, mention])
        setMentionData(null)
        
        // Set focus back to textarea and update cursor position
        if (textareaRef.current) {
            textareaRef.current.focus()
            setTimeout(() => {
                textareaRef.current.selectionStart = newCursorPosition
                textareaRef.current.selectionEnd = newCursorPosition
            }, 0)
        }
    }
    
    const handleCloseMentions = () => {
        setMentionData(null)
    }

    // Initialize content to the content of our comment, if we have one.
    useEffect(function() {
        let draft = {
            content: comment ? comment.content : '',
            mentions: comment && comment.mentions ? comment.mentions : []
        }

        const existingDraft = JSON.parse(localStorage.getItem(getDraftKey()))
        if (existingDraft) {
            draft = existingDraft
            setShowForm(true)
        } else if (commentId && comment) {
            localStorage.setItem(getDraftKey(), JSON.stringify(draft))
        }

        setContent(draft.content)
        setMentions(draft.mentions || [])
    }, [commentId])

    useEffect(function() {
        if (!postRequest && !patchRequest && (showForm || commentId)) {
            localStorage.setItem(getDraftKey(), JSON.stringify({ 
                content: content,
                mentions: mentions
            }))
        }
    }, [commentId, content, mentions, postRequest, patchRequest])

    useEffect(function() {
        if ((postRequest && postRequest.state == 'fulfilled') || (patchRequest && patchRequest.state == 'fulfilled')) {
            localStorage.removeItem(getDraftKey())

            setContent('')
            setMentions([])
            setError('')

            setShowForm(false)

            if (commentId) {
                dispatch(finishPostCommentEdit(commentId))
            }
        }
    }, [commentId, postRequest, patchRequest])


    let errorView = null
    if (error == 'length') {
        errorView = (<div className="error">Comments are limited to 5000 characters...</div>)
    }

    const inProgress = (patchRequest && patchRequest.state == 'in-progress') || (postRequest && postRequest.state == 'in-progress')
    const draft = localStorage.getItem(getDraftKey())
    if (!commentId && !showForm) {
        return (
            <a href="" onClick={(e) => { e.preventDefault(); startComment() }} className="create-comment">Start a comment...</a>
        )
    } else {
        return (
            <div className="post-comment-form">
                <div className="textarea-container">
                    <textarea
                        ref={textareaRef}
                        onChange={onChange} 
                        value={content}
                        placeholder="Write a comment..."
                    ></textarea>
                    {mentionData && (
                        <MentionsDropdown
                            mentionData={mentionData}
                            onSelectMention={handleSelectMention}
                            onClose={handleCloseMentions}
                        />
                    )}
                </div>
                {errorView}
                {inProgress && <Spinner />}
                {!inProgress && <div className="buttons">
                    <Button type="secondary-warn" onClick={(e) => cancel()}>Cancel</Button>
                    <Button type="primary" onClick={(e) => submit()}>{commentId ? 'Save Edit' : 'Comment'}</Button>
                </div>}
            </div>
        )
    }
}

export default PostCommentForm
