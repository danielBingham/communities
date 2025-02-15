import React, { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { getPosts } from '/state/posts'

import PostList from '/components/posts/list/PostList'

import './PostsByUserFeed.css'

const PostsByUserFeed = function({ id }) {
    return (
        <div className="posts-by-user-feed">
            <PostList name="PostsByUser" />
        </div>
    )

}

export default PostsByUserFeed
