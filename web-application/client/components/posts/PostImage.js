import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { getFile, cleanupRequest } from '/state/files'

import Spinner from '/components/Spinner'

import './PostImage.css'

const PostImage = function({ id, className }) {
    // ======= Request Tracking =====================================
    
    const [ requestId, setRequestId ] = useState(null)
    const request = useSelector(function(state) {
        return state.files.requests[requestId]
    })

    
    const post = useSelector(function(state) {
        if ( id in state.posts.dictionary ) {
            return state.posts.dictionary[id]
        } else {
            return null
        }
    })

    if ( ! post ) {
        throw new Error('Post must be rerieved to display profile image.')
    }

    const file = useSelector(function(state) {
        if ( post.fileId !== null && post.fileId in state.files.dictionary ) {
            return state.files.dictionary[post.fileId]
        } else {
            return null
        }
    })

    // ======= Effect Handling ======================================
    
    const dispatch = useDispatch()

    useEffect(function() {
        if ( post.fileId !== null ) {
            setRequestId(dispatch(getFile(post.fileId)))
        }
    }, [ post.fileId ])

    // Cleanup our request.
    useEffect(function() {
        return function cleanup() {
            if ( requestId ) {
                dispatch(cleanupRequest({ requestId: requestId }))
            }
        }
    }, [ requestId])

    let content = ( <Spinner local={true} /> )
    if ( post.fileId && file ) {
        const url = new URL(file.filepath, file.location)
        content = (
            <img src={url.href} />
        )
    } else if ( ! post.fileId || request && request.state == 'fulfilled' ) {
        return null
    }


    return (
        <>
        <div className={ className ? `post-image ${className}` : "post-image"}>
            {content}
        </div>
        </>
    )
}

export default PostImage
