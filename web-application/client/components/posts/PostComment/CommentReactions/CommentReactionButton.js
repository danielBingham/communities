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

import { useRequest } from '/lib/hooks/useRequest'
import { useCommentReactions } from '/lib/hooks/CommentReaction'

import { postCommentReaction, deleteCommentReaction } from '/state/CommentReaction'

import { HandThumbUpIcon as HandThumbUpOutlineIcon } from '@heroicons/react/24/outline'
import { HandThumbUpIcon } from '@heroicons/react/16/solid'

import './CommentReactions.css'

/**
 * The thumbs up button for a PostComment.  Likes the comment, or removes the
 * current user's like if they've already liked it.
 *
 * @param {object} props
 * @param {string} props.postId The id of the Post the comment is on.
 * @param {string} props.commentId The id of the PostComment.
 */
const CommentReactionButton = function({ postId, commentId }) {
    const [request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const { comment, userReaction } = useCommentReactions(commentId)

    if ( ! comment ) {
        return null
    }

    const toggleLike = function() {
        if ( ! currentUser || request?.state === 'pending' ) {
            return
        }

        if ( userReaction ) {
            makeRequest(deleteCommentReaction({ postId: postId, commentId: commentId }))
        } else {
            makeRequest(postCommentReaction({ postId: postId, commentId: commentId, reaction: 'like' }))
        }
    }

    const liked = userReaction?.reaction === 'like'

    return (
        <a
            href=""
            role="button"
            aria-pressed={liked}
            aria-label={ liked ? 'Unlike comment' : 'Like comment' }
            className={`comment-reactions__like ${ liked ? 'reacted' : ''}`}
            onClick={(e) => { e.preventDefault(); toggleLike() }}
        >{ liked ? <HandThumbUpIcon aria-hidden="true" /> : <HandThumbUpOutlineIcon aria-hidden="true" /> }</a>
    )
}

export default CommentReactionButton
