import React from 'react'
import { useSelector } from 'react-redux'

import './PostImage.css'

const PostImage = function({ id, className }) {
    
    const post = useSelector((state) => id && id in state.posts.dictionary ? state.posts.dictionary[id] : null) 
    const configuration = useSelector((state) => state.system.configuration)

    if ( ! id || ! post ) {
        console.error(new Error(`'props.id' and 'post' are both required for PostImage.`))
        return null
    }

    let content = null 
    if ( post.fileId ) {
        content = (
            <img src={`${configuration.backend}/file/${post.fileId}?width=650`} />
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
