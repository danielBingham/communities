import React from 'react'
import { useSelector } from 'react-redux'

import DateTag from '/components/DateTag'
import UserTag from '/components/users/UserTag'

import PostReactions from '/components/posts/widgets/PostReactions'

import './Post.css'

const Post = function({ id }) {

    const post = useSelector(function(state) {
        return state.posts.dictionary[id]
    })

    return (
        <div id={post.id} className="post">
            <div className="header"> 
                <UserTag id={post.userId} /> posted <a href={`/post/${id}`}><DateTag timestamp={post.createdDate} /></a>
            </div>
            <div className="content">
                { post.content }
            </div>
            <PostReactions postId={id} />
            <div className="comments">
                <textarea
                    placeholder="Write a comment..."
                    ></textarea>
            </div>
        </div>
    )
}

export default Post
