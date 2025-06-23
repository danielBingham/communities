import React  from 'react'

import PostList from '/components/posts/PostList'

import './PostsByUserFeed.css'

const PostsByUserFeed = function({ id }) {
    return (
        <div className="posts-by-user-feed">
            <PostList name="PostsByUser" />
        </div>
    )

}

export default PostsByUserFeed
