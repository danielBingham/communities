import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch} from 'react-redux'

import { postPosts, cleanupRequest } from '/state/posts'

import Button from '/components/generic/button/Button'

import './PostForm.css'

const PostForm = function() {

    const [content,setContent] = useState('')

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

    const submit = function() {
        const post = {
            userId: currentUser.id,
            content: content,
            tags: []
        }

        setRequestId(dispatch(postPosts(post)))

        setContent('')
    }
    
    useEffect(function() {
        if ( requestId ) {
            dispatch(cleanupRequest({ requestId: requestId }))
        }
    }, [requestId])

    return (
        <div className="post-form">
            <textarea 
                onChange={(e) => setContent(e.target.value)} 
                value={content}
                placeholder="Write your post..."
            >
            </textarea>
            <div className="buttons">
                <Button type="secondary-warn">Cancel</Button>
                <Button type="primary" onClick={(e) => submit()}>Post</Button>
            </div>
        </div>

    )

}

export default PostForm
