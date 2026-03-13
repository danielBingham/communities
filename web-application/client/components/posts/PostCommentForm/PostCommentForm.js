/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
import {useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import logger from '/logger'

import { useRequest } from '/lib/hooks/useRequest'

import { postPostComments, patchPostComment, finishPostCommentEdit } from '/state/PostComment'

import Button from '/components/ui/Button'
import Spinner from '/components/Spinner'
import AreYouSure from '/components/AreYouSure'

import TextAreaWithMentions from '/components/posts/TextAreaWithMentions'

import './PostCommentForm.css'

const PostCommentForm = function({ postId, groupId, commentId, setShowComments }) {
    const [showForm, setShowForm ] = useState(false)

    const [ content, setContent ] = useState('')

    const [ error, setError ] = useState('')
    const [ areYouSure, setAreYouSure ] = useState(false)

    const [postRequest, makePostRequest] = useRequest()
    const [patchRequest, makePatchRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)

    if ( ! currentUser ) {
        logger.error(new Error('Attempt to load PostCommentForm without logged in user.'))
        return null
    }

    const comment = useSelector((state) => commentId && commentId in state.PostComment.dictionary ? state.PostComment.dictionary[commentId] : null) 
    
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

        setAreYouSure(false)
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
                    postId={postId}
                    groupId={groupId}
                />
                { errorView }
                { inProgress && <div className="buttons"><Spinner /></div> }
                { ! inProgress && <div className="buttons">
                    <Button onClick={(e) => setAreYouSure(true)}>Cancel</Button>
                    <Button type="primary" onClick={(e) => submit()}>{ commentId ? 'Save Edit' : 'Comment' }</Button>
                </div> }
                <AreYouSure isVisible={areYouSure} execute={cancel} cancel={() => setAreYouSure(false)}>
                    <p>Are you sure you want to cancel? Your draft will be lost.</p>
                </AreYouSure>
            </div>
        )
    }
}

export default PostCommentForm
