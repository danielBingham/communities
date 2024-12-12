import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch} from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { postPosts, cleanupRequest } from '/state/posts'

import FileUploadInput from '/components/files/FileUploadInput'
import Button from '/components/generic/button/Button'

import './PostForm.css'

const PostForm = function({ postId }) {

    const [content,setContent] = useState('')
    const [fileId,setFileId] = useState(null)

    const [error,setError] = useState('')

    const [requestId,setRequestId] = useState(null)
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

    const dispatch = useDispatch()
    const navigate = useNavigate()

    const getDraftKey = function() {
        if ( postId ) {
            return `draft.${postId}`
        } else {
            return `draft`
        }
    }

    const submit = function() {
        const post = {
            userId: currentUser.id,
            fileId: fileId,
            content: content
        }

        if ( ! postId ) {
            setRequestId(dispatch(postPosts(post)))
        } else { 
            post.id = postId
            setRequestId(dispatch(patchPost(post)))
        }
    }

    const cancel = function() {
        localStorage.removeItem(getDraftKey())

        setFileId(null)
        setContent('')
        setError('')
    }

    const onFileChange = function(fileId) {
        setFileId(fileId)
    }

    const onContentChange = function(event) {
        const newContent = event.target.value
        if ( newContent.length > 10000 ) {
            setError('overlength')
        } else {
            setError('')
            setContent(newContent)
        }
    }

    useEffect(function() {
        let draft = {
            content: '',
            fileId: null
        }

        const existingDraft = JSON.parse(localStorage.getItem(getDraftKey()))
        if ( existingDraft ) {
            draft = existingDraft
        }

        setContent(draft.content)
        setFileId(draft.fileId)
    }, [ postId ])

    useEffect(function() {
        localStorage.setItem(getDraftKey(), JSON.stringify({ content: content, fileId: fileId }))
    }, [ postId, content, fileId ])

    useEffect(function() {
        if ( request && request.state == 'fulfilled') {
            localStorage.removeItem(getDraftKey())
            navigate(`/${currentUser.username}/${request.result.entity.id}`)
        }
    }, [ request ])
    
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [requestId])

    let errorView = null
    if ( error == 'overlength') {
        errorView = (
            <div className="error">Posts are limited to 10,000 characters...</div>
        )
    }

    console.log(`Content: ${content}, FileId: ${fileId}.`)

    return (
        <div className="post-form">
            <textarea 
                onChange={onContentChange} 
                value={content}
            >
            </textarea>
            { errorView }
            <div className="controls">
                <FileUploadInput onChange={onFileChange} fileId={fileId} setFileId={setFileId} types={[ 'image/jpeg', 'image/png' ]} />
                <div className="buttons">
                    <Button type="secondary-warn" onClick={(e) => cancel()}>Cancel</Button>
                    <Button type="primary" onClick={(e) => submit()}>Post</Button>
                </div>
            </div>
        </div>
    )

}

export default PostForm
