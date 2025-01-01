import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import Spinner from '/components/Spinner'

import './PostImage.css'

const PostImage = function({ id, className }) {
    
    const post = useSelector(function(state) {
        if ( id in state.posts.dictionary ) {
            return state.posts.dictionary[id]
        } else {
            return null
        }
    })

    const configuration = useSelector((state) => state.system.configuration)

    if ( ! post ) {
        throw new Error('Post must be rerieved to display profile image.')
    }

    // ======= Effect Handling ======================================


    let content = ( <Spinner local={true} /> )
    if ( post.fileId ) {
        content = (
            <img src={`${configuration.backend}/file/${post.fileId}`} />
        )
    } else if ( ! post.fileId ) {
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
