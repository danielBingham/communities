import React from 'react'
import { useSelector } from 'react-redux'

import Image from '/components/ui/Image'

import './PostImage.css'

const PostImage = function({ id, className }) {
    
    const post = useSelector((state) => id && id in state.Post.dictionary ? state.Post.dictionary[id] : null) 
    const configuration = useSelector((state) => state.system.configuration)

    if ( ! id || ! post ) {
        console.error(new Error(`'props.id' and 'post' are both required for PostImage.`))
        return null
    }

    if ( ! post.fileId ) {
        return null
    }

    return (
        <div className={ className ? `post-image ${className}` : "post-image"}>
            <Image id={post.fileId} width={650} />
        </div>
    )
}

export default PostImage
