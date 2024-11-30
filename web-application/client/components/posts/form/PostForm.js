import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch} from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { postPosts, cleanupRequest } from '/state/posts'

import FileUploadInput from '/components/files/FileUploadInput'
import Button from '/components/generic/button/Button'

import './PostForm.css'

const PostForm = function() {

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

    const submit = function() {
        const post = {
            userId: currentUser.id,
            fileId: fileId,
            content: content,
            tags: []
        }

        setRequestId(dispatch(postPosts(post)))

        setContent('')
    }

    const onChange = function(event) {
        const newContent = event.target.value
        if ( newContent.length > 10000 ) {
            setError('overlength')
        } else {
            setError('')
            setContent(newContent)
        }
    }

    useEffect(function() {
        if ( request && request.state == 'fulfilled') {
            navigate(`/${currentUser.username}/${request.result.entity.id}`)
        }
    }, [ request ])
    
    useEffect(function() {
        if ( requestId ) {
            dispatch(cleanupRequest({ requestId: requestId }))
        }
    }, [requestId])

    let errorView = null
    if ( error == 'overlength') {
        errorView = (
            <div className="error">Posts are limited to 10,000 characters...</div>
        )
    }

    return (
        <div className="post-form">
            <textarea 
                onChange={onChange} 
                value={content}
                placeholder="Write your post..."
            >
            </textarea>
            { errorView }
            <div className="controls">
                <FileUploadInput fileId={fileId} setFileId={setFileId} types={[ 'image/jpeg', 'image/png' ]} />
                <div className="buttons">
                    <Button type="secondary-warn">Cancel</Button>
                    <Button type="primary" onClick={(e) => submit()}>Post</Button>
                </div>
            </div>
        </div>

    )

}

export default PostForm
