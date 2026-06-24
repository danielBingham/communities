/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
import { useSelector } from 'react-redux'

import { usePost, usePostLink } from '/lib/hooks/Post'

import PostComment from '/components/posts/PostComment'

import Card from '/components/ui/Card'
import Button from '/components/ui/Button'
import Spinner from '/components/Spinner'

import './PostCommentWithContext.css'

const PostCommentWithContext = function({ postCommentId }) {
    const comment = useSelector((state) => postCommentId in state.PostComment.dictionary ? state.PostComment.dictionary[postCommentId] : null)

    const [post, postRequest, reloadPost] = usePost(comment?.postId)
    const link = usePostLink(post?.id)

    if ( comment === undefined || comment === null || postRequest?.state === 'pending') {
        return (
            <div className="post-comment-with-context">
                <div className="post-comment-with-context__not-found">
                    <Spinner />
                </div>
            </div>
        )
    }

    if ( post === undefined || post === null ) {
        return (
            <div className="post-comment-with-context">
                <div className="post-comment-with-context__not-found">
                    <p>404 Post Not Found</p>
                    <Button type="warning" onClick={() => reloadPost()}>Retry</Button>
                </div>
            </div>
        )
    }

    return (
        <Card className="post-comment-with-context">
            <div className="post-comment-with-context__context">
                <a href={`${link}#comment-${postCommentId}`}>View Context</a>
            </div>
            <PostComment postId={comment.postId} id={postCommentId} />
        </Card>
    )
}

export default PostCommentWithContext
