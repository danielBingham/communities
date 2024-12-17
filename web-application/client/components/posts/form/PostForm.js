import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch} from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { deleteFile, cleanupRequest as cleanupFileRequest } from '/state/files'
import { postPosts, patchPost, cleanupRequest, finishPostEdit } from '/state/posts'

import FileUploadInput from '/components/files/FileUploadInput'
import DraftImageFile from '/components/files/DraftImageFile'
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

    const [deleteRequestId,setDeleteRequestId] = useState(null)
    const deleteRequest = useSelector(function(state) {
        if ( requestId in state.files.requests ) {
            return state.files.requests[requestId]
        } else {
            return null
        }
    })


    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })

    const post = useSelector(function(state) {
        if ( postId in state.posts.dictionary ) {
            return state.posts.dictionary[postId]
        } else {
            return null
        }
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
        const newPost = {
            userId: currentUser.id,
            fileId: fileId,
            content: content
        }

        if ( ! postId ) {
            setRequestId(dispatch(postPosts(newPost)))
        } else { 
            newPost.id = postId
            setRequestId(dispatch(patchPost(newPost)))
            
            if ( post.fileId !== fileId ) {
                setDeleteRequestId(dispatch(deleteFile(post.fileId)))
            }

            dispatch(finishPostEdit(postId))
        }
    }

    const cancel = function() {
        localStorage.removeItem(getDraftKey())

        setFileId(null)
        setContent('')
        setError('')

        if ( ! post || ( fileId !== null && post.fileId !== fileId )) {
            setDeleteRequestId(dispatch(deleteFile(fileId)))
        }

        if ( postId ) {
            dispatch(finishPostEdit(postId))
        }
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
            content: post ? post.content : '',
            fileId: post ? post.fileId : null
        }

        const existingDraft = JSON.parse(localStorage.getItem(getDraftKey()))

        if ( existingDraft ) {
            draft = existingDraft
        } else {
            localStorage.setItem(getDraftKey(), JSON.stringify(draft))
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

    useEffect(function() {
        return function cleanup() {
            if ( deleteRequestId ) {
                dispatch(cleanupFileRequest({ requestId: deleteRequestId }))
            }
        }
    }, [ deleteRequestId ])

    let errorView = null
    if ( error == 'overlength') {
        errorView = (
            <div className="error">Posts are limited to 10,000 characters...</div>
        )
    }

    let imageView = null
    if ( fileId ) {
        imageView = (
            <DraftImageFile fileId={fileId} setFileId={setFileId} width={150} deleteOnRemove={ ! post || post.fileId != fileId } />
        )
    } else {
        imageView = (
            <FileUploadInput onChange={onFileChange} fileId={fileId} setFileId={setFileId} types={[ 'image/jpeg', 'image/png' ]} />
        )
    }

    return (
        <div className="post-form">
            <textarea 
                onChange={onContentChange} 
                value={content}
                placeholder="Write your post..."
            >
            </textarea>
            { errorView }
            <div className="controls">
                { imageView }
                <div className="buttons">
                    <Button type="secondary-warn" onClick={(e) => cancel()}>Cancel</Button>
                    <Button type="primary" onClick={(e) => submit()}>Post</Button>
                </div>
            </div>
        </div>
    )

}

export default PostForm
